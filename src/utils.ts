import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function isBareGitRepository(
  workspaceRoot: string
): Promise<boolean> {
  const gitConfigPath = join(workspaceRoot, "config");
  try {
    const gitConfigContent = await readFile(gitConfigPath, "utf8");
    const isBareRepository = gitConfigContent.includes("bare = true");
    return isBareRepository;
  } catch (error) {
    return false;
  }
}
