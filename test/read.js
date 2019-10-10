'use strict';

const bme280 = require('../');
const util = require('./util');

bme280.open().then(async sensor => {
  const reading = await sensor.read();
  console.log(`  ${util.format(reading)}`);
  await sensor.close();
}).catch(console.log);

