import { join } from "path";
import { ExtensionContext, StatusBarItem, window, workspace } from "vscode";
import {
  CachedFilesMap,
  createWatcherForWorktree,
  getFilesInWorktree,
  updateCachedFiles,
} from "./fileSearch";
import { Worktree, getWorktrees } from "./worktrees";

export async function updateWorktreeStatus({
  worktreeName,
  worktreeStatus,
}: {
  worktreeName: string | undefined;
  worktreeStatus: StatusBarItem;
}) {
  worktreeStatus.show();
  if (worktreeName) {
    worktreeStatus.text = `WT: $(git-branch) ${worktreeName}`;
  } else {
    worktreeStatus.text = `WT: $(git-branch) None`;
  }
}

export async function gotoFile({
  context,
  cachedFilesMap,
}: {
  context: ExtensionContext;
  cachedFilesMap: CachedFilesMap;
}) {
  const worktreePath = context.globalState.get<string>("selectedWorktreePath");
  if (!worktreePath) {
    window.showErrorMessage("No active worktree selected.");
    return;
  }

  let worktreeFiles = cachedFilesMap.get(worktreePath);
  if (!worktreeFiles) {
    worktreeFiles = await getFilesInWorktree(worktreePath);
    cachedFilesMap.set(worktreePath, worktreeFiles);
  }

  const quickPick = window.createQuickPick();
  quickPick.items = worktreeFiles.map((file) => ({ label: file }));
  quickPick.onDidAccept(() => {
    if (quickPick.selectedItems.length === 0) {
      return;
    }
    const selectedFile = quickPick.selectedItems[0].label;
    const fullFilePath = join(worktreePath, selectedFile);
    workspace.openTextDocument(fullFilePath).then((doc) => {
      window.showTextDocument(doc);
    });
  });

  quickPick.show();
}

export async function selectWorktree({
  context,
  worktreeStatus,
}: {
  context: ExtensionContext;
  worktreeStatus: StatusBarItem;
}) {
  let worktreeList: Worktree[] | null;
  try {
    worktreeList = await getWorktrees();
  } catch (error) {
    throw error;
  }
  if (!worktreeList) {
    window.showErrorMessage(
      "Failed to get worktrees. Is your repository initialized with Git?"
    );
    return;
  }

  const selectedWorktree = await window.showQuickPick(
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
    window.showErrorMessage(
      "Failed to switch worktree. Invalid worktree selected."
    );
    return;
  }

  if (selectedWorktree && worktreePath) {
    context.globalState.update("selectedWorktreePath", worktreePath);
    updateWorktreeStatus({ worktreeName: selectedWorktree, worktreeStatus });

    // Update the cached files and create a watcher for the selected worktree
    await updateCachedFiles(worktreePath);
    createWatcherForWorktree(worktreePath, context);
  }
}
