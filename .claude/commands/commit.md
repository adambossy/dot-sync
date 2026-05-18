# /commit - Make clean, atomic git commits

Analyze all unstaged and staged changes in the repository, then create a series of small, focused commits that each leave the repository in a working state.

## Workflow

### 1. Assess the Current State

```bash
.claude/commands/commit-status.sh
```

If the `===ACTION===` section says `NOTHING`, stop — nothing to commit.

### 2. Analyze Changes and Plan Commit Order

Read the actual diffs to understand what changed:

```bash
git diff
git diff --cached
```

Examine the dependency relationships between all changed files:
- Which changes are **self-contained** (can be committed independently)?
- Which changes **depend on** other changes (e.g., a new import used in another file, a schema change needed by a query)?
- Which changes are **logically related** (part of the same feature, fix, or refactoring)?

Plan a commit sequence that satisfies these rules:

1. **Standalone changes first.** If file A can be committed independently but file B depends on changes in file A, commit A before B.
2. **Each commit must be functional.** All tests should pass and code should work after every commit. Changes that depend on each other must be committed together.
3. **Group related commits sequentially.** If commits B and C both relate to a feature but commit A is an unrelated fix, order them A → B → C so the history reads cleanly by topic.
4. **Smaller is better.** When in doubt, prefer more smaller commits over fewer large ones.

### 3. Execute Commits

For each planned commit:

1. Stage only the relevant files (use `git add <file>...` — never `git add -A` or `git add .`)
2. For partial file staging where only some hunks in a file belong to this commit, use `git add -p` is not available in non-interactive mode — instead, consider whether the entire file can go in one commit, or explain to the user that manual partial staging is needed.
3. Write a concise commit message:
   - Use imperative mood ("Add feature" not "Added feature")
   - First line under 72 characters
   - If more context is needed, add a blank line then a brief body
   - End with `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
4. Create the commit using a HEREDOC for the message:
   ```bash
   git add <files> && git commit -m "$(cat <<'EOF'
   <commit message>

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   EOF
   )"
   ```
5. Verify the commit succeeded with `git status --porcelain` before moving to the next one.

### 4. Final Verification

After all commits are made:

```bash
git log --oneline -<N>
```

where N is the number of commits just created. Output the commit log so the user can review.

## Important Notes

- **Never use `git add -A` or `git add .`** — always stage specific files by name.
- **Never use `--no-verify`** — if a hook fails, fix the issue and retry.
- **Never amend a previous commit** unless the user explicitly asks — always create new commits.
- **Do not include files that look like secrets** (`.env`, credentials, tokens). Warn the user if such files appear in the changeset.
- If there's only one logical change, making a single commit is fine — don't split artificially.
- If partial file staging is needed and cannot be done non-interactively, tell the user and suggest they stage those hunks manually, then re-run.
