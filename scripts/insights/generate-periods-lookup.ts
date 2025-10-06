import { readdirSync, readFileSync, writeFileSync } from "fs";
import { utcDay, utcFormat, csvParse, csvFormat } from "d3";
import { round } from "@onsvisual/robo-utils";

const inDir = "./scripts/insights/raw/family-ess-main";
const outPath = "./scripts/insights/raw/config-data/periods/unique-periods-lookup-generated.csv";

// STEP 1:
// Get unique time periods from CSV data files
const folders = readdirSync(`${inDir}/`).filter(f => !f.includes("."));

const files = [];

for (const folder of folders) {
    const path = `${inDir}/${folder}`;
    const csvs = readdirSync(path).filter(f => f.slice(-4) === ".csv");
    for (const csv of csvs) files.push(`${path}/${csv}`);
}

const uniquePeriods = new Set();

let checked = 0;

for (const file of files) {
    const raw = readFileSync(file, {encoding: "utf-8"});
    const rows = csvParse(raw);
    const periodCol = rows.columns.find(col => col.toLocaleLowerCase() === "period");

    for (const row of rows) uniquePeriods.add(row[periodCol]);

    checked += 1;
    console.log(`Found ${uniquePeriods.size} unique time periods in ${checked} datasets`);
}

const sortedPeriods = [...uniquePeriods].sort((a, b) => a.localeCompare(b));


// STEP 2:
// Format time periods and output CSV lookup
const monthFormatter = utcFormat("%b %Y");
const monthFormatterShort = utcFormat("%b %y");
const yearFormatter = utcFormat("%Y");

function getMonthNumb(date, year) {
    return round(+year + ((+date.slice(5, 7) - 1) / 12), 2);
}

function parsePeriod(str) {
    let [date, period] = str.replace("--", "/").split("/");
    if (date[2] === "-") date = date.split("-").reverse().join("-");
    const parsedDate = new Date(date);
    const granularity = period && period.slice(-1) !== "M" ? "year" :
        date.slice(-2) === "01" ? "month" : "year";
    const year = date.slice(0, 4);
    const xDomainNumb = granularity === "month" ? getMonthNumb(date, year) : +year;
    const start = granularity === "month" ? monthFormatter(parsedDate) : year;
    let end = period && granularity === "year" ? yearFormatter(utcDay.offset(parsedDate, +period.slice(1,2) * 364)) : null;
    if (end === start) end = null;

    return {
        period: str,
        xDomainNumb,
        label: end ? `${start}-${end.slice(-2)}` : start,
        labelShort: granularity === "month" ? monthFormatterShort(parsedDate) : end ? `${start.slice(-2)}-${end.slice(-2)}` : start,
        labelVeryShort: end ? end.slice(-2) : start.slice(-2)
    };
}

console.log(`Formatting ${sortedPeriods.length} time periods`);
const rows = [];
for (const period of sortedPeriods) {
    rows.push(parsePeriod(period))
};

writeFileSync(outPath, csvFormat(rows));
console.log(`Wrote ${outPath}`);
