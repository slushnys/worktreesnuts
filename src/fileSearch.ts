import { globby } from "globby";
import {
  workspace,
  type ExtensionContext,
  type FileSystemWatcher,
  RelativePattern,
} from "vscode";

export type CachedFilesMap = Map<string, string[]>;
export const cachedFilesMap: CachedFilesMap = new Map();
const watchersMap: Map<string, FileSystemWatcher> = new Map();

export async function updateCachedFiles(worktreePath: string) {
  const worktreeFiles = await getFilesInWorktree(worktreePath);
  cachedFilesMap.set(worktreePath, worktreeFiles);
}

export async function getFilesInWorktree(
  worktreePath: string
): Promise<string[]> {
  return await globby("**/*.*", { gitignore: true, cwd: worktreePath });
}

export function createWatcherForWorktree(
  worktreePath: string,
  context: ExtensionContext
) {
  if (watchersMap.has(worktreePath)) {
    return; // A watcher already exists for this worktree
  }

  const watcher = workspace.createFileSystemWatcher(
    new RelativePattern(worktreePath, "**/*.*")
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
