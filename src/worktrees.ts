import { execSync, exec } from "node:child_process";
import { workspace } from "vscode";
import { basename } from "node:path";

export interface Worktree {
  name: string;
  path: string;
}

export async function getWorktrees(): Promise<Worktree[] | null> {
  const gitPath = execSync("which git").toString().trim();
  const workspaceRoot = workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    return null;
  }

  return new Promise((resolve, reject) => {
    exec(
      `${gitPath} worktree list --porcelain`,
      { cwd: workspaceRoot },
      (error, stdout, stderr) => {
        if (error || stderr) {
          reject(null);
        } else {
          const worktrees: Worktree[] = [];
          let currentWorktree: Worktree | null = null;
          const cmdStart = "worktree ";
          for (const line of stdout.split("\n")) {
            const worktreePath = line.slice(cmdStart.length);
            if (line.startsWith(cmdStart)) {
              if (worktreePath === workspaceRoot) {
                continue;
              }
              if (currentWorktree) {
                worktrees.push(currentWorktree);
              }
              currentWorktree = {
                name: basename(worktreePath),
                path: worktreePath,
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
