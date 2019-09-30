'use strict';

const bme280 = require('../');

const delay = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds));

let count = 0;

const print = reading => {
  const round = f => parseFloat(Math.round(f * 100) / 100).toFixed(2);

  count += 1;
  console.log(
    `${count} ` +
    `${round(reading.temperature)}°C, ` +
    `${round(reading.pressure)} hPa, ` +
    `${round(reading.humidity)}%`
  );
};

const readAndReport = bme280Sensor =>
  delay(40).
  then(_ => bme280Sensor.read()).
  then(reading => print(reading)).
  then(_ => setImmediate(_ => readAndReport(bme280Sensor))).
  catch(console.log);

bme280.open().
then(bme280Sensor => readAndReport(bme280Sensor)).
catch(console.log);

