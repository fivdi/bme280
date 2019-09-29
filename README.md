[![Build Status](https://travis-ci.org/fivdi/bme280.svg?branch=master)](https://travis-ci.org/fivdi/bme280)
[![npm Version](http://img.shields.io/npm/v/bme280.svg)](https://www.npmjs.com/package/bme280)
[![Downloads Per Month](http://img.shields.io/npm/dm/bme280.svg)](https://www.npmjs.com/package/bme280)

# bme280

BME280 humidity, pressure and temperature sensor I2C driver for Node.js on
Linux boards like the Raspberry Pi or BeagleBone.

Supports Node.js versions 6, 8, 10 and 12.

## Contents

 * [Features](#features)
 * [Installation](#installation)
 * [Usage](#usage)
   * [Circuit](#circuit)
   * [Report the Humidity, Pressure and Temperature](#report-humidity-pressure-and-temperature)
 * [API](#api)
 * [Related Packages](#related-packages)

## Features

 * Easy humidity, pressure and temperature sensing
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

const delay = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds));

bme280.open().then(bme280Sensor =>
  delay(40).
  then(_ => bme280Sensor.read()).
  then(console.log).
  then(_ => bme280Sensor.close())
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
## API

### Functions

- [open([options])](#openoptions)

### Class Bme280

- [close()](#close)
- [read()](#read)

#### open([options])
Returns a Promise that will be resolved with a Bme280 object on success, or will be rejected if an error occurs.

The following options are supported:
- i2cBusNumber - integer, I2C bus number, optional, default 1
- i2cAddress - integer, BME280 I2C address, optional, default 0x77

#### close()
Returns a Promise that will be resolved with no arguments once the underlying resources have been released, or will be rejected if an error occurs while closing.

#### read()
Returns a Promise that will be resolved with an object containing a sensor reading on success, or will be rejected if an error occurs.

An object containing a sensor reading has the following properties:
- humidity - number, relative humidity in percent
- pressure - number, pressure in hectopascal (1 hPa = 1 millibar)
- temperature - number, temperature in degrees Celsius

## Related Packages

- [i2c-bus](https://github.com/fivdi/i2c-bus) - I2C serial bus access

