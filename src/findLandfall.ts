
 import * as turf from 'turf'
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
function checkPoint(x, y, shape) {
//  return pointInPolygon([x, y], shape)
}

function checkShapes(x, y, shapes) {
  // return as soon as we find a shape
  // don't care about holes
  // eyeRadius is approximate width/2 of a hurricane eye
  const eyeRadius = 0.083
  const eye = [[
    x - eyeRadius, y + eyeRadius,
    x + eyeRadius, y + eyeRadius,
    x + eyeRadius, y - eyeRadius,
    x - eyeRadius, y - eyeRadius,
    x - eyeRadius, y + eyeRadius 
  ]]

  return !!shapes.find(shape => checkPoint(x, y, shape[0])) 
}
// main()

async function findLandfall() {
  const geojson = loadFloridaGeoJSON()
  const shapes = geojson.features[0].geometry.coordinates
  // 41.1N,  71.7W
  const testX = -76.6
  const testY = 25.4
  console.log("inThere or not: ", checkShapes(testX, testY, shapes))
}
findLandfall()