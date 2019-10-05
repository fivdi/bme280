'use strict';

/*
 * Here the BME280 is configured to run using the default options. The
 * defaults for oversampling and filtering are those recommended by the BME280
 * datasheet for indoor navigation.
 */

const bme280 = require('../');

const format = number => (Math.round(number * 100) / 100).toFixed(2);
const delay = millis => new Promise(resolve => setTimeout(resolve, millis));

const reportContinuous = async _ => {
  const sensor = await bme280.open();

  for (let i = 1; i <= 250; ++i) {
    const reading = await sensor.read();
    console.log(
      `${i} ` +
      `${format(reading.temperature)}°C, ` +
      `${format(reading.pressure)} hPa, ` +
      `${format(reading.humidity)}%`
    );
    await delay(sensor.typicalMeasurementTime()); // 40 milliseconds, 25Hz
  }

  await sensor.close();
};

reportContinuous().catch(console.log);

