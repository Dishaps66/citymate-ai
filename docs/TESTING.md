# Testing Guide

Critical checks:

- Search results contain source metadata.
- Failed APIs do not produce invented records.
- Emergency search returns only emergency categories.
- PG Finder does not return hotels unless explicitly supported by verified listing type.
- Invalid login forms do not redirect.
- Supabase RLS prevents cross-user access.
- Stale listings display warnings.
- Agent output is valid JSON.

Commands:

```powershell
pnpm --filter @citymate/web typecheck
pnpm --filter @citymate/web lint
pnpm --filter @citymate/web test
cd apps\api
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m compileall api
```
