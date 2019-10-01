'use strict';

const bme280 = require('../');
const util = require('./util');

const openReadCloseOnce = _ => 
  bme280.open().
  then(sensor =>
    util.delay(40).
    then(_ => sensor.read()).
    then(reading =>
      sensor.close().
      then(_ => reading)
    )
  ).catch(console.log);

const openReadClose = count =>
  openReadCloseOnce().
  then(reading => {
    if (count % 10 === 0) {
      console.log(`${count} ${util.format(reading)}`);
    }
    if (count > 0) {
      setImmediate(_ => openReadClose(count - 1));
    }
  }).catch(console.log);

openReadClose(1000000);

