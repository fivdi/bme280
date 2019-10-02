'use strict';

const bme280 = require('../');
const util = require('./util');

const openReadCloseOnce = _ =>
  bme280.open({
    humidityOversampling: bme280.OVERSAMPLE.SKIPPED,
    pressureOversampling: bme280.OVERSAMPLE.SKIPPED,
    temperatureOversampling: bme280.OVERSAMPLE.X1,
    filterCoefficient: bme280.FILTER.OFF
  }).
  then(sensor =>
    util.delay(4).
    then(_ => sensor.read()).
    then(reading =>
      sensor.close().
      then(_ => reading)
    )
  );

const openReadClose = count =>
  openReadCloseOnce().
  then(reading => {
    if (count % 100 === 0) {
      console.log(`${count} ${util.format(reading)}`);
    }
    if (count > 0) {
      setImmediate(_ => openReadClose(count - 1));
    }
  }).catch(console.log);

openReadClose(1000000);

