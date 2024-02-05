const CSV_PREPROCESS_DIR = 'scripts/insights/raw/family-ess-main';
const TMP_CSV_DIR = 'scripts/insights/tmp-csv';

const FILE_NAMES_LOG = 'scripts/insights/raw/config-data/file-names-log.csv';
const AREAS_CSV = 'scripts/insights/raw/config-data/geography/areas.csv';
const PREVIOUS_INDICATORS_FILENAME =
	'scripts/insights/raw/config-data/indicators/indicators-lookup.csv';
const PREVIOUS_PERIODS_FILENAME =
	'scripts/insights/raw/config-data/periods/unique-periods-lookup.csv';
const AREAS_GEOG_LEVEL_FILENAME = 'scripts/insights/raw/config-data/geography/areas-geog-level.csv';
export const INDICATORS_METADATA_CSV =
	'scripts/insights/raw/config-data/indicators/indicators-metadata.csv';
const EXCLUDED_INDICATORS_PATH = 'scripts/insights/raw/config-data/excluded-indicators.json';

const DEFAULT_VALUE_FIELD_NAME = 'value';

const COMBINED_DATA_COLUMN_NAMES = ['areacd', 'period', 'value', 'code', 'lci', 'uci'];

// TODO: check if it's okay to be missing ITL2 codes like TLM5
const AREA_CODE_MAP = {
	TLB: 'E92000001',
	TLC: 'E12000001',
	TLD: 'E12000002',
	TLE: 'E12000003',
	TLF: 'E12000004',
	TLG: 'E12000005',
	TLH: 'E12000006',
	TLI: 'E12000007',
	TLJ: 'E12000008',
	TLK: 'E12000009',
	TLL: 'W92000004',
	TLM: 'S92000003',
	TLN: 'N92000002'
};

export const NEW_FILES_WARNING =
	`The script has been aborted because the list of file paths read in from ` +
	`the ${CSV_PREPROCESS_DIR} folder includes files which were not present when ` +
	`this script was last run. These file paths can be viewed in the ` +
	`previous-file-paths data frame. Please add these file paths to the ` +
	`file-names-log.csv file in the config-data folder and re-run.`;

const CONFIG = {
	CSV_PREPROCESS_DIR,
	TMP_CSV_DIR,
	FILE_NAMES_LOG,
	AREAS_CSV,
	PREVIOUS_INDICATORS_FILENAME,
	PREVIOUS_PERIODS_FILENAME,
	AREAS_GEOG_LEVEL_FILENAME,
	INDICATORS_METADATA_CSV,
	EXCLUDED_INDICATORS_PATH,
	DEFAULT_VALUE_FIELD_NAME,
	COMBINED_DATA_COLUMN_NAMES,
	AREA_CODE_MAP,
	NEW_FILES_WARNING
};

export default CONFIG;
