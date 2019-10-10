'use strict';

const bme280 = require('../');

bme280.open().then(async sensor => {
  console.log(await sensor.read());
  await sensor.close();
}).catch(console.log);

