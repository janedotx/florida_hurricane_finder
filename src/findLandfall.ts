import * as fs from 'fs'
import * as turf from '@turf/turf'
import * as sqlite3 from 'sqlite3'
import { Feature, Polygon } from 'geojson'
import { getHurricaneData, getHurricanes, getMaxWindSpeed } from './sql'

function loadFloridaGeoJSON() {
  const buffer = fs.readFileSync('./fl_geo_json/fl-state.json')
  const str = buffer.toString()
  const geojson = JSON.parse(str)
  return geojson
}

// taken from 
// https://geodata.myfwc.com/datasets/myfwc::florida-shoreline-1-to-40000-scale/explore?location=27.438860%2C-82.763397%2C10.39
const FL_BOUNDING_BOX = [[-87.6, 23.97], [-87.6, 31.0],
[-79.3, 31.0], [-79.3, 23.97],
 [ -87.6,23.97]
]

// x is latitude, y is longitude
function checkPoint(x, y, shape: number[][][]) {
  // Tolerance--some of the hurricanes that NOAA deems as making landfall don't seem
  // to be directly within the geojson boundaries of Florida I found. The center of
  // the hurricanes doesn't seem to be reported with a lot of precision (only 2-3 
  // significant figures).
  // Initially, I looked up the average width of the eye of a hurricane and used that,
  // but then I caught a few hurricanes that were very close to Florida but
  // that the NOAA did not consider to have made landfall.
  const toleranceRadius = 0.035
  const toleranceBox = [[
    [x - toleranceRadius, y + toleranceRadius],
    [x + toleranceRadius, y + toleranceRadius],
    [x + toleranceRadius, y - toleranceRadius],
    [x - toleranceRadius, y - toleranceRadius],
    [x - toleranceRadius, y + toleranceRadius] 
  ]]

  const cycloneCenter: Feature<Polygon> = turf.polygon(toleranceBox)
  const shapePoly: Feature<Polygon> = turf.polygon(shape)

  return !!turf.intersect(cycloneCenter, shapePoly)
}

/* Check the coordinate against every shape.
  Return as soon as we find a shape
  Don't care about holes. If a point is inside a shape,
  it doesn't matter if it is inside a hole in the shape.
*/
function checkShapes(x, y, shapes) {
  return !!shapes.find(shape => {
    return (checkPoint(x, y, shape)) 
  }) 
}

/* See if a hurricane is inside Florida by comparing the
  lat/lng to every shape that Florida comprises. If the
  point is inside even a single shape, it is considered
  to have made landfall. 
*/
async function checkHurricane(hurricane_id, shapes: number[][][], db_conn: sqlite3.Database) {
  const rows = await getHurricaneData(hurricane_id, db_conn)
  return rows.find(row => {
    const { longitude, latitude } = row
    return checkShapes(Number(latitude), Number(longitude), shapes)
  })
}

// Finds the hurricanes and writes the data to a csv file.
async function findLandfall() {
  console.log("Finding landfalls now...")
  console.log("Loading Florida GeoJSON file...")
  const geojson = loadFloridaGeoJSON()
  const shapes: number[][][] = geojson.features[0].geometry.coordinates
  const db_conn = await new sqlite3.Database(process.env.DB)
  console.log("Retrieving hurricane data since 1900...")
  const hurricanes: { hurricane_id: string, name: string }[] = await getHurricanes(db_conn) 
  const hurricanes_1900 = hurricanes.filter(hurricane => {
    const { hurricane_id } = hurricane
    const hurricane_year = Number(hurricane_id.slice(4, hurricane_id.length))
    return (hurricane_year >= 1900)   
  })

  console.log("Checking hurricane locations against Florida GeoJSON boundary...")
  const promises = hurricanes_1900.map(async (hurricane) => {
    const { hurricane_id } = hurricane 
    const result = await checkHurricane(hurricane_id, shapes, db_conn)
    if (result) {
      const maxWindObj = await getMaxWindSpeed(hurricane_id, db_conn)
      return { hurricane, data_row: result, maxWind: maxWindObj['max(wind)'] }
    }
    return null
  })

  const results = await Promise.all(promises)

  const florida_hurricanes = results.filter(hurricane => !!hurricane)
  
  return florida_hurricanes
}

// Find hurricnaes that made landfall in Florida and write results to a .csv
async function writeFloridaHurricanes() {
  const results = await findLandfall()

  // name, date of landfall, maximum wind speed
  const lines = results.map(result => {
    const { hurricane, data_row, maxWind } = result
    const { date, time } = data_row
    const dString = String(date)
    const tString = String(time)
    const landfallYear = dString.slice(0, 4)
    const landfallMonth = dString.slice(4, 6)
    const landfallDay = dString.slice(6, 8)
    const landfallHour = tString.slice(0, 2)
    const landfallMin = tString.slice(2, 4)
    return `${hurricane.hurricane_id},${hurricane.name},${landfallYear}-${landfallMonth}-${landfallDay},${landfallHour}:${landfallMin},${maxWind}`
  })
  const outputPath = process.env.OUTPUT_PATH

  console.log("Beginning process of writing data to .csv...")
  fs.writeFileSync(outputPath,'cyclone_number,name,landfall-YYYY-MM-DD,landfall-HH:MM,wind')
  fs.writeFileSync(outputPath, "\n", { encoding:'utf8', flag: 'as+' } )

  lines.forEach(line => {
    fs.writeFileSync(outputPath, line + "\n", { encoding:'utf8', flag: 'as+' } )
  })
}

writeFloridaHurricanes().then(results => console.log("done")).catch(e => console.log(e))
