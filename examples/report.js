'use strict';

const bme280 = require('../');

const delay = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds));

bme280.open().then(bme280Sensor =>
  delay(40).
  then(_ => bme280Sensor.read()).
  then(console.log).
  then(_ => bme280Sensor.close())
).catch(console.log);

