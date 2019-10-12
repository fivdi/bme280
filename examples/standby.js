'use strict';

/*
 * Here the BME280 is configured to run with a standby period of 1000
 * milliseconds. Information is printed to the screen as quickly as possible
 * but the values printed will change at most once per second.
 */
const bme280 = require('../');

const format = number => (Math.round(number * 100) / 100).toFixed(2);
const delay = millis => new Promise(resolve => setTimeout(resolve, millis));

const reportContinuous = async _ => {
  const sensor = await bme280.open({standby: bme280.STANDBY.MS_1000});

  for (let i = 1; ; ++i) {
    const reading = await sensor.read();
    console.log(
      `${i} ` +
      `${format(reading.temperature)}°C, ` +
      `${format(reading.pressure)} hPa, ` +
      `${format(reading.humidity)}%`
    );
    await delay(sensor.typicalMeasurementTime()); // 8 milliseconds
  }
};

reportContinuous().catch(console.log);

