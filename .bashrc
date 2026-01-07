# ~/.bashrc
# ---------------------------------------
# Lean, ready-to-use Bash configuration
# ---------------------------------------

# # ----- History -----
HISTCONTROL=ignoredups:erasedups # no duplicate entries
HISTSIZE=10000                   # large in-memory history
HISTFILESIZE=20000               # large on-disk history
shopt -s histappend              # append history, don’t overwrite
PROMPT_COMMAND="history -a; history -c; history -r${PROMPT_COMMAND:+; $PROMPT_COMMAND}"

# # ----- Safer defaults -----
set -o pipefail # fail pipelines properly

# ----- Prompt -----
parse_git_branch() {
  git branch 2>/dev/null | sed -n '/\* /s///p'
}
PS1="\u@\h \W\[\033[32m\]\$(parse_git_branch)\[\033[00m\]$ "

# ----- Aliases -----
alias ll="ls -alF"
alias la="ls -A"
alias lc="ls -CF"

alias cp="cp -i"
alias mv="mv -i"

alias ..="cd .."
alias ...="cd ../.."

alias vim=nvim
alias claude='claude --dangerously-skip-permissions --verbose'

# Reload bashrc quickly
alias brc="source ~/.bashrc"

# Safer 'rm' using macOS Trash (brew install trash)
if command -v trash >/dev/null 2>&1; then
  alias rm='trash'
else
  alias rm='rm -i' # interactive confirm as a fallback
fi

# ----- Completion -----
# Bash completion framework
if [ -f /usr/share/bash-completion/bash_completion ]; then
  . /usr/share/bash-completion/bash_completion
elif [ -f /opt/homebrew/etc/bash_completion ]; then
  . /opt/homebrew/etc/bash_completion
fi

# Git completion
if [ -f /usr/share/bash-completion/completions/git ]; then
  . /usr/share/bash-completion/completions/git
elif [ -f /opt/homebrew/etc/bash_completion.d/git-completion.bash ]; then
  . /opt/homebrew/etc/bash_completion.d/git-completion.bash
fi

# ----- Environment -----
export EDITOR="nvim"
export VISUAL="nvim"

# Colored output
export CLICOLOR=1
export LSCOLORS=GxFxCxDxBxegedabagaced

# ----- Functions -----

mkcd() { mkdir -p -- "$1" && cd -- "$1"; } # make dir and cd

# Quick extract function
extract() {
  if [ -f "$1" ]; then
    case "$1" in
    *.tar.bz2) tar xjf "$1" ;;
    *.tar.gz) tar xzf "$1" ;;
    *.bz2) bunzip2 "$1" ;;
    *.rar) unrar x "$1" ;;
    *.gz) gunzip "$1" ;;
    *.tar) tar xf "$1" ;;
    *.tbz2) tar xjf "$1" ;;
    *.tgz) tar xzf "$1" ;;
    *.zip) unzip "$1" ;;
    *.7z) 7z x "$1" ;;
    *) echo "don't know how to extract '$1'" ;;
    esac
  else
    echo "'$1' is not a valid file"
  fi
}

# Switch to worktree by branch name
gwt() {
  if [ -z "$1" ]; then
    echo "Usage: gwt <branch-name>"
    return 1
  fi

  local worktree_path=$(git worktree list --porcelain | grep -B 2 "branch refs/heads/$1" | head -n 1 | cut -d ' ' -f 2)

  if [ -z "$worktree_path" ]; then
    echo "No worktree found for branch: $1"
    return 1
  fi

  cd "$worktree_path"
}

# Completion for gwt
_gwt_completion() {
  local cur="${COMP_WORDS[COMP_CWORD]}"
  local branches=$(git worktree list --porcelain 2>/dev/null | grep "^branch " | cut -d '/' -f 3-)
  COMPREPLY=($(compgen -W "$branches" -- "$cur"))
}
complete -F _gwt_completion gwt

# Pager & man colors
export LESS='-R --ignore-case --wheel-lines=3'
export LESSHISTFILE=-
export MANPAGER="less"
export MANWIDTH=999
export GROFF_NO_SGR=1

# ----- PATH hygiene -----
pathmunge() { case ":$PATH:" in *":$1:"*) ;; *) PATH="$1:$PATH" ;; esac }
pathappend() { case ":$PATH:" in *":$1:"*) ;; *) PATH="$PATH:$1" ;; esac }

pathmunge "$HOME/bin"
pathmunge "$HOME/.local/bin"

pathappend "/opt/homebrew/bin"
pathappend "/opt/homebrew/opt/postgresql@17/bin" # postgres
pathappend "$HOME/.bun/bin"                      # bun
pathappend "$HOME/code/dot-sync"                 # toolbox
pathappend "$HOME/.opencode/bin"                 # opencode
pathappend "$HOME/.amp/bin"                      # Amp CLI
pathappend "$HOME/go/bin"                        # gastown

# ----- Custom -----

# bun
export BUN_INSTALL="$HOME/.bun"

# pyton
export PYTHONPYCACHEPREFIX="$PWD/.cache/pycache"

export PATH

# gcloud
# The next line updates PATH for the Google Cloud SDK.
if [ -f '/Users/adambossy/code/google-cloud-sdk/path.bash.inc' ]; then . '/Users/adambossy/code/google-cloud-sdk/path.bash.inc'; fi

# The next line enables shell command completion for gcloud.
if [ -f '/Users/adambossy/code/google-cloud-sdk/completion.bash.inc' ]; then . '/Users/adambossy/code/google-cloud-sdk/completion.bash.inc'; fi

# bashmarks
source ~/.local/bin/bashmarks.sh

# node
export NODE_ENV=development

# Run missing commands via uv only inside uv-managed Python projects
in_uv_project() {
  local dir="$PWD"
  while [ "$dir" != "/" ]; do
    if [ -f "$dir/uv.lock" ]; then
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

command_not_found_handle() {
  printf '[cnf] %q\n' "$@" >&2

  # Try running the command inside uv, but only for uv projects
  if command -v uv >/dev/null 2>&1 && in_uv_project; then
    echo "Command '$1' not found. Trying with: uv run $*"
    uv run "$@"
    return $?
  fi
  # Fallback to normal error message if not in a uv project (or uv missing)
  echo "bash: $1: command not found"
  return 127
}

echo "Sourced .bashrc."
