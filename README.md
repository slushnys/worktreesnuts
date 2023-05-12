# WorktreesNuts

Are you tired of the lackluster Git worktree management in your editor? Do you want to feel the wind in your hair as you seamlessly switch between Git worktrees? Well, look no more!

WorktreesNuts is a Visual Studio Code extension that simplifies working with git worktrees when it becomes nuts. It provides a quick and easy way to switch between worktrees, view the currently active worktree, and search for files within that same active worktree. Did you count the times we mentioned worktree?

> This plugin doesn't switch workspaces, so you'll work in the same window while switching only the active working branches.

## Features

- Switch between worktrees with a single command - "WorktreesNuts: Select Git Worktree"
- View the currently active worktree in the status bar
- Blazingly fast file search within the active worktree - "WorktreesNuts: Go to File in Active Worktree"

> For these features to work you have to have a git repository that was either initiated or cloned with --bare option.

### Animation of how this works

![How active worktrees work](media/worktreesnuts.gif)
[Quick peek of how it works on YouTube](https://youtu.be/GmfoslZLf14)

## How to Use

1. Install the extension from the Visual Studio Code marketplace. Click, click, BOOM!
2. Open the command palette with `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS), then type `Worktree Nuts: Select Worktree`, to select a worktree.
3. The name of the currently active worktree will be displayed on the status bar.
4. To search for a file within the active worktree, open the command palette and type `Worktree Nuts: Go to File` (or `Ctrl+Cmd+P` on macOS).

### Shortcuts

- `Worktree Nuts: Select Worktree`: Ctrl+Alt+R (or `Ctrl+Cmd+R` on macOS)
- `Worktree Nuts: Go to File`: Ctrl+Alt+P (or `Ctrl+Cmd+P` on macOS).

## Requirements

Understanding of how git bare repositories work. You can read about that [here](https://www.geeksforgeeks.org/bare-repositories-in-git/)

<!-- ## Known Issues -->

---

**Enjoy!**
