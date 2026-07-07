# Host-specific bash augmentations for Adams-MacBook-Pro.

pathappend "/opt/homebrew/opt/libpq/bin"

export LDFLAGS="-L/opt/homebrew/opt/openssl@3/lib -L/opt/homebrew/opt/libpq/lib ${LDFLAGS:-}"
export CPPFLAGS="-I/opt/homebrew/opt/openssl@3/include -I/opt/homebrew/opt/libpq/include ${CPPFLAGS:-}"
export PKG_CONFIG_PATH="/opt/homebrew/opt/openssl@3/lib/pkgconfig:/opt/homebrew/opt/libpq/lib/pkgconfig${PKG_CONFIG_PATH:+:$PKG_CONFIG_PATH}"

# Override gwr to also tear down the branch via the spara Makefile.
# Takes the worktree index shown by gwl (overrides the alias in ~/.bashrc).
unalias gwr 2>/dev/null
gwr() {
  if [ -z "$1" ]; then
    echo "Usage: gwr <number>"
    gwl
    return 1
  fi
  local branch
  branch=$(git worktree list | awk "NR==$1+1{print \$NF}" | tr -d '[]')
  if [ -z "$branch" ]; then
    echo "No worktree with number: $1"
    return 1
  fi
  make worktree-remove b="$branch" && git branch -d "$branch"
}
