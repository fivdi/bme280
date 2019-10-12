'use strict';

const assert = require('assert');
const bme280 = require('../');

let actualErrMessage;
const expectedErrMessage = 'triggerForcedMeasurement can\'t be invoked in normal mode.';

bme280.open().then(async sensor => {
  await sensor.triggerForcedMeasurement();
}).catch(err => actualErrMessage = err.message).
finally(_ => assert.strictEqual(actualErrMessage, expectedErrMessage));

