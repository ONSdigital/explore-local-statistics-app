# Explore Local Statistics

[Explore Local Statistics](https://www.ons.gov.uk/explore-local-statistics) (ELS) is an Office for
National Statistics (ONS) service for finding, comparing and visualising statistics about areas of
the UK, from countries and regions down to local authorities, through area pages, indicator pages,
maps, charts and tables. The same data is available to download (XLSX, CSV, CSVW, JSON-stat) and
through an HTTP API.

It is a [SvelteKit](https://svelte.dev/docs/kit) app with no database. Indicator and geography data
is prepared by scripts in this repo, committed as static files, and served by a Node server.

## Documentation

| Document                                                     | What it covers                                                                                  |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)               | How the app works: the data pipeline, the back end and API, the front end, and how they connect |
| [scripts/managing-updates.md](./scripts/managing-updates.md) | Step-by-step process for a data update, from the data team's branch to going live               |
| [docs/api/](./docs/api/README.md)                            | Reference for the `/api/v1/` HTTP API                                                           |
| [docs/ANALYTICS.md](./docs/ANALYTICS.md)                     | The analytics events the app sends                                                              |
| [docs/ROADMAP.md](./docs/ROADMAP.md)                         | Open work                                                                                       |
| [docs/DECISIONS.md](./docs/DECISIONS.md)                     | Why things are the way they are                                                                 |

`CLAUDE.md` files (at the root and in each area's folder) are guides for working on the code with
[Claude Code](https://claude.com/claude-code). They point to the documents above rather than
repeating them.

## How the code is organised

Work on the app usually falls into one of three areas:

- **Data pipeline** (`scripts/`): downloads raw datasets from the
  [explore-local-statistics-data](https://github.com/ONSdigital/explore-local-statistics-data) repo
  and builds the data files in `src/lib/data/`. Run by hand when data changes.
- **Back end and API** (`src/lib/api/`, `src/routes/(api)/`): filters and formats the data, and
  serves it at `/api/v1/...`.
- **Front end** (`src/routes/(app)/`, `src/lib/components/`): the pages users see, which get their
  data from the API.

[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) explains each in more detail.

## Getting started

### Access

To contribute you need to be a member of the ONSdigital GitHub organisation and able to make signed
commits:

1. [Add your ONS email address](https://docs.github.com/en/account-and-profile/how-tos/setting-up-and-managing-your-personal-account-on-github/managing-email-preferences/adding-an-email-address-to-your-github-account)
   to your GitHub account (it can be a secondary address), and
   [set up two-factor authentication](https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa/configuring-two-factor-authentication).
2. [Generate a GPG key](https://docs.github.com/en/authentication/managing-commit-signature-verification/generating-a-new-gpg-key)
   and [add it to GitHub](https://docs.github.com/en/authentication/managing-commit-signature-verification/adding-a-gpg-key-to-your-github-account).
   On Windows, [Gpg4win](https://gpg4win.org/download.html) provides the `gpg` command.
3. [Generate an SSH key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
   and [add it to GitHub](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account).
4. Set git to use the email address on your GPG key, for example
   `git config --global user.email "first.last@ons.gov.uk"`.
5. Raise a ServiceNow request to join the ONSdigital GitHub organisation, then ask the
   `@ONSdigital/explore-local-statistics-app-team` team for access to this repo.

The ONSdigital [getting started guide](https://github.com/ONSdigital/dp/blob/main/guides/GETTING_STARTED.md)
(steps 1–3) covers the same ground in more detail.

### Running the app

You need Node.js 24 and npm 11 (see `engines` in `package.json`).

```sh
npm install
npm run dev
```

### Commands

| Command                                         | What it does                                                                                                   |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                                   | Start the dev server                                                                                           |
| `npm run build` / `npm run preview`             | Build for production / preview the build                                                                       |
| `npm run check`                                 | Type-check with svelte-check                                                                                   |
| `npm run lint` / `npm run format`               | Check / fix formatting (Prettier) and lint (ESLint)                                                            |
| `npm run test:bench`                            | Benchmarks for the data API                                                                                    |
| `npm run test:unit`, `npm run test:integration` | Unit (Vitest) and browser (Playwright) tests. Currently placeholders only; see [ROADMAP.md](./docs/ROADMAP.md) |
| `npm run audit`                                 | Check dependencies for known vulnerabilities                                                                   |
| `npm run data:ingest`, `npm run data:build`     | Data update steps; see [managing-updates.md](./scripts/managing-updates.md)                                    |
| `npm run geo:all`                               | Rebuild geography data (boundaries, area lists, similar areas)                                                 |

## Contributing

Create a feature branch from `develop` and open a pull request back to `develop`, which needs a
review before merging. Releases go from `develop` to `main`. Pushed branches get a preview
deployment, listed on the repo's
[deployments page](https://github.com/ONSdigital/explore-local-statistics-app/deployments). Data
updates follow their own branch naming and QA steps, described in
[managing-updates.md](./scripts/managing-updates.md).

## Working with a local copy of the design system

The app uses [`@onsvisual/svelte-components`](https://github.com/ONSvisual/svelte-components), a
Svelte port of the ONS Design System. To develop against a local copy without publishing it to npm:

1. In `svelte-components`, run `npm link`, then `npm run build`.
2. In this repo, run `npm link @onsvisual/svelte-components`.
3. Check with `npm ls @onsvisual/svelte-components` that it points to your local copy.

While the dev server is running, components update each time you run `npm run build` in the
library. To undo this, run `npm unlink @onsvisual/svelte-components`.

## Production build and deployment

Production runs as a Docker container using SvelteKit's Node adapter, built and deployed by
Concourse (`ci/`) and Nomad (`explore-local-statistics.nomad`). To run a production build locally:

```sh
docker build -t els .
docker run -p 3000:3000 els
```

The image can be configured with build arguments:

```sh
docker build -t els --build-arg SVELTEKIT_BASE_PATH=/explore-local-statistics --build-arg SVELTEKIT_ASSETS_PATH=http://localhost:8080/some-path .
```

| Variable                | Purpose                                                                  |
| ----------------------- | ------------------------------------------------------------------------ |
| `SVELTEKIT_BASE_PATH`   | Path the app is served under (`/explore-local-statistics` in production) |
| `SVELTEKIT_ASSETS_PATH` | Where built assets are served from, if not the app itself                |
| `SVELTEKIT_APP_VERSION` | App version (set to the git commit in CI)                                |

### Static assets

Static assets (JavaScript, CSS and data files) are served by the app container. Serving them from a
CDN bucket instead (`ENABLE_S3_ASSETS` in the `Makefile`) has been switched off for good, since the
app is already served from behind Cloudflare; see
[DECISIONS.md](./docs/DECISIONS.md#build-and-deploy).

## Licence

See [LICENSE.md](./LICENSE.md).
