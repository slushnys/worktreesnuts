import {
  workspace,
  type ExtensionContext,
  window,
  StatusBarAlignment,
  commands,
} from "vscode";
import { isBareGitRepository } from "./utils";
import { cachedFilesMap } from "./fileSearch";
import { gotoFile, selectWorktree, updateWorktreeStatus } from "./ui";

export async function activate(context: ExtensionContext) {
  const workspaceRoot = workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!workspaceRoot) {
    return;
  }
  const isBareRepository = await isBareGitRepository(workspaceRoot);

  if (!isBareRepository) {
    window.showInformationMessage("This repository is not bare.");
    return;
  }

  const worktreeStatus = window.createStatusBarItem(
    StatusBarAlignment.Right,
    90
  );
  worktreeStatus.command = "worktreesnuts.selectWorktree";
  worktreeStatus.tooltip = "Click to switch worktree";

  let selectWorktreeCommand = commands.registerCommand(
    "worktreesnuts.selectWorktree",
    async () => {
      await selectWorktree({ context, worktreeStatus });
    }
  );

  // Update the status bar item
  updateWorktreeStatus({ worktreeStatus, worktreeName: undefined });
  // Reset the global state for worktree path
  context.globalState.update("selectedWorktreePath", undefined);

  workspace.onDidChangeWorkspaceFolders(() => {
    updateWorktreeStatus({ worktreeStatus, worktreeName: undefined });
  });

  const gotoFileDisposable = commands.registerCommand(
    "worktreesnuts.gotoFile",
    () => {
      gotoFile({ context, cachedFilesMap });
    }
  );

  context.subscriptions.push(worktreeStatus);
  context.subscriptions.push(selectWorktreeCommand);
  context.subscriptions.push(gotoFileDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
