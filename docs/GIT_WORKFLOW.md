# Git Workflow

This document describes the git workflows used in the pkIntvMCP project.

## Tag-Merge-Tag-Delete Branch Pattern

This is our standard workflow for merging feature/sprint branches into main with proper state tracking.

### Purpose

- **Before Tag**: Marks the stable state of main before integration
- **Merge Commit**: Creates explicit merge commit (non-fast-forward) for clear history
- **After Tag**: Marks the new state of main after successful integration
- **Delete Branch**: Cleans up completed branch

### Usage Pattern

```bash
# 1. Checkout main
git checkout main

# 2. Tag the before-state
git tag -a before-<branch-name> -m "Main before <description>"

# 3. Merge with explicit merge commit (--no-ff ensures merge commit even if fast-forward possible)
git merge --no-ff <branch-name> -m "Merge <branch-name>"

# 4. Tag the after-state
git tag -a after-<branch-name> -m "Main after <description>"

# 5. Delete the feature branch
git branch -d <branch-name>
```

### Example: Sprint Integration

```bash
git checkout main
git tag -a before-pkma-sprint1.3-2025-12-09 -m "Main before sprint 1.3"
git merge --no-ff pkma-sprint1.3-2025-12-09 -m "Merge pkma-sprint1.3-2025-12-09"
git tag -a after-pkma-sprint1.3-2025-12-09 -m "Main after sprints 1.3 and 1.4"
git branch -d pkma-sprint1.3-2025-12-09
```

### Benefits

1. **Audit Trail**: Before/after tags allow easy comparison of what changed
2. **Rollback Points**: Can easily revert to before-state if issues discovered
3. **Clear History**: `--no-ff` creates explicit merge commit in history
4. **Documentation**: Tag messages document what was integrated
5. **Bisect Support**: Merge commits don't interfere with `git bisect`

### Tag Naming Convention

- **Format**: `before-<branch-name>` and `after-<branch-name>`
- **Date Suffix**: Include date in branch name for temporal tracking
- **Descriptive**: Tag message should describe what's being integrated

### When to Use

- **Sprint Completions**: After completing and testing a sprint's work
- **Major Features**: When integrating significant new functionality
- **External Integrations**: When merging work from other developers (e.g., Manus)
- **Milestone Releases**: Before/after major project milestones

### When NOT to Use

- **Small fixes**: Trivial bug fixes can merge without ceremony
- **Documentation only**: Pure doc changes don't need state tracking
- **WIP commits**: Work-in-progress should stay on feature branch

## Branch Naming Conventions

### Sprint Branches

Format: `pkma-sprint<version>-YYYY-MM-DD`

Examples:
- `pkma-sprint1.3-2025-12-09`
- `pkma-sprint1.5-2025-12-10`

### Feature Branches

Format: `feature/<descriptive-name>`

Examples:
- `feature/memory-validation`
- `feature/cycle-timing`

### Fix Branches

Format: `fix/<issue-description>`

Examples:
- `fix/overflow-detection`
- `fix/sdbd-handling`

## Verification After Merge

Always verify the merge was successful:

```bash
# Check merge commit exists
git log --oneline -1

# Verify tags were created
git tag -l "*<branch-name>*"

# Confirm branch was deleted
git branch -l | grep <branch-name>

# Run tests
npm test

# Check working tree is clean
git status
```

## Comparing Before/After States

To see what changed in an integration:

```bash
# Diff between tags
git diff before-<branch-name> after-<branch-name>

# List changed files
git diff --name-only before-<branch-name> after-<branch-name>

# Show commit history between tags
git log before-<branch-name>..after-<branch-name>
```

## Tag Management

### Listing Tags

```bash
# All tags
git tag

# Pattern matching
git tag -l "before-*"
git tag -l "after-*"
```

### Tag Details

```bash
# Show tag annotation
git show <tag-name>

# Show commit tagged
git log -1 <tag-name>
```

### Pushing Tags

```bash
# Push specific tag
git push origin <tag-name>

# Push all tags
git push --tags
```

### Deleting Tags (if needed)

```bash
# Delete local tag
git tag -d <tag-name>

# Delete remote tag
git push origin :refs/tags/<tag-name>
```

## Emergency Rollback

If issues are discovered after merge:

```bash
# Reset main to before-state
git checkout main
git reset --hard before-<branch-name>

# Force push if already pushed (USE WITH CAUTION)
git push --force origin main
```

**WARNING**: Only force push if you're certain no one else has pulled the broken state.

## Best Practices

1. **Test Before Merge**: Always run full test suite on branch before merging
2. **Clean Working Tree**: Ensure `git status` is clean before starting
3. **Descriptive Messages**: Tag messages should explain what's being integrated
4. **Consistent Naming**: Follow naming conventions for easy filtering
5. **Document Changes**: Update project-log.md as part of merge commit
6. **Verify Success**: Always verify merge, tags, and tests after completion

## Related Documentation

- **docs/PROJECT_SETUP.md**: Repository structure and setup
- **docs/project-log.md**: Historical record of changes
- **docs/ROADMAP.md**: Sprint planning and milestones
