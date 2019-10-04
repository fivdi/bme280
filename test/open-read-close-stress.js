'use strict';

const bme280 = require('../');
const util = require('./util');

const round = f => (Math.round(f * 100) / 100).toFixed(2);
const delay = millis => new Promise(resolve => setTimeout(resolve, millis));

const reportContinuous = async _ => {
  try {
    for (let i = 1; i <= 1000000; ++i) {
      const sensor = await bme280.open({
        humidityOversampling: bme280.OVERSAMPLE.SKIPPED,
        pressureOversampling: bme280.OVERSAMPLE.SKIPPED,
        temperatureOversampling: bme280.OVERSAMPLE.X1,
        filterCoefficient: bme280.FILTER.OFF
      });

      const reading = await sensor.read();

      if (i % 100 === 0) {
        console.log(`${i} ${util.format(reading)}`);
      }

      await delay(sensor.typicalMeasurementTime());
      await sensor.close();
    }
  } catch (e) {
    console.log(e.stack);
  }
};

reportContinuous();

