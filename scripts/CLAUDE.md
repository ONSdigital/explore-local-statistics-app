# Data pipeline (area A)

Scripts that turn raw datasets into the static files in `src/lib/data/`. They run by hand when data
changes, never at runtime. The step-by-step process for a data update (branching, editing the
manifest, QA, going live) is in [`managing-updates.md`](./managing-updates.md): read it before
running or changing anything here. What each script does and what it writes is under "A. Data
pipeline" in [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

## Commands

In order:

1. `npm run data:download`: clones the data repo branch named in `config/data-repo-version.json` into
   `raw-data/` (not committed).
2. `npm run data:metadata`: CSVW metadata per dataset.
3. `npm run data:checks`: writes `data-update-changelog.txt` for a person to review.

   (1–3: `npm run data:ingest`. Then review the changelog and edit `config/manifest_metadata.csv`.)

4. `npm run data:generate`: the JSON-stat cube and its metadata, summary and areas-in-data files.
5. `npm run data:spreadsheets`: the "all datasets" XLSX, CSV and CSVW files.
6. `npm run meta:sitemap`: `static/sitemap.xml`.

   (4–6: `npm run data:build`.)

Separately:

- `npm run meta:redirects`: `config/slug_changes.csv` → `indicator_redirects.json`, after renaming an
  indicator's slug.
- `npm run geo:all` (`geo:generate`, then `geo:clusters`): boundaries, area lists and lookups, and
  clusters and similar areas, from remote ONS repos and `config/clusters/`. Only when geographies
  change. `data:generate` reads `geo-metadata.json`, so run this first if both are needed.

## Things to know

- **`config/manifest_metadata.csv` decides what is in the cube and in what order.** Only rows with
  `include` set to true are built, and their order is the taxonomy order on `/indicators`.
  `data:generate` fails with a clear error if the raw data has an indicator that isn't in the
  manifest.
- **`data:spreadsheets` runs the back end's code.** `generate-spreadsheets.ts` imports
  `filterIndicators`, `filterDatasets`, `generateXLSX` and `generateCSV` from `src/lib/api/data/`, so
  a back-end change can change these files on the next build. `generateXLSX` returns a stream,
  piped to disk with `pipeline()`.
- **The cube's shape is the back end's contract.** `src/lib/api/data/` relies on: dimensions
  `areacd`, `period`, `measure` (plus any extras), with `measure` last; the `extension` fields; and
  `indicatorLookup` in `json-stat-summary.json`. If `generate-data.ts` output changes, check the data
  API against it (`npm run test:bench` exercises the main request shapes).
- **Raw column names are mapped in `util/config.ts`** (`colLookup`). It also holds datasets to skip
  and fixed period formats for datasets whose format can't be inferred.
- `src/lib/config/geoLevels.ts` is imported here as well as by the app. A change to it affects
  geography inference, the sitemap and the geography files.
- The generated files in `src/lib/data/` and `static/sitemap.xml` are committed. A data update's pull
  request is mostly regenerated files. Check that the diff matches the expected changes.
- `npm run format` / Prettier ignores JSON files, so generated JSON is not reformatted.
