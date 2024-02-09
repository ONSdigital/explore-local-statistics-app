# Generate data for ESS insights

This script creates the data that the /insights (ESS) visualisations use.

- takes the raw data from the GitHub repo https://github.com/GSS-Cogs/family-ess
- performs some aggregatation (median, mad)
- adds any missing variable name(s) in the raw data
- maps some area codes

## How to run the script

```
npm run data:generate
```

## Input files

- All of the data CSV files within `scripts/insights/raw/family-ess-main/`; e.g. `scripts/insights/raw/family-ess-main/4g-coverage/4g-coverage.csv`
- The list of which CSV files to use, along with `multiIndicatorCategory` and `valueField`: `scripts/insights/raw/config-data/data-files-manifest.csv`.
- For each GSS code, is it a region, upper tier local authority, etc.: `scripts/insights/raw/config-data/geography/areas-geog-level.csv`
- A list of the codes of indicators to exclude: `scripts/insights/raw/config-data/excluded-indicators.json`
- GSS codes and the corresponding place names: `scripts/insights/raw/config-data/geography/areas.csv`
- `period,xDomainNumb,label,periodGroup`: `scripts/insights/raw/config-data/periods/unique-periods-lookup.csv`
- For each indicator: `id,topic,subTopic,code,periodGroup`: `scripts/insights/raw/config-data/indicators/indicators-lookup.csv`. Note: The current file has `minXDomainNumb,maxXDomainNumb` columns in here, but these should probably be deleted because these values are calculated by the script.
- Lots of metadata such as `unit,measure,polarity` for each indicator: `scripts/insights/raw/config-data/indicators/indicators-metadata.csv`
- Dummy data for the beeswarm key: `scripts/insights/cooked/csv/beeswarm-key-data.csv`
- Similar areas lookup: `scripts/insights/raw/config-data/clusters/similar-areas-lookup.csv`. Note: I think this is currently just dummy data.
- Urban/rural, IMD, coastal: `scripts/insights/raw/config-data/geography/areas-geog-info.csv`
- Parent geographies: `scripts/insights/raw/config-data/geography/areas-parents-lookup.csv`

## CSV files generated

These three files are just generated so we can check that they match the output of the R script. The data they contain is also in the JSON files described in the next section, so the CSV files aren't actually used by the web app.

- All of the data points: `scripts/insights/cooked/csv/combined-data.csv`
- List of indicators with topic, subtopic, year range etc.: `scripts/insights/cooked/csv/indicators-lookup.csv`
- Medians and median absolute deviations (MADs): `scripts/insights/cooked/csv/indicators-calculations.csv`

## Files generated for direct use by the web app

- All of the data, along with dummy data for the beeswarm key: `static/insights/data.json`
- The same as above, but in a space-saving column oriented shape: `static/insights/column-oriented-data.json`
- Various pieces of config and metadata: `static/insights/config.json`
