## Commit Message Convention

Use Angular commit message convention for all commits.

Format:
<type>(<scope>): <subject>

<body>

<footer>

Rules:
- Header is mandatory. Body and footer are optional but recommended.
- Any line must be 100 characters or fewer.
- Subject is imperative mood (e.g., "add", "fix", "change").
- Use BREAKING CHANGE: in footer or "!" in header for breaking changes.

Common types:
- feat: New user-facing feature (minor bump).
- fix: User-facing bug fix (patch bump).
- docs: Documentation only.
- style: Formatting only (no code change).
- refactor: Code rework without feature or fix.
- perf: Performance improvements.
- test: Test changes only.
- build: Build system or dependencies.
- ci: CI scripts/config.
- chore: Other changes not modifying src or tests.
- revert: Revert a previous commit.
