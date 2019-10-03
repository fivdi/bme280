'use strict';

const bme280 = require('../');

const round = f => parseFloat(Math.round(f * 100) / 100).toFixed(2);

let count = 0;

const report = reading =>
  console.log(
    `${++count} ` +
    `${round(reading.temperature)}°C, ` +
    `${round(reading.pressure)} hPa, ` +
    `${round(reading.humidity)}%`
  );

const reportContinuous = sensor =>
  sensor.read().
  then(reading => {
    report(reading);
    setTimeout(_ => reportContinuous(sensor), sensor.typicalMeasurementTime());
  });

bme280.open().
then(sensor => reportContinuous(sensor)).
catch(console.log);

