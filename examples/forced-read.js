'use strict';

const bme280 = require('../');

const delay = millis => new Promise(resolve => setTimeout(resolve, millis));

const forcedRead = async sensor => {
  await sensor.triggerForcedMeasurement();
  await delay(sensor.maximumMeasurementTime());
  console.log(await sensor.read());
};

bme280.open({forcedMode: true}).then(sensor => {
  setInterval(_ => {
    forcedRead(sensor).catch(console.log);
  }, 1000);
}).catch(console.log);

