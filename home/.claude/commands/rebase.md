# /rebase - Fetch, rebase on main, resolve conflicts, push if PR open

Rebase the current branch onto the latest `origin/main`, resolve any conflicts, and push if a PR already exists.

## Workflow

### 1. Fetch and Rebase

```bash
git fetch origin
```

Detect the primary branch:
```bash
git show-ref --verify --quiet refs/remotes/origin/main && echo main || echo master
```

Then rebase:
```bash
git rebase origin/<primary_branch>
```

### 2. Handle Conflicts

If the rebase exits with a conflict (non-zero exit code or `CONFLICT` in output), resolve them:

1. Identify conflicted files:
   ```bash
   git diff --name-only --diff-filter=U
   ```

2. For each conflicted file:
   - Read the file and locate `<<<<<<<`, `=======`, `>>>>>>>` markers
   - Understand what both sides are doing in context
   - Apply the correct resolution (keep ours, keep theirs, or merge both — use judgment)
   - Write the resolved file (no conflict markers remaining)
   - Stage it: `git add <file>`

3. Continue the rebase:
   ```bash
   git rebase --continue
   ```
   Pass the commit message through as-is (the `--continue` uses the existing commit message). If git opens an editor, it will use the original; in non-interactive mode this happens automatically.

4. Repeat until `git rebase --continue` exits cleanly. If a conflict is genuinely ambiguous (logic conflict, deleted-vs-modified, etc.), stop and ask the user to decide. Include the filename, line range, and the full conflict snippet (both sides with their markers) so the user has everything they need to make the call.

### 3. Check for Open PR

```bash
gh pr view --json number,url,state 2>/dev/null
```

- If this exits non-zero or returns `state: CLOSED` or `state: MERGED`, there is no open PR — stop here and report the rebase is complete.
- If `state: OPEN`, continue to step 4.

### 4. Push to Remote

```bash
git push --force-with-lease origin HEAD
```

`--force-with-lease` is safe: it refuses to push if the remote has commits we haven't fetched, protecting against overwriting others' work.

Report the PR URL from step 3 and confirm the push succeeded.

## Important Notes

- If there are **uncommitted changes** before starting, warn the user — `git rebase` will fail. Suggest they stash (`git stash`) or commit first.
- If the rebase cannot be completed automatically (too many ambiguous conflicts), abort with `git rebase --abort` and explain what happened.
- Never push to `main` or `master` directly.
