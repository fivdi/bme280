'use strict';

const assert = require('assert');
const bme280 = require('../');
const util = require('./util');

let error = null;

bme280.open({
  humidityOversampling: bme280.OVERSAMPLE.X16,
  pressureOversampling: bme280.OVERSAMPLE.X16,
  temperatureOversampling: bme280.OVERSAMPLE.X16,
  forcedMode: true
}).then(async sensor => {
  // Here we trigger a measurement but don't wait for it to complete.
  await sensor.triggerForcedMeasurement();
  let reading = await sensor.read();
  console.log(`  ${util.format(reading)} (bad reading)`);

  // Here we trigger a measurement and do wait for it to complete.
  // Also, triggerForcedMeasurement is invoked while the previously triggered
  // measurement is still in progress. triggerForcedMeasurement should wait
  // for the previously triggered measurement to complete and should not throw
  // an error.
  await sensor.triggerForcedMeasurement(); 
  await util.delay(sensor.maximumMeasurementTime());
  reading = await sensor.read();
  console.log(`  ${util.format(reading)} (good reading)`);
}).catch(err => error = err).
finally(_ => assert.strictEqual(null, error));

