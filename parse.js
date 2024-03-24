// all coords must be lng/lat
const pointInPolygon = require('point-in-polygon')
const fs = require('fs')
const lineReader = require('line-reader')

const sqlite3 = require('sqlite3')
const sqlMethods = require('./sql.js')

const NUM_HEADER_COLS = 4

// taken from 
// https://geodata.myfwc.com/datasets/myfwc::florida-shoreline-1-to-40000-scale/explore?location=27.438860%2C-82.763397%2C10.39
const FL_BOUNDING_BOX = [[-87.6, 23.97], [-87.6, 31.0],
[-79.3, 31.0], [-79.3, 23.97],
 [ -87.6,23.97]
]

function loadFloridaGeoJSON() {
  const buffer = fs.readFileSync('fl_geo_json/fl-state.json')
  const str = buffer.toString()
  const geojson = JSON.parse(str)
  return geojson
}

// shape is an array of points
function checkPoint(x, y, shape) {
  return pointInPolygon([x, y], shape)
}

function checkShapes(x, y, shapes) {
  // return as soon as we find a shape
  // don't care about holes
  return !!shapes.find(shape => checkPoint(x, y, shape[0])) 
}

function main() {
  const geojson = loadFloridaGeoJSON()
  const shapes = geojson.features[0].geometry.coordinates
  const testX = -81.95994574587384
  const testY = 27.91914332348675
  console.log("inThere or not: ", checkShapes(testX, testY, shapes))
}

// main()

function parseLatitude(lat_str) {
  lat_str = lat_str.trim()
  lat_str = lat_str.replace("-", '')
  if (lat_str.match('W')) {
    lat_str = lat_str.replace('W', '')
    lat_str = `-${lat_str}`
  }
  if (lat_str.match('E')) lat_str = lat_str.replace('E', '')
  return Number(lat_str)
}

async function loadHURDAT2() {
  let counter = 0
  let curHurricane = null
  const db = await new sqlite3.Database('./hurdat.db')
  lineReader.eachLine('./hurdat2-atl-02052024.txt', async function (line, last) {
    const cols = line.split(',')
    if (counter === 0) {
      if (cols.length === NUM_HEADER_COLS) {
        console.log("line: ", line)
        curHurricane = cols[0].trim()
        await sqlMethods.writeHurricane(cols[1], curHurricane, db)
        counter = Number(cols[2].trim())
      }
    } else {
      counter -= 1
      const longitude = Number(cols[4].trim().replace('N', ''))
      const latitude = parseLatitude(cols[5])
      await sqlMethods.writeHurricaneData({
        longitude, latitude, hurricane_id: curHurricane,
        date: cols[0].trim(), time: cols[1].trim(),
        wind: cols[6].trim(), record_identifier: cols[2].trim(),
        system_status: cols[3].trim()
      }, db)
      if (last) return false
    }
  })
}

loadHURDAT2().then(x => console.log(x)).catch(e => console.log(e))

// delete from hurricanes;