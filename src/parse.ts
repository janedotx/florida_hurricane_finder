// all coords must be lng/lat
import * as lineReader from 'line-reader'

import * as sqlite3 from 'sqlite3'
import * as sqlMethods from './sql'

const NUM_HEADER_COLS = 4

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
        curHurricane = cols[0].trim()
        await sqlMethods.writeHurricane(curHurricane, cols[1].trim(), db)
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

// run this only once, no foreign key constraints put in yet
// loadHURDAT2().then(x => console.log(x)).catch(e => console.log(e))

// delete from hurricanes;