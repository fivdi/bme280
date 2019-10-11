'use strict';

const bme280 = require('../');
const util = require('./util');

const delay = millis => new Promise(resolve => setTimeout(resolve, millis));

bme280.open({
  forcedMode: true,
  humidityOversampling: bme280.OVERSAMPLE.X16,
  pressureOversampling: bme280.OVERSAMPLE.X16,
  temperatureOversampling: bme280.OVERSAMPLE.X16
}).then(async sensor => {
  await sensor.triggerForcedMeasurement();
  await delay(sensor.typicalMeasurementTime());
  const reading = await sensor.read();
  console.log(`  ${util.format(reading)}`);
  await sensor.close();
}).catch(console.log);

