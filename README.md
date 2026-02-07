<div align="center">

# dot-sync

Bidirectional dotfile synchronization between `$HOME` and a Git repository with confirm-before-overwrite protection and automatic backups.

<p align="center">
  <a href="https://github.com/adambossy/dot-sync/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
  &middot;
  <a href="https://github.com/adambossy/dot-sync/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  <br />
  <br />
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![Bash](https://img.shields.io/badge/bash-%E2%89%A54.0-blue)
![Git](https://img.shields.io/badge/git-required-F05032?logo=git&logoColor=white)
[![Twitter](https://img.shields.io/badge/Twitter-@abossy-1DA1F2?logo=twitter&logoColor=white)](https://twitter.com/abossy)

</div>

---

## Table of Contents

1. [About the Project](#about-the-project)
   - [Features](#features)
   - [How it works](#how-it-works)
2. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
3. [Usage](#usage)
4. [Tracked Files](#tracked-files)
5. [Configuration](#configuration)
6. [Backup System](#backup-system)
7. [Included Utilities](#included-utilities)
8. [Contributing](#contributing)
9. [License](#license)
10. [Acknowledgments](#acknowledgments)

---

## About the Project

`dot-sync` is a safe, bidirectional synchronization tool for managing dotfiles and configuration files across multiple machines. It keeps your configurations version-controlled while providing interactive confirmation and automatic backups before any potentially destructive operations.

### Features

- **Safe overwrite protection**: Interactive diff preview and confirmation before any file modifications
- **Automatic timestamped backups**: Changed files are backed up to `.bak/<filename>/bak.YYYY-MMDD-HHMMSS` before overwrite
- **Bidirectional sync**: Pull from repo to local (`$HOME`) or push from local to repo
- **Status checking**: View differences between your local files and the repository without making changes
- **Smart git integration**: Automatically commits changes using AI-generated messages via `git-ai-commit`
- **Executable preservation**: Automatically maintains `+x` permissions on `.local/bin` scripts
- **Flexible path mappings**: Support for custom directory mappings (e.g., macOS `Library/Application Support`)

### How it works

- The script tracks a predefined list of dotfiles and utilities in the `FILES` array
- Each file can be synced either by name (implicit mapping) or with explicit `local_path => repo_path` syntax
- Before overwriting any file, the script shows a diff and asks for confirmation
- All overwrites create timestamped backups in `.bak/<filename>/`
- On `push`, changes are automatically committed using `git-ai-commit` and pushed to the remote repository
- Color-coded diffs are shown when `colordiff` is available

---

## Getting Started

### Prerequisites

- **Bash 4.0+**
- **Git**
- **Optional**: [`colordiff`](https://www.colordiff.org/) for colorized diff output
  ```bash
  # macOS
  brew install colordiff
  
  # Linux (Debian/Ubuntu)
  apt-get install colordiff
  ```
- **Optional**: [`llm` CLI](https://llm.datasette.io/) for AI-powered commit messages
  ```bash
  pip install llm
  llm keys set openai  # Configure your OpenAI API key
  ```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/adambossy/dot-sync.git ~/code/dot-sync
   cd ~/code/dot-sync
   ```

2. Make the script executable:
   ```bash
   chmod +x dot-sync
   ```

3. Add to your `PATH` for easy access (add to `~/.bashrc` or `~/.zshrc`):
   ```bash
   export PATH="$PATH:$HOME/code/dot-sync"
   ```

4. Verify installation:
   ```bash
   dot-sync --help
   ```

---

## Usage

Common workflows:

```bash
# 1) Check status and see what's different
dot-sync status         # or: dot-sync diff

# 2) Pull files from repo to local (with confirmation)
dot-sync pull

# 3) Push files from local to repo, then auto-commit and push to remote
dot-sync push
```

### Commands

- **`dot-sync status`** or **`dot-sync diff`**  
  Show differences between repo and local files. No modifications are made.  
  Exit code: `0` if no differences, `1` if differences found.

- **`dot-sync pull`**  
  Copy files from repository → local (`$HOME`).  
  - Shows diff for each changed file
  - Prompts for confirmation before overwrite
  - Creates timestamped backups of modified files
  - Automatically sets `+x` on `.local/bin` executables

- **`dot-sync push`**  
  Copy files from local (`$HOME`) → repository, then commit and push.  
  - Shows diff for each changed file
  - Prompts for confirmation before overwrite
  - Creates timestamped backups of modified files
  - Runs `git add -A` to stage all changes
  - Uses `git-ai-commit` to generate an AI commit message
  - Pushes to the remote `origin` (sets upstream if needed)

### Notes

- Files must exist in the source location to be synced (missing files are skipped with a log message)
- If repo and local files are identical, the operation is skipped with a "No change" message
- Pressing anything other than `y` or `Y` when prompted will skip that file
- The `DOTSYNC_REPO` environment variable can override the repo directory location

---

## Tracked Files

The following files are automatically synced by default:

**Dotfiles:**
- `~/.vimrc`
- `~/.bashrc`
- `~/.git-completion.bash`
- `~/.gitconfig`
- `~/.inputrc`
- `~/.sdirs`

**Local utilities** (`~/.local/bin/`):
- `git-ai-commit` — Generate AI-powered commit messages
- `git-clean-local-branches` — Clean up merged and stale branches
- `git-clean-rebase` — Interactive rebase cleanup tool
- `convert-heics-to-jpgs` — Bulk HEIC to JPEG converter
- `organize-files` — AI-powered file organizer for Documents directory

**macOS-specific:**
- `~/Library/Application Support/Amethyst/Layouts/centered-primary-columns.js`
- `~/Library/Application Support/Amethyst/Layouts/centered-twin-columns.js`

Files are tracked in the `FILES` array within the script and can be easily modified.

---

## Configuration

### Adding new files

Edit the `FILES` array in the `dot-sync` script:

```bash
FILES=(
  ".vimrc"
  ".bashrc"
  ".git-completion.bash"
  ".inputrc"
  "custom-config.conf"
  # ... add more files here
)
```

### Custom path mappings

For files where the repo path differs from the local path, use the `=>` syntax:

```bash
FILES=(
  ".vimrc"  # Implicit: ~/.vimrc <=> ./vimrc (basename)
  "Library/Application Support/Amethyst/Layouts/centered-primary-columns.js => centered-primary-columns.js"
)
```

- **Left side**: Path relative to `$HOME`
- **Right side**: Path relative to the repository root
- If no `=>` is specified, the repo path defaults to the basename of the local path

### Environment variables

- `DOTSYNC_REPO`: Override the repository directory (defaults to the script's directory)
  ```bash
  export DOTSYNC_REPO="/path/to/custom/repo"
  ```

---

## Backup System

All modified files are automatically backed up before being overwritten.

- **Backup location**: `.bak/<filename>/bak.YYYY-MMDD-HHMMSS`
- **Format**: Timestamped with `YYYY-MMDD-HHMMSS` (e.g., `2025-11-06-143022`)
- **Retention**: Backups are kept indefinitely; clean up manually if needed

Example:
```
.bak/
├── .bashrc/
│   ├── bak.2025-11-01-091500
│   ├── bak.2025-11-05-143022
│   └── bak.2025-11-06-102033
└── .vimrc/
    └── bak.2025-11-02-164512
```

The `.bak/` directory is excluded from version control via `.gitignore`.

---

## Included Utilities

This repository includes several useful Git and file utilities that are synced to `~/.local/bin`:

### `git-ai-commit`

Generate AI-powered commit messages using the `llm` CLI tool.

**Features:**
- Analyzes `git diff --cached` to understand staged changes
- Generates commit messages following best practices:
  - Subject line ≤ 50 characters
  - Optional body wrapped at 72 characters
  - Proper capitalization and formatting
- Opens the generated message in your editor for review

**Usage:**
```bash
git add .
git-ai-commit
```

**Dependencies:**
- [`llm` CLI tool](https://llm.datasette.io/)
- OpenAI API key configured (`llm keys set openai`)

---

### `git-clean-local-branches`

Clean up local Git branches based on their upstream status.

**Behavior:**
- **Merged branches** (upstream exists): Pull latest, then delete with `git branch -d`
- **Deleted upstream** (upstream gone): Force delete with `git branch -D`
- **No upstream**: Keep the branch (preserves local work)
- **Current branch**: Never deleted (automatically skipped)
- **Protected branches**: `main` and `master` are always preserved

**Usage:**
```bash
git-clean-local-branches
```

---

### `git-clean-rebase`

Interactive tool for cleaning up and squashing commits before merging.

**Usage:**
```bash
git-clean-rebase
```

---

### `convert-heics-to-jpgs`

Bulk converter for HEIC images to JPEG format (useful for iOS photo exports).

**Usage:**
```bash
convert-heics-to-jpgs /path/to/photos/
```

---

### `organize-files`

AI-powered file organizer that intelligently categorizes and moves files into your Documents directory.

**Features:**
- Analyzes Documents directory structure using `tree`
- Reads file names and contents (when possible)
- Uses AI to determine the best destination folder
- Suggests improved filenames following naming conventions
- Supports dry-run mode to preview changes
- Creates directories as needed
- Prompts before overwriting existing files

**Usage:**
```bash
# Preview what would happen (safe)
organize-files --dry-run somefile.pdf

# Organize one or more files
organize-files file1.pdf file2.docx

# Organize multiple files at once
organize-files ~/Downloads/*.pdf

# Use custom Documents directory
organize-files --documents /path/to/docs file.pdf
```

**Dependencies:**
- [`tree`](https://en.wikipedia.org/wiki/Tree_(command)) command
- [`llm` CLI tool](https://llm.datasette.io/)
- OpenAI API key configured (`llm keys set openai`)

**Naming Convention:**
The tool follows a consistent naming pattern:
- Lowercase letters
- Hyphens to separate words
- Dates in YYYY-MMDD format
- Descriptive, semantic names

**Examples:**
```bash
# A receipt file gets organized into finance/receipts
organize-files receipt-from-restaurant.pdf
# -> ~/Documents/finance/receipts/receipt-2024-12-15.pdf

# A wedding document goes to the wedding folder
organize-files --dry-run table-layout.pdf
# -> Preview: ~/Documents/wedding/wedding-table-layout.pdf
```

---

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Make your changes and test thoroughly
4. Commit using descriptive messages
5. Submit a pull request with a clear description and rationale

---

## License

Distributed under the MIT License. See `LICENSE` for details.

---

## Acknowledgments

- README structure inspired by the excellent Best-README-Template by Othneil Drew ([link](https://github.com/othneildrew/Best-README-Template)).
- Diff visualization powered by [`colordiff`](https://www.colordiff.org/).
- AI commit messages powered by [`llm`](https://llm.datasette.io/) and Simon Willison.
