'use strict';

/*
 * Here the BME280 is configured to run using oversampling and filtering
 * options recommended for gaming by the BME280 datasheet.
 */

const bme280 = require('../');

const format = number => (Math.round(number * 100) / 100).toFixed(2);
const delay = millis => new Promise(resolve => setTimeout(resolve, millis));

const reportContinuous = async _ => {
  const sensor = await bme280.open({
    i2cBusNumber: 1,
    i2cBusAddress: 0x77,
    humidityOversampling: bme280.OVERSAMPLE.SKIPPED,
    pressureOversampling: bme280.OVERSAMPLE.X4,
    temperatureOversampling: bme280.OVERSAMPLE.X1,
    filterCoefficient: bme280.FILTER.F16
  });

  for (let i = 1; i <= 830; ++i) {
    const reading = await sensor.read();
    console.log(
      `${i} ` +
      `${format(reading.temperature)}°C, ` +
      `${format(reading.pressure)} hPa`
    );
    await delay(sensor.typicalMeasurementTime()); // 12 milliseconds, ~83Hz
  }

  await sensor.close();
};

reportContinuous().catch(console.log);

