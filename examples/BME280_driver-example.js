'use strict';

/*
 * This example emulates the BoschSensortec/BME280_driver example found at:
 * https://github.com/BoschSensortec/BME280_driver/blob/master/examples/linux_userspace.c
 */

const bme280 = require('../');

const format = number => (Math.round(number * 100) / 100).toFixed(2);
const delay = millis => new Promise(resolve => setTimeout(resolve, millis));

const reportContinuous = async _ => {
  const sensor = await bme280.open({
    humidityOversampling: bme280.OVERSAMPLE.X1,
    pressureOversampling: bme280.OVERSAMPLE.X16,
    temperatureOversampling: bme280.OVERSAMPLE.X2,
    filterCoefficient: bme280.FILTER.F16,
    forcedMode: true
  });

  for (let i = 1; ; ++i) {
    await sensor.triggerForcedMeasurement();
    await delay(sensor.typicalMeasurementTime()); // 40 milliseconds

    const reading = await sensor.read();
    console.log(
      `${i} ` +
      `${format(reading.temperature)}°C, ` +
      `${format(reading.pressure)} hPa, ` +
      `${format(reading.humidity)}%`
    );
  }
};

reportContinuous().catch(console.log);

