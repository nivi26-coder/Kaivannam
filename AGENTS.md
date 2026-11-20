<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Kaivannam project conventions

Read `Docs/Kaivannam — Project Context.md` (product, scope, rules) and `Docs/Kaivannam — Architecture.md` (how the code fits together) first.

Where code goes (all under `src/`):

| Folder | Put here | Never put here |
| --- | --- | --- |
| `app/` | Routes only: `page.tsx`, `loading.tsx`, layouts. Pages fetch with `server/queries.ts` and compose feature components. | Business rules, database calls |
| `features/<area>/` | One business area's UI (`components/`) and Server Actions (`actions.ts`): catalog, checkout, orders, seller | Rules shared by several areas |
| `domain/` | Pure business rules and types: pricing, validation, order status, delivery dates | React, Next.js, Mongoose, `fetch` |
| `server/services/` | Use cases (`placeOrder`, `payOrder`…) returning a `Result`. Take `repos` as the last argument. | `FormData`, `revalidatePath`, `redirect` |
| `server/repositories/` | All storage access, behind interfaces, with `mongo/` and `mock/` versions | Business rules |
| `server/queries.ts` | Page reads; each starts with `await io()` | Writes |
| `components/` | Shared UI: `ui/` (shadcn), `layout/`, `common/` | Feature-specific UI |
| `lib/` | Generic helpers (dates in IST, formatting, phone) | Business rules |
| `config/` | Site constants and environment variables | Secrets with a `NEXT_PUBLIC_` prefix |

Rules:

- Dependencies point inward: `app → features → server → domain`, with `lib`/`config` usable anywhere. `domain/` imports nothing from the other layers.
- The server always calculates prices with `domain/pricing.ts`. Never accept a price from the browser.
- Server Actions stay thin: read the form, call a service, `revalidate…`, `redirect`.
- New storage needs: add a method to the repository interface and implement it in both `mongo/` and `mock/`.
- Test business rules next to the code (`*.test.ts`); service tests use `createMockRepositories()`.
- Before finishing: `npm run check` (types, lint, tests) and `npm run build`.
