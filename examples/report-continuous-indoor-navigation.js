'use strict';

/*
 * Here the BME280 is configured to run using the default options. The
 * defaults for oversampling and filtering are those recommended by the BME280
 * datasheet for indoor navigation.
 */

const bme280 = require('../');

const round = f => (Math.round(f * 100) / 100).toFixed(2);
const delay = millis => new Promise(resolve => setTimeout(resolve, millis));

const reportContinuous = async _ => {
  const sensor = await bme280.open();

  for (let i = 1; ; ++i) {
    const reading = await sensor.read();
    console.log(
      `${i} ` +
      `${round(reading.temperature)}°C, ` +
      `${round(reading.pressure)} hPa, ` +
      `${round(reading.humidity)}%`
    );
    await delay(sensor.typicalMeasurementTime());
  }
};

reportContinuous().catch(console.log);

