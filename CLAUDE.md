# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

"Explore Local Statistics" (ELS) is an ONS SvelteKit app for browsing UK statistical indicators by
area, through maps, charts and tables, plus a public JSON/CSV/XLSX API serving the same data. There
is no database: indicator and geography data is generated ahead of time into static files in
`src/lib/data/`, bundled into the build, and held in memory by the Node server. Read
[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for how it fits together.

## Areas

Work usually happens in one area at a time. Each area has a guide that loads when you work in its
folders. Read it first for anything non-trivial.

| Area                | Code                                                                                                 | Guide                        |
| ------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------- |
| A. Data pipeline    | `scripts/`, output in `src/lib/data/`                                                                | `scripts/CLAUDE.md`          |
| B. Back end and API | `src/lib/api/`, `src/routes/(api)/`, `src/lib/data/index.ts`                                         | `src/lib/api/CLAUDE.md`      |
| C. Front end        | `src/routes/(app)/`, `src/lib/components/`, `src/lib/utils.ts`, `src/lib/util/`, `src/lib/config.ts` | `src/routes/(app)/CLAUDE.md` |

The seams between the areas are where changes break things: see "How the three parts connect" in
`docs/ARCHITECTURE.md`. In short:

- The pipeline's output format is the back end's input.
- `scripts/generate-spreadsheets.ts` imports back-end code from `src/lib/api/data/`.
- The front end reaches the back end only through `/api/v1/...` (also in page `load` functions),
  apart from a few pure helpers and small data files.
- `src/lib/config/` (geography levels and lookups, measures, topics) is shared by all three areas.
  Check it, and `src/lib/config.ts` (front-end colours and constants), before adding constants.

## Docs

- `docs/ARCHITECTURE.md`: how the app works. `docs/ANALYTICS.md`: analytics events.
- `docs/api/`: the API reference for consumers. `docs/api/important-notes.md` lists its sharp edges.
- `scripts/managing-updates.md`: the data update workflow.
- `docs/ROADMAP.md`: open work only. `docs/DECISIONS.md`: why things are as they are, including past
  measurements. Search it when you need a reason; don't read it up front.

## Commands

- `npm run dev` (dev server) · `npm run build` / `npm run preview`
- `npm run check` (svelte-check) · `npm run lint` (Prettier, including Markdown, and ESLint) ·
  `npm run format`
- `npm run test:bench` (data API benchmarks; one file: `npx vitest bench <path>`)
- `npm run test:unit` and `npm run test:integration` currently run only placeholders; there are no
  real tests yet (see `docs/ROADMAP.md`).
- Data and geography scripts are listed in `scripts/CLAUDE.md`.
- `make` targets (`lint`, `test`, `audit`, `build`, `run`) wrap these for Concourse CI (`ci/`) and
  Docker. `make lint` is currently a no-op.

## Conventions

- SvelteKit with Svelte 5 runes, TypeScript, Vite. UI uses `@onsvisual/svelte-components`, the Svelte
  port of the ONS Design System.
- `src/lib/logger.ts` (pino) replaces `console.*` outside dev (`src/hooks.server.ts`), and production
  builds mark `console.log` and similar calls as removable. Don't rely on raw `console.log` calls
  behaving as they do in dev.
- Adapter and paths are set at build time in `svelte.config.js`: Vercel if `VERCEL` is set (preview
  deployments), Node otherwise; `SVELTEKIT_BASE_PATH`, `SVELTEKIT_ASSETS_PATH`,
  `SVELTEKIT_APP_VERSION` (see `Makefile`). Production runs under `/explore-local-statistics`, so
  build internal links and fetch paths with `resolve()` from `$app/paths`.

## Code comments

Keep comments short and about the non-obvious why: a hidden constraint, a correctness rule, or a
library quirk that would otherwise get "fixed" back into a bug. A line or two is usually enough.

Don't use comments for investigation or optimisation history: profiling numbers, before/after
timings, "confirmed by testing", changelogs, or links followed while debugging. Put that in
`docs/DECISIONS.md` (or `docs/api/important-notes.md` for behaviour API consumers need to know), and
leave at most a short pointer in the code.

## Finishing a piece of work

1. Run `npm run check` and `npm run lint` (or `npx prettier --check` on the files you changed). For
   changes to the data API's hot paths, also run the relevant `npm run test:bench` file. Check the
   change in the dev server.
2. If how an area works changed, update its guide, `docs/ARCHITECTURE.md` if the overview changed,
   and `docs/api/` if API behaviour changed.
3. Add a line to `docs/DECISIONS.md` for any decision worth a reason, and remove the item from
   `docs/ROADMAP.md` if it was there.
4. Commit only when asked. Work goes to `develop` through a pull request.
