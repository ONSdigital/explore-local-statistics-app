import fs from 'fs';
import path from 'path';
import { execFile, execSync } from 'child_process';
import { promisify } from 'util';
import DATA_REPO from './config/data-repo-version.json';

const execFileAsync = promisify(execFile);

// Get the project root directory (where package.json lives)
const PROJECT_ROOT = process.cwd();

// Define paths relative to project root
const TARGET_DIR = path.join(PROJECT_ROOT, 'scripts/raw-data');
const REPO_URL = 'https://github.com/ONSdigital/explore-local-statistics-data.git';
const TEMP_DIR = path.join(PROJECT_ROOT, 'temp-clone');

async function removeDirectory(dir: string): Promise<void> {
	try {
		if (fs.existsSync(dir)) {
			console.log(`Removing directory: ${dir}`);
			await fs.promises.rm(dir, { recursive: true, force: true });
			console.log(`Successfully removed directory: ${dir}`);
		}
	} catch (error) {
		console.error(`Error removing directory ${dir}:`, error);
		throw error;
	}
}

async function cloneRepo(): Promise<void> {
	try {
		const branch = DATA_REPO.branch || 'main';
		console.log(`Cloning branch "${branch}" from data repository...`);
		await execFileAsync('git', [
			'clone',
			'--single-branch',
			'--branch',
			branch,
			REPO_URL,
			TEMP_DIR
		]);
		console.log('Repository cloned successfully!');
		const hash = DATA_REPO.commitHash;
		if (hash) {
			console.log(`Resetting to commit hash ${hash}...`);
			await execFileAsync('git', ['-C', TEMP_DIR, 'reset', '--hard', DATA_REPO.commitHash]);
		}
	} catch (error) {
		console.error('Error cloning repository:', error);
		throw error;
	}
}

async function getTimestamps(): Promise<void> {
	try {
		console.log('Getting data and metadata timestamps for each directory from latest commits');
		const datasets = fs
			.readdirSync(TEMP_DIR)
			.filter((item) => !item.includes('.'))
			.filter(
				(item) =>
					fs.existsSync(`${TEMP_DIR}/${item}/${item}.csv`) &&
					fs.existsSync(`${TEMP_DIR}/${item}/${item}.json`)
			);
		for (const ds of datasets) {
			const dataPath = `${ds}/${ds}.csv`;
			const metaPath = `${ds}/${ds}.json`;
			const timestampPath = `${TARGET_DIR}/${ds}/timestamps.json`;
			const modifiedDateData = execSync(
				`git -C ${TEMP_DIR} log -1 --pretty="format:%cs" ${dataPath}`,
				{
					encoding: 'utf-8'
				}
			);
			const modifiedDateMeta = execSync(
				`git -C ${TEMP_DIR} log -1 --pretty="format:%cs" ${metaPath}`,
				{
					encoding: 'utf-8'
				}
			);
			const timestamps = {
				csvModified: modifiedDateData,
				jsonModified: modifiedDateMeta
			};

			const timestampDir = path.dirname(timestampPath);
			console.log(`Creating directory for timestamps if it doesn't exist: ${timestampDir}`);
			await fs.promises.mkdir(timestampDir, { recursive: true });

			await fs.promises.writeFile(timestampPath, JSON.stringify(timestamps, null, 2));
			console.log(`Wrote ${timestampPath}`);
		}
	} catch (error) {
		console.error('Error getting timestamps:', error);
		throw error;
	}
}

async function moveContents(): Promise<void> {
	try {
		console.log('Moving contents to target directory...');
		await fs.promises.cp(TEMP_DIR, TARGET_DIR, { recursive: true });
		console.log('Contents moved successfully');
	} catch (error) {
		console.error('Error moving contents:', error);
		throw error;
	}
}

async function cleanup(): Promise<void> {
	try {
		console.log('Cleaning up temporary directory...');
		await removeDirectory(TEMP_DIR);
		console.log('Cleanup completed');
	} catch (error) {
		console.error('Error during cleanup:', error);
		throw error;
	}
}

async function main(): Promise<void> {
	try {
		console.log(`Project root: ${PROJECT_ROOT}`);
		console.log(`Target directory: ${TARGET_DIR}`);

		// Remove existing contents
		await removeDirectory(TARGET_DIR);

		// Clone repository to temporary directory
		await cloneRepo();

		// Generate timestamp
		await getTimestamps();

		// Move contents to target directory
		await moveContents();

		// Clean up
		await cleanup();

		console.log('Data download and update completed successfully!');
	} catch (error) {
		console.error('Script failed:', error);
		// Ensure cleanup happens even if there's an error
		await cleanup().catch((cleanupError) => {
			console.error('Error during cleanup after failure:', cleanupError);
		});
		process.exit(1);
	}
}

// Run the script
main();
