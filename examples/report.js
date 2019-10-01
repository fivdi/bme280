'use strict';

const bme280 = require('../');

const delay = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds));

bme280.open().then(sensor =>
  delay(40).
  then(_ => sensor.read()).
  then(reading => {
    console.log(reading);
    return sensor.close();
  })
).catch(console.log);

