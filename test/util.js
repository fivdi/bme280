'use strict';

module.exports.delay = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds + 1));

module.exports.format = reading => {
  const round = f => parseFloat(Math.round(f * 100) / 100).toFixed(2);

  return `${round(reading.temperature)}°C, ` +
    `${round(reading.pressure)} hPa, ` +
    `${round(reading.humidity)}%`;
};

