// 
/* CREATE TABLE hurricanes 
  (hurricane_id integer primary key, name string, cyclone_number string);
*/

//hurricane_id is cyclone name
/*
  CREATE TABLE hurricane_data(date string, time string, 
    longitude number, latitude number, wind number, 
    hurricane_id number not null, hurricane_data_id integer primary key, 
    record_identifier string, system_status string);
*/

exports.writeHurricane = async function (hurricane_name, cyclone_number, db_conn) {
  const sql = `insert into hurricanes (name, cyclone_number) values("${hurricane_name.trim()}", "${cyclone_number.trim()}")`
  console.log(sql)
  await db_conn.exec(sql)
}

exports.writeHurricaneData = async function (data, db_conn) {
//  console.log("data: ", data)
  const sql = `insert into hurricane_data
    (date, time, longitude, latitude, wind, hurricane_id, record_identifier, system_status) 
    values("${data.date.trim()}", "${data.time.trim()}", 
    ${data.longitude}, ${data.latitude}, 
    "${data.wind}", "${data.hurricane_id}",
    "${data.record_identifier}", "${data.system_status}")`
//  console.log(sql)
    await db_conn.exec(sql, function(err, result) {
      if (err) {

        console.log("errorz: ", err)
        console.log("sql errorz: ", sql)
      }
    })
}