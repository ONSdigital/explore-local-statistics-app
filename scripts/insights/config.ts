const RAW_DIR = 'scripts/insights/raw';
const COOKED_DIR = 'scripts/insights/cooked';
const CONFIG_DIR = `${RAW_DIR}/config-data`;
const CSV_DIR = `${COOKED_DIR}/csv`;

const CSV_PREPROCESS_DIR = `${RAW_DIR}/family-ess-main`;

const FILE_NAMES_LOG = `${CONFIG_DIR}/data-files-manifest.csv`;
const AREAS_CSV = `${CONFIG_DIR}/geography/areas.csv`;
const PREVIOUS_INDICATORS_FILENAME = `${CONFIG_DIR}/indicators/indicators-lookup.csv`;
const PREVIOUS_PERIODS_FILENAME = `${CONFIG_DIR}/periods/unique-periods-lookup.csv`;
const AREAS_GEOG_LEVEL_FILENAME = `${CONFIG_DIR}/geography/areas-geog-level.csv`;
export const INDICATORS_METADATA_CSV = `${CONFIG_DIR}/indicators/indicators-metadata.csv`;
const EXCLUDED_INDICATORS_PATH = `${CONFIG_DIR}/excluded-indicators.json`;

const DEFAULT_VALUE_FIELD_NAME = 'observation';

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

const CLUSTER_TYPES_LOOKUP = {
	Glob: 'global',
	Econ: 'economic',
	Demo: 'demographic',
	Health: 'health',
	Con: 'connectivity'
};

export const NEW_FILES_WARNING =
	`The script has been aborted because the list of file paths read in from ` +
	`the ${CSV_PREPROCESS_DIR} folder includes files which are not listed in ` +
	`the manifest. These file paths can be viewed in the ` +
	`previous_file_paths data frame. Please add these file paths to the ` +
	`data-files-manifest.csv file in the config-data folder and re-run.`;

export const MISSING_FILES_WARNING =
	`The script has been aborted because some files listed in the manifest are ` +
	`not in the ${CSV_PREPROCESS_DIR} folder. Please either add these files, ` +
	`or remove their names from the manifest.`;

const CONFIG = {
	CSV_PREPROCESS_DIR,
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
	CLUSTER_TYPES_LOOKUP,
	NEW_FILES_WARNING,
	MISSING_FILES_WARNING,
	CONFIG_DIR,
	CSV_DIR
};

export default CONFIG;
