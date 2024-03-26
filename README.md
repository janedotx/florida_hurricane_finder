## Code results
Hurricane data has been written to florida.csv.

## Setting up
1. Install node: https://nodejs.org/en/download. The latest LTS version should do.
2. Install pnpm: https://pnpm.io/installation.
3. Run `pnpm install` to install all packages.
4. Install sqlite3.

## Running it
The user needs to supply the right environment variables to get the scripts to run properly.

1. Run `DB=<desired_path_to_db> pnpm create_db`.
2. Run `DB=<desired_path_to_db> pnpm load_db`.
3. Run `OUTPUT_PATH=<desired_output_file> DB=<db path> pnpm write_hurricanes`.

The hurricane data should be in the file referenced by the output path.

## How does it work
The code loads the NOAA hurricane data into a SQLite3 database. I chose this approach because SQL databases make it easy to do things like rapidly query for all hurricane data that belongs to a particular cyclone number, or find the maximum wind speed for a particular cyclone number. 

I then iterate through all hurricanes that have occurred since 1900 and for each row of hurricane lng/lat data, I compare the lng/lat to the Florida coastline to see if the lng/lat ever went inside it. 

To accomplish this coastline check, I downloaded a GeoJSON file from https://github.com/danielcs88/fl_geo_json. I then used TurfJS, an open-source library maintained by MapBox, to detect whether the lng/lat was inside Florida.

## Possible areas for future improvement
1. Preemptively check points to see if they are in a bounding box for Florida (i.e. a big box that encompasses Florida). If a point is outside of this bounding box, we can skip checking it against the fine-grained Florida GeoJSON and speed the process up.
2. Add validation before entering data into the database.
3. Support emitting data to other file formats.
4. Add an automated test suite.
5. Throw the whole thing out and rewrite in a language that supports multiple threads. The checks for each hurricane are expensive and the main bottleneck probably and Node/TS may not the best fit for this problem. 