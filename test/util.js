'use strict';

const round = f => parseFloat(Math.round(f * 100) / 100).toFixed(2);

module.exports.delay = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds + 1));

module.exports.format = reading =>
  (reading.temperature ? `${round(reading.temperature)}°C` : '') +
  (reading.pressure ? `, ${round(reading.pressure)} hPa` : '') +
  (reading.humidity ? `, ${round(reading.humidity)}%` : '');

