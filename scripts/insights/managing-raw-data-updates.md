# Managing updates to the raw data

The raw data used in this project is maintained on the [
Connected Open Government Statistics (COGS) github site.](https://github.com/GSS-Cogs).

The [explore-local-statistics-data](https://github.com/ONSdigital/explore-local-statistics-data) is updated by the analysis and data teams on a frequent basis. For changes to this repository to be replicated in the Explore Local Statistics app, the following steps need to be undertaken by a member of the data vis team.

## Step 1 - Ask what changes have occurred

Typically, this process will be conducted when a member of the ELS team asks for a data update. When they do so, you should ask them to provide a quick summary of what has changed. In particular, you want to know - has a new indicator been added? have additional data (e.g. new areas or new time periods) been added for an existing indicator?

Knowing what has changed will make it easier to check that updates have been processed correctly.

## Step 2

Create a new branch off `Develop`. We are following the structure of `updates/MM-YY/brief-description` e.g. `updates/04-25/homicides-attendance-traveltime`.

## Step 3 - Download the data

Use the npm command

`npm run data:download`

to download the data. 

This script deletes the folder 'family-ess-main' from scripts/insights/raw. Then it grabs the repo `explore-local-statistics-data` and moves it into scripts/insights/raw/family-ess-main.

## Step 4 - Give it a go and see what happens

Once the raw data has been moved to the scripts/insights/raw folder, we are now ready to attempt our data generating step. This step manipulates the data in this folder - combined with other initial configuration data - into json files that can be easily read in by our app.

This data generation step is initialised by navigating to the local-statistics folder in the terminal and running the following command:

`npm run data:generate`

This command runs the generate-data.ts which is saved in the scripts/insights folder. If certain configuration inputs are missing or don't align the script will abort and provide an error message explaining the issue - so a good starting point is to run the script and see what it complains about.

Below are outlined changes to the raw data with necessitate configuration changes before the data:generate script will run.

### Change 1 - family-ess-main includes a new file

data:generate scrapes the family-ess-main for all csv files. It then looks in scripts/raw/config-data/data-files-manifest.csv to find out what it should do with each file. Files with include === 'Y' are treated as files including data which we want included in the app; other files are ignored. (Files in the family-ess-main/out folder are also ignored as these simply include duplicate data.)

Therefore, when a new file is added, the script will provide the following warning:

_The script has been aborted because the list of file paths read in from the scripts/insights/raw/family-ess-main folder includes files which are not listed in the manifest..._

Above this warning message will be a console.logged array including the new file paths. You need to add this file path to the data-files-manifest file and provide info on how to handle it.

Data-files-manifest also includes a multiIndicatorCategory field. This is used to deal with any datasets which are 'cubed' - e.g. a single file includes data for multiple indicators. In this instance, data:generate splits these out into separate inputs, and so it needs to know what field in the csv file differentiates them.

### Change 2 - a new indicator has been added

When a new indicator is added, it needs to be added to the scripts/raw/config-data/indicators/indicators-lookup.csv file.

Within this file are the following fields:

_id_ - This is simply a unique identifer integer for this indicator. Ordering is irrelevant.
_topic_ - The topic which you want the indicator to be grouped into.
_subTopic_ - The sub-topic which you want the indicator to be grouped into.
_code_ - If the indicator is not from a cubed file, this is simply the file name. If the indicator is from a cubed file this is [filename]-[name in the csv file that differentiates it from other indicators].

When a new indicator is added, it also needs to be added to the scripts/raw/config-data/indicators/indicators-metadata.csv file. Within this file are the following fields:

_code_ - As above, this is used to link the metadata to the indicator-lookup.
_slug_ - This is the url used for this indicator's dedicated page.
_confidenceIntervals_ - This determines whether users can choose to view confidence interval data. We want this set to true unless confidence interval data does not exist for this indicator or it is very, very sparsely available.
_zeroBaseline_ - This determines whether line and bar charts should start with a zero-baseline or based on the minumum value across the areas being visualised.
_canBeNegative_ - This determines whether a chart scale can extend into negative numbers (e.g. net additions to the housing stock can be negative, employment rate cannot).
_initialGeographyLevel_ - This determines what the initial geography level data will be displayed for when users first load up the indicator page. In general, this should be the lowest geography level for which data is available.
_beeswarmRowUseMinMax_ - This determines whether the beeswarm-row charts on the area pages use the median absolute deviation (if set to 'F') or the minimum and maximum values (if set to 'T') across the dataset to set the chart scales. We only want this set to 'T' if the data is unusually tightly clustered, such that using the MADs makes it difficult to distinguish trends.

In addition, for each indicator the following fields need to be provided in either the metadata.csv file or in the indicators corresponding .json file, under the key _'ess-beta-metadata'_. When the field exists in both places, the value from the json file will be used.

This dual-functionality system exists because we are transitioning away from managing metadata changes via a single csv file to making changes within the json file alongside other metadata.

_label, prefix, suffix, subText, decimalPlaces, experimentalStatistic, sourceDate, sourceURL sourceOrg, longDescription, standardised, caveats_

Note that _decimal places_ only refers to the level of precision used for any labels on charts.
Note that _standardised_ impacts whether the user can view the data as a map (since maps of unstandardised data are very difficult to gain insight from - other than which areas are more highly populated).

### Change 3 - a new time period needs to be added

If a new indicator is added or more data is provided for an existing indicator, data:generate might provide the following error:

_unique-periods-lookup warning - The data includes some periods which are not included in our list of unique periods. Please add these and give them a xDomainNumb and labels. The list of new periods is copied above._

Above this will be an array of time periods - you need to copy these into raw/config-data/periods/unique-periods-lookup.csv and give them:

_a xDomainNumb_ - This is used to chart data. We typically use the first year from the time period (e.g. for June 2022-May 2023 we'd set xDomainNumb = 2022).
_label, labelShort, labelVeryShort_ - These labels will be used on different charts, depending on available pixel space.

It is recommended to open up the csv file to make edits in vscode rather than excel, as excel will interpret certain labels (e.g. 07-08) as dates and then save them as a datetime. However, if you do open and save the file in excel, you can fix this issue by applying the following formulas to column D.

=IF(LEN(C2)=4,C2,MID(C2,3,2)&"-"&RIGHT(C2,2))

Note: The unique time periods file has been derived from the time periods in the raw data. However, there is one issue where a dataset has missing years - for example, persistent-absences-for-all-pupils currently has data for 2018 and 2020 but not for 2019. The way the app is currently coded, this causes an error if the user adjusts the slider to show data for 2019, since it can't find labels for that year.

The current work around is that we add a additional-periods-lookup-for-sliders.csv input which includes these missing time periods. Therefore, if more indicators with missing years are added, or data for these missing years is added for existing indicators - then this file will need updating.

## Step 5
Push changes to your branch. Then go to [deployments](https://github.com/ONSdigital/explore-local-statistics-app/deployments) to get the preview link to share back with the data team.

Once they are happy with the changes it's time to merge that branch. 

Update from Develop to see if there are changes that have happened in the time since we've been waiting for approval, then do a pull request into Develop. 

Once that's been approved, do a pull request from Develop into Beta. 
