import * as vscode from "vscode";
import * as path from "node:path";
import { execSync, exec } from "node:child_process";
import { globby } from "globby";

const cachedFilesMap: Map<string, string[]> = new Map();
const watchersMap: Map<string, vscode.FileSystemWatcher> = new Map();

export function activate(context: vscode.ExtensionContext) {
  async function selectWorktree() {
    let worktreeList: Worktree[] | null;
    try {
      worktreeList = await getWorktrees();
    } catch (error) {
      console.log(error);
      throw error;
    }
    if (!worktreeList) {
      vscode.window.showErrorMessage(
        "Failed to get worktrees. Is your repository initialized with Git?"
      );
      return;
    }

    const selectedWorktree = await vscode.window.showQuickPick(
      worktreeList.map((wt) => wt.name),
      { placeHolder: "Select a worktree" }
    );
    if (!selectedWorktree) {
      return;
    }

    const worktreePath = worktreeList.find(
      (wt) => wt.name === selectedWorktree
    )?.path;
    if (!worktreePath) {
      vscode.window.showErrorMessage(
        "Failed to switch worktree. Invalid worktree selected."
      );
      return;
    }

    if (selectedWorktree && worktreePath) {
      context.globalState.update("selectedWorktreePath", worktreePath);
      updateWorktreeStatus(selectedWorktree);

      // context.globalState.update("selectedWorktreePath", worktreePath);
      // Update the cached files and create a watcher for the selected worktree
      await updateCachedFiles(worktreePath);
      createWatcherForWorktree(worktreePath, context);
    }
  }

  function createWatcherForWorktree(
    worktreePath: string,
    context: vscode.ExtensionContext
  ) {
    if (watchersMap.has(worktreePath)) {
      return; // A watcher already exists for this worktree
    }

    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(worktreePath, "**/*.*")
    );
    context.subscriptions.push(watcher);
    watchersMap.set(worktreePath, watcher);

    watcher.onDidCreate(async () => {
      updateCachedFiles(worktreePath);
    });

    watcher.onDidChange(async () => {
      updateCachedFiles(worktreePath);
    });

    watcher.onDidDelete(async () => {
      updateCachedFiles(worktreePath);
    });
  }

  let selectWorktreeCommand = vscode.commands.registerCommand(
    "worktreesnuts.selectWorktree",
    async () => {
      await selectWorktree();
    }
  );
  context.subscriptions.push(selectWorktreeCommand);

  // Create the status bar item
  const worktreeStatus = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    90
  );
  worktreeStatus.command = "worktreesnuts.selectWorktree";
  worktreeStatus.tooltip = "Click to switch worktree";
  context.subscriptions.push(worktreeStatus);

  // Update the status bar item
  updateWorktreeStatus(undefined);

  vscode.workspace.onDidChangeWorkspaceFolders(() => {
    updateWorktreeStatus(undefined);
  });

  async function getFilesInWorktree(worktreePath: string): Promise<string[]> {
    console.log("getting files at worktree", worktreePath);

    return await globby("**/*.*", { gitignore: true, cwd: worktreePath });
  }

  async function gotoFile(context: vscode.ExtensionContext) {
    const worktreePath = context.globalState.get<string>(
      "selectedWorktreePath"
    );
    if (!worktreePath) {
      vscode.window.showErrorMessage("No active worktree selected.");
      return;
    }
    console.log("current worktree path from global state", worktreePath);

    let worktreeFiles = cachedFilesMap.get(worktreePath);
    if (!worktreeFiles) {
      worktreeFiles = await getFilesInWorktree(worktreePath);
      cachedFilesMap.set(worktreePath, worktreeFiles);
    }
    // const files = await getFilesInWorktree(worktreePath);

    const quickPick = vscode.window.createQuickPick();
    quickPick.items = worktreeFiles.map((file) => ({ label: file }));
    quickPick.onDidAccept(() => {
      if (quickPick.selectedItems.length === 0) {
        return;
      }
      const selectedFile = quickPick.selectedItems[0].label;
      const fullFilePath = path.join(worktreePath, selectedFile);
      vscode.workspace.openTextDocument(fullFilePath).then((doc) => {
        vscode.window.showTextDocument(doc);
      });
    });

    quickPick.show();
  }

  async function updateCachedFiles(worktreePath: string) {
    const worktreeFiles = await getFilesInWorktree(worktreePath);
    cachedFilesMap.set(worktreePath, worktreeFiles);
  }

  const gotoFileDisposable = vscode.commands.registerCommand(
    "worktreesnuts.gotoFile",
    () => {
      gotoFile(context);
    }
  );

  async function updateWorktreeStatus(worktreeName: string) {
    worktreeStatus.show();
    if (worktreeName) {
      worktreeStatus.text = `WT: $(git-branch) ${worktreeName}`;
    } else {
      worktreeStatus.text = `WT: $(git-branch) None`;
    }
  }
  context.subscriptions.push(gotoFileDisposable);
}

interface Worktree {
  name: string;
  path: string;
}

async function getWorktrees(): Promise<Worktree[] | null> {
  const gitPath = execSync("which git").toString().trim();
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    return null;
  }

  return new Promise((resolve, reject) => {
    console.log("trying to resolve promise");
    exec(
      `${gitPath} worktree list --porcelain`,
      { cwd: workspaceRoot },
      (error, stdout, stderr) => {
        if (error || stderr) {
          reject(null);
        } else {
          const worktrees: Worktree[] = [];
          let currentWorktree: Worktree | null = null;
          for (const line of stdout.split("\n")) {
            if (line.startsWith("worktree ")) {
              if (currentWorktree) {
                worktrees.push(currentWorktree);
              }
              currentWorktree = {
                name: path.basename(line.slice(9)),
                path: line.slice(9),
              };
            }
          }
          if (currentWorktree) {
            worktrees.push(currentWorktree);
          }
          resolve(worktrees);
        }
      }
    );
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
