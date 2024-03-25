import * as fs from 'fs'
import * as turf from '@turf/turf'
import * as sqlite3 from 'sqlite3'
import { Feature, Polygon, MultiPolygon } from 'geojson'
import { getHurricanes } from './sql'

// shape is an array of points
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
function checkPoint(x, y, shape: number[][][]) {
//  return pointInPolygon([x, y], shape)
  // eyeRadius is approximate width/2 of a hurricane eye
  // smallest eye of a hurricane is about 10 miles wide, so this is about 5 nautical miles radius
  const eyeRadius = 0.083
  const eye = [[
    [x - eyeRadius, y + eyeRadius],
    [x + eyeRadius, y + eyeRadius],
    [x + eyeRadius, y - eyeRadius],
    [x - eyeRadius, y - eyeRadius],
    [x - eyeRadius, y + eyeRadius] 
  ]]
//  console.dir(shape, { depth: null })

  const cycloneCenter: Feature<Polygon> = turf.polygon(eye)
  const shapePoly: Feature<Polygon> = turf.polygon(shape)

  return !!turf.intersect(cycloneCenter, shapePoly)

}

function checkShapes(x, y, shapes) {
  // return as soon as we find a shape
  // don't care about holes
  return !!shapes.find(shape => checkPoint(x, y, shape)) 
}
// main()

async function findLandfall() {
  const geojson = loadFloridaGeoJSON()
  const shapes: number[][][] = geojson.features[0].geometry.coordinates
  // 41.1N,  71.7W
  // andrew
  /*
  const testX = -80.2
  const testY = 25.5
  console.log("inThere or not: ", checkShapes(testX, testY, shapes))
  */


  const db_conn = await new sqlite3.Database('../hurdat.db')
  const hurricanes = await getHurricanes(db_conn)
}
findLandfall()