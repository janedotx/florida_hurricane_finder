// 
/* 
  CREATE TABLE hurricanes 
  (hurricane_id string primary key, name string);
*/

//hurricane_id is cyclone name
/*
  CREATE TABLE hurricane_data(date string, time string, 
    longitude number, latitude number, wind number, 
    hurricane_id number not null, hurricane_data_id integer primary key, 
    record_identifier string, system_status string);
*/

export async function writeHurricane(cyclone_number, hurricane_name, db_conn) {
  const sql = `insert into hurricanes (hurricane_id, name) values("${cyclone_number}", "${hurricane_name}")`
  console.log(sql)
  await db_conn.exec(sql)
}

export async function writeHurricaneData(data, db_conn) {
  const sql = `insert into hurricane_data
    (date, time, longitude, latitude, wind, hurricane_id, record_identifier, system_status) 
    values("${data.date.trim()}", "${data.time.trim()}", 
    ${data.longitude}, ${data.latitude}, 
    "${data.wind}", "${data.hurricane_id}",
    "${data.record_identifier}", "${data.system_status}")`
    await db_conn.exec(sql, function(err, _) {
      if (err) {
        console.log("a catastrophic error: ", err)
        console.log("the erring sql: ", sql)
      }
    })
}

export async function getHurricanes(db_conn) {
  const sql = 'select * from hurricanes;'
  return new Promise((resolve, reject) => {
    db_conn.all(sql, function(err, result) {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        })

  }) as unknown as { hurricane_id: string, name: string }[]
}

export async function getHurricaneData(hurricane_id, db_conn) {
  const sql = `select * from hurricane_data where hurricane_id="${hurricane_id}";`
  return new Promise((resolve, reject) => {
    db_conn.all(sql, function(err, result) {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        })

  }) as unknown as any[]
}

export async function getMaxWindSpeed(hurricane_id, db_conn) {
  const sql = `select max(wind) from hurricane_data where hurricane_id="${hurricane_id}";`
  return new Promise((resolve, reject) => {
    db_conn.get(sql, function(err, result) {
          if (err) {
            reject(err)
          } else {
            resolve((result as unknown) as { 'max(wind)': number})
          }
        })

  }) 
}