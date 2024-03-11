# This is a _very_ rough and ready script for creating rows of geography metadata.
# Use it with caution!
# The command-line argument is the path of the ChangeHistory.csv file from
# the Code History Database, downloaded from https://geoportal.statistics.gov.uk/

import csv
import sys

ch_filename = sys.argv[1]

countries = {
    "E": {"code": "E92000001", "name": "England"},
    "N": {"code": "N92000002", "name": "Northern Ireland"},
    "S": {"code": "S92000003", "name": "Scotland"},
    "W": {"code": "W92000004", "name": "Wales"}
}

missing_codes = set(["E06000063", "E06000064", "E06000065", "E10000021", "E07000150", "E07000151", "E07000152", "E07000153", "E07000154", "E07000155", "E07000156", "E07000205", "E07000206", "E07000201", "E07000204", "E10000002", "E07000004", "E07000005", "E07000006", "E07000007", "E06000028", "E06000029", "E10000009", "E07000048", "E07000049", "E07000050", "E07000051", "E07000052", "E07000053", "E06000066", "E07000190", "E07000191", "E06000048", "E08000020", "E07000097", "E07000100", "E07000101", "E07000104", "S12000046", "S12000044"])

with open(ch_filename, 'r') as f:
    reader = csv.DictReader(f)
    change_history_rows = [item for item in reader]

change_history_lookup = {d["GEOGCD"]: d for d in change_history_rows}

def print_missing_places(to_string_fn):
    for item in change_history_rows:
        if item["GEOGCD"] in missing_codes:
            print(to_string_fn(item))

show_geog_info = lambda item: item["GEOGCD"] + ',,,'

def quote(s):
    # This won't work if s contains quotes
    return '"' + s + '"'

def show_parent_lookup(item):
    country_letter = item["GEOGCD"][0]
    country = countries[country_letter]
    return ",".join([
        item["GEOGCD"],
        country["code"] if country_letter == "S" else item["PARENTCD"],
        country["code"],
        country["name"] if country_letter == "S" else quote(change_history_lookup[item["PARENTCD"]]["GEOGNM"]),
        country["name"]
    ])

def show_area_name(item):
    return item["GEOGCD"] + ',' + quote(item["GEOGNM"])

print_missing_places(show_geog_info)
print()
print_missing_places(show_parent_lookup)
print()
print_missing_places(show_area_name)

