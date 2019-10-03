'use strict';

const bme280 = require('../');

const round = f => parseFloat(Math.round(f * 100) / 100).toFixed(2);

let count = 0;

const report = reading =>
  console.log(
    `${++count} ` +
    `${round(reading.temperature)}°C, ` +
    `${round(reading.pressure)} hPa`
  );

const reportContinuous = sensor =>
  sensor.read().
  then(reading => {
    report(reading);
    setTimeout(_ => reportContinuous(sensor), sensor.typicalMeasurementTime());
  }).catch(console.log);

/*
 * Here the BME280 is configured to run in 'normal' mode using oversampling
 * and filtering options recommended by the BME280 datasheet for gaming.
 */
bme280.open({
  i2cBusNumber: 1,
  i2cBusAddress: 0x77,
  humidityOversampling: bme280.OVERSAMPLE.SKIPPED,
  pressureOversampling: bme280.OVERSAMPLE.X4,
  temperatureOversampling: bme280.OVERSAMPLE.X1,
  filterCoefficient: bme280.FILTER.F16
}).
then(sensor => reportContinuous(sensor)).
catch(console.log);

