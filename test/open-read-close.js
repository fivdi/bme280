'use strict';

const bme280 = require('../');
const util = require('./util');

bme280.open().then(sensor =>
  util.delay(40).
  then(_ => sensor.read()).
  then(reading => console.log(`  ${util.format(reading)}`)).
  then(_ => sensor.close())
).catch(console.log);

