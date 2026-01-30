import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

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
		console.log('Cloning repository...');
		await execFileAsync('git', [
			'clone',
			'--single-branch',
			'--branch',
			'csvw-metadata',
			REPO_URL,
			TEMP_DIR
		]);
		console.log('Repository cloned successfully');
	} catch (error) {
		console.error('Error cloning repository:', error);
		throw error;
	}
}

async function moveContents(): Promise<void> {
	try {
		console.log("Creating target directory if it doesn't exist...");
		await fs.promises.mkdir(TARGET_DIR, { recursive: true });

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
