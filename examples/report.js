'use strict';

const bme280 = require('../');

bme280.open().then(sensor =>
  sensor.read().
  then(reading => {
    console.log(reading);
    return sensor.close();
  })
).catch(console.log);

