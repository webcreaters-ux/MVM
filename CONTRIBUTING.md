# Contributing to MVM

MVM is developed as a modular, provider-neutral project.

## Rules
- Keep credentials and private endpoints out of commits.
- Prefer permissive open-source dependencies and document licenses.
- Keep browser/mobile code responsive and progressively enhanced.
- Add or update tests for meaningful behavior.
- Every push and pull request must pass type checking, tests, and production build in GitHub Actions.

## Architecture direction
Core interfaces should not assume one AI vendor. Provider adapters belong behind stable interfaces so local models and remote services can be swapped without rewriting the UI.
