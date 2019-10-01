'use strict';

const bme280 = require('../');

const round = f => parseFloat(Math.round(f * 100) / 100).toFixed(2);

const delay = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds));

let count = 0;

const read = bme280Sensor =>
  delay(40).then(_ => bme280Sensor.read());

const report = reading =>
  console.log(
    `${++count} ` +
    `${round(reading.temperature)}°C, ` +
    `${round(reading.pressure)} hPa, ` +
    `${round(reading.humidity)}%`
  );

const reportContinuous = bme280Sensor =>
  read(bme280Sensor).
  then(reading => {
    report(reading);
    setImmediate(_ => reportContinuous(bme280Sensor));
  });

bme280.open().
then(bme280Sensor => reportContinuous(bme280Sensor)).
catch(console.log);

