'use strict';

const bme280 = require('../');

const round = f => parseFloat(Math.round(f * 100) / 100).toFixed(2);

const delay = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds));

let count = 0;

const read = sensor =>
  delay(40).then(_ => sensor.read());

const report = reading =>
  console.log(
    `${++count} ` +
    `${round(reading.temperature)}°C, ` +
    `${round(reading.pressure)} hPa, ` +
    `${round(reading.humidity)}%`
  );

const reportContinuous = sensor =>
  read(sensor).
  then(reading => {
    report(reading);
    setImmediate(_ => reportContinuous(sensor));
  });

bme280.open().
then(sensor => reportContinuous(sensor)).
catch(console.log);

