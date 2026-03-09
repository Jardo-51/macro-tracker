# Claude Code Notes

## Type Checking

Always use `pnpm type-check` (which runs `vue-tsc --build --force`) instead of `npx vue-tsc --noEmit`. The `--build` flag processes project references and tsconfig differently, and matches what CI runs via `pnpm build`.
