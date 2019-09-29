'use strict';

const bme280 = require('../');

bme280.open({i2cAddress: 0x77}).then(sensor =>
  sensor.read().
  then(reading =>
    console.log(
      '     humidity = ' + reading.humidity + '%, ' +
      '     pressure = ' + reading.pressure + ' hPa, ' +
      '  temperature = ' + reading.temperature + '°C'
    )
  ).
  then(_ => sensor.close())
).catch(console.log);

