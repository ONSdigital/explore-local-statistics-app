#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

interface DetectorOptions {
	rootDir?: string;
	srcDir?: string;
	entryPoints?: string[];
	extensions?: string[];
	excludeDirs?: string[];
}

interface Report {
	totalFiles: number;
	usedFiles: number;
	unusedFiles: number;
	unusedFilesList: string[];
	totalUnusedSize: number;
}

class SvelteUnusedFilesDetector {
	private rootDir: string;
	private srcDir: string;
	private entryPoints: string[];
	private extensions: string[];
	private excludeDirs: string[];
	private allFiles: Set<string>;
	private usedFiles: Set<string>;
	private importGraph: Map<string, Set<string>>;

	constructor(options: DetectorOptions = {}) {
		this.rootDir = options.rootDir || process.cwd();
		this.srcDir = options.srcDir || 'src';
		this.entryPoints = options.entryPoints || ['src/main.js', 'src/main.ts', 'src/App.svelte'];
		this.extensions = options.extensions || ['.svelte', '.js', '.ts', '.jsx', '.tsx'];
		this.excludeDirs = options.excludeDirs || [
			'node_modules',
			'.git',
			'dist',
			'build',
			'.svelte-kit'
		];

		this.allFiles = new Set<string>();
		this.usedFiles = new Set<string>();
		this.importGraph = new Map<string, Set<string>>();
	}

	private findAllFiles(dir: string = this.srcDir): void {
		const fullDir = path.resolve(this.rootDir, dir);

		if (!fs.existsSync(fullDir)) {
			console.warn(`Directory ${fullDir} does not exist`);
			return;
		}

		const items = fs.readdirSync(fullDir);

		for (const item of items) {
			const fullPath = path.join(fullDir, item);
			const relativePath = path.relative(this.rootDir, fullPath);

			if (this.excludeDirs.some((excludeDir) => relativePath.includes(excludeDir))) {
				continue;
			}

			if (fs.statSync(fullPath).isDirectory()) {
				this.findAllFiles(relativePath);
			} else if (this.extensions.some((ext) => item.endsWith(ext))) {
				this.allFiles.add(relativePath);
			}
		}
	}

	private parseImports(filePath: string): Set<string> {
		try {
			const content = fs.readFileSync(path.resolve(this.rootDir, filePath), 'utf8');
			const imports = new Set<string>();

			// Simple import pattern matching
			const importLines = content.match(/import\s+.*?from\s+['"`]([^'"`]+)['"`]/g);
			if (importLines) {
				for (const line of importLines) {
					const match = line.match(/from\s+['"`]([^'"`]+)['"`]/);
					if (match) {
						const importPath = match[1];

						// Handle SvelteKit $lib alias
						if (importPath.startsWith('$lib')) {
							const libPath = importPath.replace('$lib', 'src/lib');
							const resolvedPath = this.resolveImportPath(libPath, filePath);
							if (resolvedPath) {
								imports.add(resolvedPath);
							}
							continue;
						}

						// Skip external modules and SvelteKit internals
						if (importPath.startsWith('$app/') || importPath.startsWith('$env/')) {
							continue;
						}

						if (
							importPath.startsWith('./') ||
							importPath.startsWith('../') ||
							importPath.startsWith('/')
						) {
							const resolvedPath = this.resolveImportPath(importPath, filePath);
							if (resolvedPath) {
								imports.add(resolvedPath);
							}
						}
					}
				}
			}

			// For Svelte files, also check for component usage in markup
			if (filePath.endsWith('.svelte')) {
				this.parseSvelteComponentUsage(content, filePath, imports);
			}

			return imports;
		} catch (error) {
			console.warn(`Error parsing ${filePath}:`, (error as Error).message);
			return new Set<string>();
		}
	}

	private parseSvelteComponentUsage(content: string, filePath: string, imports: Set<string>): void {
		const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
		if (!scriptMatch) return;

		const scriptContent = scriptMatch[1];
		const componentNames = new Map<string, string>();

		const importLines = scriptContent.match(/import\s+\w+\s+from\s+['"`][^'"`]+['"`]/g);
		if (importLines) {
			for (const line of importLines) {
				const match = line.match(/import\s+(\w+)\s+from\s+['"`]([^'"`]+)['"`]/);
				if (match) {
					const componentName = match[1];
					const importPath = match[2];

					let resolvedPath: string | null = null;

					if (importPath.startsWith('$lib')) {
						const libPath = importPath.replace('$lib', 'src/lib');
						resolvedPath = this.resolveImportPath(libPath, filePath);
					} else if (importPath.startsWith('./') || importPath.startsWith('../')) {
						resolvedPath = this.resolveImportPath(importPath, filePath);
					}

					if (resolvedPath) {
						componentNames.set(componentName, resolvedPath);
					}
				}
			}
		}

		const markupSection = content.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');

		for (const [componentName, importPath] of componentNames) {
			const regex = new RegExp('<' + componentName + '[\\s>]');
			if (regex.test(markupSection)) {
				imports.add(importPath);
			}
		}
	}

	private resolveImportPath(importPath: string, fromFile: string): string | null {
		const fromDir = path.dirname(fromFile);
		let resolvedPath: string;

		if (importPath.startsWith('/')) {
			resolvedPath = path.join(this.srcDir, importPath.substring(1));
		} else if (importPath.startsWith('src/lib')) {
			resolvedPath = importPath;
		} else {
			resolvedPath = path.resolve(fromDir, importPath);
			resolvedPath = path.relative(this.rootDir, resolvedPath);
		}

		resolvedPath = resolvedPath.replace(/\\/g, '/');

		if (!path.extname(resolvedPath)) {
			for (const ext of this.extensions) {
				const pathWithExt = resolvedPath + ext;
				if (this.allFiles.has(pathWithExt)) {
					return pathWithExt;
				}
			}

			for (const ext of this.extensions) {
				const indexPath = path.join(resolvedPath, `index${ext}`);
				if (this.allFiles.has(indexPath)) {
					return indexPath;
				}
			}
		} else if (this.allFiles.has(resolvedPath)) {
			return resolvedPath;
		}

		return null;
	}

	private addSvelteKitRoutes(): void {
		const routesDir = path.join(this.srcDir, 'routes');
		if (fs.existsSync(path.resolve(this.rootDir, routesDir))) {
			this.findRouteFiles(routesDir);
		}
	}

	private findRouteFiles(dir: string): void {
		const fullDir = path.resolve(this.rootDir, dir);

		if (!fs.existsSync(fullDir)) return;

		const items = fs.readdirSync(fullDir);

		for (const item of items) {
			const fullPath = path.join(fullDir, item);
			const relativePath = path.relative(this.rootDir, fullPath);

			if (fs.statSync(fullPath).isDirectory()) {
				this.findRouteFiles(relativePath);
			} else if (item.startsWith('+') && this.extensions.some((ext) => item.endsWith(ext))) {
				this.entryPoints.push(relativePath);
				if (this.allFiles.has(relativePath)) {
					this.usedFiles.add(relativePath);
				}
			}
		}
	}

	private buildDependencyGraph(): void {
		const visited = new Set<string>();
		const queue: string[] = [...this.entryPoints];

		for (const entryPoint of this.entryPoints) {
			if (this.allFiles.has(entryPoint)) {
				this.usedFiles.add(entryPoint);
			}
		}

		while (queue.length > 0) {
			const currentFile = queue.shift()!;

			if (visited.has(currentFile) || !this.allFiles.has(currentFile)) {
				continue;
			}

			visited.add(currentFile);
			const imports = this.parseImports(currentFile);
			this.importGraph.set(currentFile, imports);

			for (const importPath of imports) {
				if (this.allFiles.has(importPath)) {
					this.usedFiles.add(importPath);
					queue.push(importPath);
				}
			}
		}
	}

	public findUnusedFiles(): string[] {
		this.findAllFiles();
		this.addSvelteKitRoutes();
		this.buildDependencyGraph();

		const unusedFiles: string[] = [];
		for (const file of this.allFiles) {
			if (!this.usedFiles.has(file)) {
				unusedFiles.push(file);
			}
		}

		return unusedFiles.sort();
	}

	public generateReport(): Report {
		const unusedFiles = this.findUnusedFiles();

		console.log('\n=== Svelte Unused Files Report ===\n');
		console.log(`Total files found: ${this.allFiles.size}`);
		console.log(`Used files: ${this.usedFiles.size}`);
		console.log(`Unused files: ${unusedFiles.length}\n`);

		if (unusedFiles.length > 0) {
			console.log('🗑️  Unused files:');
			unusedFiles.forEach((file) => {
				const stats = fs.statSync(path.resolve(this.rootDir, file));
				const size = (stats.size / 1024).toFixed(2);
				console.log(`  - ${file} (${size} KB)`);
			});

			const totalSize = unusedFiles.reduce((sum, file) => {
				const stats = fs.statSync(path.resolve(this.rootDir, file));
				return sum + stats.size;
			}, 0);

			console.log(`\n💾 Total size of unused files: ${(totalSize / 1024).toFixed(2)} KB`);
		} else {
			console.log('✅ No unused files found!');
		}

		return {
			totalFiles: this.allFiles.size,
			usedFiles: this.usedFiles.size,
			unusedFiles: unusedFiles.length,
			unusedFilesList: unusedFiles,
			totalUnusedSize: unusedFiles.reduce((sum, file) => {
				const stats = fs.statSync(path.resolve(this.rootDir, file));
				return sum + stats.size;
			}, 0)
		};
	}

	public async interactiveCleanup(): Promise<void> {
		const unusedFiles = this.findUnusedFiles();

		if (unusedFiles.length === 0) {
			console.log('✅ No unused files found!');
			return;
		}

		console.log('\n🔍 Review unused files:\n');

		for (const file of unusedFiles) {
			console.log(`\nFile: ${file}`);
			console.log('Preview:');
			try {
				const content = fs.readFileSync(path.resolve(this.rootDir, file), 'utf8');
				console.log(content.split('\n').slice(0, 5).join('\n') + '...');
			} catch (error) {
				console.log('Error reading file:', (error as Error).message);
			}

			console.log('(In interactive mode, you would be prompted to delete/keep this file)\n');
		}
	}
}

async function main(): Promise<void> {
	const detector = new SvelteUnusedFilesDetector({
		rootDir: process.cwd(),
		srcDir: 'src',
		entryPoints: [
			// SvelteKit entry points
			'src/app.html',
			'src/app.js',
			'src/app.ts',
			'src/hooks.client.js',
			'src/hooks.client.ts',
			'src/hooks.server.js',
			'src/hooks.server.ts',
			'src/service-worker.js',
			'src/service-worker.ts',
			// Layout files (root of routing)
			'src/routes/+layout.svelte',
			'src/routes/+layout.js',
			'src/routes/+layout.ts',
			'src/routes/+layout.server.js',
			'src/routes/+layout.server.ts',
			// Page files (will discover routes recursively)
			'src/routes/+page.svelte',
			'src/routes/+page.js',
			'src/routes/+page.ts',
			'src/routes/+page.server.js',
			'src/routes/+page.server.ts',
			// Error page
			'src/routes/+error.svelte'
		]
	});

	const report = detector.generateReport();

	if (process.argv.includes('--json')) {
		const outputDir = 'test-results';
		const outputPath = path.join(outputDir, 'unused-files-report.json');

		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
		console.log(`\n📄 Report saved to ${outputPath}`);
	}
}

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch(console.error);
}

export default SvelteUnusedFilesDetector;
