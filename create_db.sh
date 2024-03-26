#! /usr/bin/env sh

sqlite3 $DB 'CREATE TABLE hurricanes 
  (hurricane_id string primary key, name string);
  CREATE TABLE hurricane_data(date string, time string, 
    longitude number, latitude number, wind number, 
    hurricane_id number not null, hurricane_data_id integer primary key, 
    record_identifier string, system_status string);'