# Guide to working on ELS

## Getting access to ONSdigital

To work on ELS, you need to get set up on ONSdigital. Here what you need to do.

- [Add your ONS email to your github account](https://docs.github.com/en/account-and-profile/how-tos/setting-up-and-managing-your-personal-account-on-github/managing-email-preferences/adding-an-email-address-to-your-github-account), it can be a secondary email address.
- [Set up two factor authentication on GitHub](https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa/configuring-two-factor-authentication)
- [Generate a GPG key](https://docs.github.com/en/authentication/managing-commit-signature-verification/generating-a-new-gpg-key)
- [Add GPG key to your github account](https://docs.github.com/en/authentication/managing-commit-signature-verification/adding-a-gpg-key-to-your-github-account)
- [Generate an SSH key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
- [Connect SSH key to your github account](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account)
- Log a servicenow request to be added to the ONSdigital GitHub Organisation
- Ask Pete Montgomery to add you to the [ELS repo](https://github.com/ONSdigital/explore-local-statistics-app).

If generating a GPG key on windows, I recommend downloading [gpg4win](https://gpg4win.org/download.html). Then you can run the `gpg` commands through powershell. There are also GPG extensions for VS code.

You need to setup git on your computer to use the email address registered with your GPG key, if not already set up like this, to sign the commit (verify that the person doing the commit really is you). You can do this with `git config --global user.email "first.last@ons.gov.uk"`.

## Data Processing Guide

### Prerequisites

- [ ] Node.js and TypeScript installed
- [ ] Access to the ONS explore-local-statistics-app repository
- [ ] Basic knowledge of Github to create branches and pull requests

## Understanding the Data Sources & Flow

The data that powers ELS comes from the [explore-local-statistics-data](https://github.com/ONSdigital/explore-local-statistics-data) repository. It's maintained by the ESS data team (Charlee + co). When you run `npm run data:download` the data from the repo gets downloaded to `scripts/insights/raw/family-ess-main/`.

### Internal Configuration Data

Here's all the files that used when generating the data and what they are responsible for.

```
📁 scripts/raw/config-data/
├── 📋 data-files-manifest.csv (which files to include)
├── 📊 indicators/
│   ├── indicators-lookup.csv (indicator definitions)
│   └── indicators-metadata.csv (display metadata)
├── ⏰ periods/
│   ├── unique-periods-lookup.csv (time period definitions)
│   └── additional-periods-lookup-for-sliders.csv (missing years)
├── 🗺️  geography/ (areas, boundaries, hierarchies)
├── 🎯 clusters/ (similarity groups, neighbors)
└── 🔍 other configuration files
```

## Step-by-Step Data Update Process

### Step 1: Information Gathering

When ELS team requests an update, ask:

- ❓ **What changed?** New indicators, areas, or time periods?
- ❓ **Which indicators?** Get specific names/codes
- ❓ **What should I look for?** Expected data ranges, geographic coverage

### Step 2: Branch Creation

```bash
# Create branch following naming convention
git checkout develop
git pull origin develop
git checkout -b updates/MM-YY/brief-description

# Example:
git checkout -b updates/04-25/homicides-attendance-traveltime
```

### Step 3: Data Download

```bash
# This deletes old data and downloads fresh from GitHub
npm run data:download
```

**What this does:**

- Deletes `scripts/insights/raw/family-ess-main/`
- Downloads latest `explore-local-statistics-data` repo
- Moves it to the raw folder

### Step 4: Data Generation & Troubleshooting

```bash
# Attempt to process the data
npm run data:generate
```

**Troubleshooting cycle:**

1. **Run the command** - See what breaks
2. **Read the error** - Look for specific file/field names
3. **Update configuration** - Based on the scenario above
4. **Repeat** until successful

**Common files you'll be editing:**

- `data-files-manifest.csv` - For new files
- `indicators-lookup.csv` - For new indicators
- `indicators-metadata.csv` - For indicator settings
- `unique-periods-lookup.csv` - For new time periods

### Step 5: Preview & Approval

```bash
# Push your changes
git add .
git commit -m "Update data: brief description of changes"
git push origin your-branch-name
```

1. **Get preview link**: Go to [deployments](https://github.com/ONSdigital/explore-local-statistics-app/deployments)
2. **Share with data team**: Let them test the changes
3. **Wait for approval**: Don't merge until they're happy

### Step 6: Merge Through Environments

```bash
# Update your branch with any changes to develop
git checkout develop
git pull origin develop
git checkout your-branch-name
git merge develop

# Create pull request: your-branch → develop
# After approval, create pull request: develop → main
```

**Merge sequence:**

1. **Your branch** → **Develop** (after code review)
2. **Develop** → **main** (after data team approval)

## The Three Main Data Update Scenarios

### 🆕 Scenario 1: New File Added to Raw Data

**What you'll see:**

```bash
⚠️  The script has been aborted because the list of file paths read in from
the scripts/insights/raw/family-ess-main folder includes files which are
not listed in the manifest...
```

**What to do:**

1. **Add to manifest**: Update `scripts/raw/config-data/data-files-manifest.csv`
2. **Set include flag**: 'Y' for data files, 'N' for files to ignore
3. **Set multiIndicatorCategory**: If file contains multiple indicators, specify the field that differentiates them (otherwise leave blank)

**Example manifest entry:**

```csv
file_path,include,multiIndicatorCategory
unemployment-rates-by-age.csv,Y,age_group
```

### 📊 Scenario 2: New Indicator Added

**What you need to update:**

**A) Indicator Lookup** (`scripts/raw/config-data/indicators/indicators-lookup.csv`):

```csv
id,topic,subTopic,code
47,Economy,Employment,unemployment-rates-16-24
48,Economy,Employment,unemployment-rates-25-49
```

- **id**: Unique integer (just use next available number)
- **topic**: Main category for grouping
- **subTopic**: Sub-category for grouping
- **code**:
  - Simple file: just the filename
  - Cubed file: `filename-differentiator` (e.g., `unemployment-rates-16-24`)

**B) Indicator Metadata** (`scripts/raw/config-data/indicators/indicators-metadata.csv`):

```csv
code,slug,confidenceIntervals,zeroBaseline,canBeNegative,initialGeographyLevel,beeswarmRowUseMinMax
unemployment-rates-16-24,unemployment-young-adults,true,true,false,lower,F
```

**Key metadata fields:**

- **slug**: URL path for the indicator page
- **confidenceIntervals**: true unless CI data missing/sparse
- **zeroBaseline**: true for charts starting at zero
- **canBeNegative**: true if values can be negative
- **initialGeographyLevel**: lowest available geography level
- **beeswarmRowUseMinMax**: 'T' only if data very tightly clustered

**C) Additional Metadata** (either in CSV above OR in the indicator's JSON file):

- label, prefix, suffix, subText, decimalPlaces
- experimentalStatistic, sourceDate, sourceURL, sourceOrg
- longDescription, standardised, caveats

### ⏰ Scenario 3: New Time Period Added

**What you'll see:**

```bash
⚠️  unique-periods-lookup warning - The data includes some periods which
are not included in our list of unique periods. Please add these and
give them a xDomainNumb and labels. The list of new periods is copied above.
```

**What to do:**

1. **Copy new periods** from the error message
2. **Add to periods file**: `scripts/raw/config-data/periods/unique-periods-lookup.csv`
3. **Assign values**:
   - **xDomainNumb**: First year of period (e.g., 2022 for "June 2022-May 2023")
   - **label**: Full description
   - **labelShort**: Abbreviated version
   - **labelVeryShort**: Very short for tight spaces

**Example periods entry:**

```csv
period,xDomainNumb,label,labelShort,labelVeryShort
2022-23,2022,June 2022 to May 2023,2022-23,22-23
```

**⚠️ Excel Warning**: Use VS Code to edit CSV files! Excel will convert entries like "07-08" to dates and corrupt your data
