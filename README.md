[![Build Status](https://travis-ci.org/fivdi/bme280.svg?branch=master)](https://travis-ci.org/fivdi/bme280)
[![npm Version](http://img.shields.io/npm/v/bme280.svg)](https://www.npmjs.com/package/bme280)
[![Downloads Per Month](http://img.shields.io/npm/dm/bme280.svg)](https://www.npmjs.com/package/bme280)

# bme280

Node.js I2C driver for the BME280 humidity, pressure and temperature sensor on
Linux boards like the Raspberry Pi or BeagleBone.

Supports Node.js versions 6, 8, 10 and 12.

## Contents

 * [Features](#features)
 * [Installation](#installation)
 * [Usage](#usage)
 * [API](#api)
 * [Related Packages](#related-packages)

## Features

 * Easy humidity, pressure and temperature sensing
 * Supports oversampling and filtering
 * Promise based asynchronous API

## Installation

```
npm install bme280
```

## Usage

#### Circuit

![](doc/bme280-pi.png)

#### Report the Humidity, Pressure and Temperature
```js
const bme280 = require('bme280');

bme280.open().then(sensor =>
  sensor.read().
  then(reading => {
    console.log(reading);
    return sensor.close();
  })
).catch(console.log);
```

Sample output:
```js
{
  temperature: 22.80022401222959,
  pressure: 990.4595757059205,
  humidity: 51.50271664115457
}
```
#### Using Options When Invoking `open`
```js
const bme280 = require('bme280');

const round = f => (Math.round(f * 100) / 100).toFixed(2);

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
```

Sample output:
```
1 23.09°C, 987.51 hPa
2 23.10°C, 987.54 hPa
3 23.10°C, 987.54 hPa
4 23.10°C, 987.54 hPa
5 23.10°C, 987.54 hPa
6 23.10°C, 987.54 hPa
...
```
## API

- [Functions](#functions)
- [Class Bme280](#class-bme280)
- [Enum OVERSAMPLE](#enum-oversample)
- [Enum FILTER](#enum-filter)

### Functions

- [open([options])](#openoptions)

#### open([options])
Returns a Promise that will be resolved with a Bme280 object on success, or
will be rejected if an error occurs.

The BME280 will be configured to run in 'normal' mode using the specified
options or defaults for options that are not specified. The defaults for
oversampling and filtering are those recommended by the BME280 datasheet
for indoor navigation.

open waits until the BME280 has completed its first measurement before
resolving.

The following options are supported:
- i2cBusNumber - integer, I2C bus number, optional, default 1
- i2cAddress - integer, BME280 I2C address, optional, default 0x77
- humidityOversampling - One of the [OVERSAMPLE](#enum-oversample) enum
values, controls oversampling of humidity data, optional, default
OVERSAMPLE.X1
- pressureOversampling - One of the [OVERSAMPLE](#enum-oversample) enum
values, controls oversampling of pressure data, optional, default
OVERSAMPLE.X16
- temperatureOversampling - One of the [OVERSAMPLE](#enum-oversample) enum
values, optional, controls oversampling of temperature data, default
OVERSAMPLE.X2
- filterCoefficient - One of the [FILTER](#enum-filter) enum values, optional,
slows down the response to the sensor inputs, default FILTER.F16

### Class Bme280

- [close()](#close)
- [read()](#read)
- [typicalMeasurementTime()](#typicalmeasurementtime)

#### close()
Returns a Promise that will be resolved with no arguments once the underlying
resources have been released, or will be rejected if an error occurs while
closing.

#### read()
Returns a Promise that will be resolved with an object containing a sensor
reading on success, or will be rejected if an error occurs.

An object containing a sensor reading has the following properties:
- humidity - number, relative humidity in percent
- pressure - number, pressure in hectopascal (1 hPa = 1 millibar)
- temperature - number, temperature in degrees Celsius

#### typicalMeasurementTime()
The typical measurement time depends on the selected values for humidity,
pressure and temperature oversampling. typicalMeasurementTime returns the
typical measurement time in milliseconds.

When the default values for humidity, pressure and temperature oversampling
are used, the typical measurement time is 40 milliseconds.

### Enum OVERSAMPLE

#### SKIPPED
Measurement skipped. The corresponding property in a sensor reading object
will be undefined.
#### X1
Oversampling × 1
#### X2
Oversampling × 2
#### X4
Oversampling × 4
#### X8
Oversampling × 8
#### X16
Oversampling × 16

### Enum FILTER

Used to slow down the response to the sensor inputs.

#### OFF
Filter off
#### F2
Filter coefficient = 2
#### F4
Filter coefficient = 4
#### F8
Filter coefficient = 8
#### F16
Filter coefficient = 16

## Related Packages

- [i2c-bus](https://github.com/fivdi/i2c-bus) - I2C serial bus access

