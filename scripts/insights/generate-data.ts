console.log('hi');

import { readFileSync, writeFileSync } from 'fs';

// Sample data to output as JSON
const data = {
	timestamp: new Date().toISOString()
};

const inputPath = `scripts/insights/raw/family-ess-main/4g-coverage/4g-coverage.csv`;

const raw = readFileSync(inputPath);
console.log(raw);

const outputPath = `static/insights/example.json`;

writeFileSync(outputPath, JSON.stringify(data));

console.log(`Insights JSON file has been generated at: ${outputPath}`);

//
//
/// an example:
//
//

// import * as aq from 'arquero';
// import * as fs from 'fs';
// import * as d3 from 'd3-dsv';
// import { promisify } from 'util';

// const readFileAsync = promisify(fs.readFile);

// // Helper function to read a CSV file and convert it to an Arquero table
// async function readCsv(filePath: string): Promise<aq.Table> {
//   const fileContent = await readFileAsync(filePath, { encoding: 'utf-8' });
//   const data = d3.csvParse(fileContent);
//   return aq.from(data);
// }

// (async () => {
//   // Define excluded indicators
//   const excludedIndicators = ["homicide-offences", "inward-foreign-direct-investment-fdi", "total-value-of-uk-exports"];

//   // Read areas and other configuration data
//   const areas = await readCsv("./config-data/geography/areas.csv");
//   const areasGeogLevel = await readCsv("./config-data/geography/areas-geog-level.csv");
//   const previousPeriods = await readCsv("config-data/periods/unique-periods-lookup.csv");
//   const previousIndicators = await readCsv("config-data/indicators/indicators-lookup.csv").select('id', 'topic', 'subTopic', 'code');

//   // Assume getFilePaths function exists to get file paths, needs to be implemented based on your environment
//   let filePaths = await getFilePaths("csv-preprocess", /\.csv$/, false);

//   filePaths = filePaths
//     .filter(filePath => !filePath.includes("/out/"))
//     .filter(filePath => !filePath.includes("_IDS"));

//   // Assume readPreviousFilePaths function exists to read the previous file paths log
//   const previousFilePaths = await readPreviousFilePaths("./config-data/file-names-log.csv");

//   const newFilePaths = filePaths.filter(filePath => !previousFilePaths.includes(filePath));

//   if (newFilePaths.length > 0) {
//     throw new Error("Script execution aborted - update file-names-log.");
//   }

//   // Filter file paths to include only those marked with "Y" in the log
//   // This filtering logic needs to be adjusted based on how you track inclusion in the log

//   // Combined data tables initialization
//   let combinedData = aq.table({}); // Initialize with an empty table structure
//   let combinedMetadata = aq.table({});

//   for (let filePath of filePaths) {
//     // Processing for each file, similar logic to the R script for filtering, mutating, and combining data
//     // Detailed implementation would follow the logic shown above, tailored to TypeScript and Arquero capabilities
//   }
// })();

// Note: This script assumes the existence of helper functions like getFilePaths and readPreviousFilePaths,
// which you would need to implement based on your specific environment (e.g., Node.js file system operations).

//
//
/// another example:
//
//

// import * as aq from 'arquero';
// import * as fs from 'fs';
// import * as d3 from 'd3-dsv';
// import { promisify } from 'util';

// const readFileAsync = promisify(fs.readFile);

// // Helper function to read a CSV file and convert it to an Arquero table
// async function readCsv(filePath: string): Promise<aq.Table> {
//   const fileContent = await readFileAsync(filePath, { encoding: 'utf-8' });
//   const data = d3.csvParse(fileContent);
//   return aq.from(data);
// }

// // Assuming filePaths is an array of file path strings to process
// let filePaths: string[] = []; // Populate this array as per your application's logic

// // Simulate reading previous file paths for filtering
// let previousFilePaths: string[] = []; // Populate this with actual data in your application

// // Areas table, assuming it's already been read and processed
// let areas: aq.Table = aq.table({}); // Replace with actual data

// // Main loop to process each file
// for (let filePath of filePaths) {
//   const indicatorCode = filePath.split('/').pop()?.replace("csv-preprocess/family-ess-main/", "").replace(".csv", "");

//   // Check if the indicator code is not excluded
//   if (!excludedIndicators.includes(indicatorCode!)) {
//     let indicatorData = await readCsv(filePath);

//     // Preprocess indicator data as needed
//     indicatorData = indicatorData
//       .mutate({
//         // Example of case_when logic in Arquero, adjust as per actual logic needed
//         areacd: (d: any) => d.areacd.replace("TLB", "E92000001"), // Simplified, expand for all cases
//         // Convert column names and values as needed
//       })
//       .select(['areacd', 'period', 'value', 'code', 'lci', 'uci']) // Select relevant columns
//       .filter((d: any) => areas.select('areacd').includes(d.areacd)); // Filter based on areas, adjust logic as needed

//     // Combine processed data with the main dataset
//     combinedData = combinedData.concat(indicatorData);

//     // Process and combine metadata, similar approach as for data
//     // Assuming indicator_metadata is processed similarly to indicator_data
//     let indicatorMetadata: aq.Table; // Initialize and process indicator metadata
//     combinedMetadata = combinedMetadata.concat(indicatorMetadata);
//   }
// }

// // Post-loop processing can go here
