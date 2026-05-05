# Transitional layer

This folder re-exports the current code that still lives in the legacy root `src/`.
It exists only to enable the new separated runtime layout while we migrate code in
small, safe steps.

Next steps:
- Physically move legacy files into `apps/workers/src/*`
- Replace deep relative imports with workspace packages (`@forge-deals/shared`, etc.)

