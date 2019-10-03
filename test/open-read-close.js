'use strict';

const bme280 = require('../');
const util = require('./util');

bme280.open().then(sensor =>
  sensor.read().
  then(reading => {
    console.log(`  ${util.format(reading)}`);
    return sensor.close();
  })
).catch(console.log);

