'use strict';

const i2c = require('i2c-bus');

const DEFAULT_I2C_BUS = 1;
const DEFAULT_I2C_ADDRESS = 0x77;

// Registers
const TP_COEFFICIENT_REGS = 0x88;
const CHIP_ID_REG = 0xd0;
const RESET_REG = 0xe0;
const H_COEFFICIENT_REGS = 0xe1;
const CTRL_HUM_REG = 0xf2;
const STATUS_REG = 0xf3;
const CTRL_MEAS_REG = 0xf4;
const CONFIG_REG = 0xf5;
const DATA_REGS = 0xf7;

const TP_COEFFICIENT_REGS_LEN = 26;
const H_COEFFICIENT_REGS_LEN = 7;
const DATA_REGS_LEN = 8;

// CHIP_ID_REG
const CHIP_ID = 0x60;

// RESET_REG
const SOFT_RESET_COMMAND = 0xb6;

// CTRL_HUM_REG
const OSRS_H_BITS = 0x07;
const OSRS_H_SKIPPED = 0x00;
const OSRS_H_X1 = 0x01;
const OSRS_H_X2 = 0x02;
const OSRS_H_X4 = 0x03;
const OSRS_H_X8 = 0x04;
const OSRS_H_X16 = 0x05;

// STATUS_REG
const IM_UPDATE_BIT = 0x01;
const MEASURING_BIT = 0x08;

// CTRL_MEAS_REG
const MODE_BITS = 0x03;
const MODE_SLEEP = 0x00;
const MODE_FORCED = 0x01;
const MODE_NORMAL = 0x03;
const OSRS_P_BITS = 0x1c;
const OSRS_P_SKIPPED = 0x00;
const OSRS_P_X1 = 0x04;
const OSRS_P_X2 = 0x08;
const OSRS_P_X4 = 0x0c;
const OSRS_P_X8 = 0x10;
const OSRS_P_X16 = 0x14;
const OSRS_T_BITS = 0xe0;
const OSRS_T_SKIPPED = 0x00;
const OSRS_T_X1 = 0x20;
const OSRS_T_X2 = 0x40;
const OSRS_T_X4 = 0x60;
const OSRS_T_X8 = 0x80;
const OSRS_T_X16 = 0xa0;

// CONFIG_REG
const FILTER_COEFF_BITS = 0x1c;
const FILTER_COEFF_OFF = 0x00;
const FILTER_COEFF_2 = 0x04;
const FILTER_COEFF_4 = 0x08;
const FILTER_COEFF_8 = 0x0c;
const FILTER_COEFF_16 = 0x10;

const delay = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds + 1));

const open = options => {
  return Promise.resolve().then(_ => {
    options = options || {};
    const errMsg = validateOpenOptions(options);
    if (errMsg) {
      return Promise.reject(new Error(errMsg));
    }

    const i2cBusNumber = options.i2cBusNumber !== undefined ?
      options.i2cBusNumber : DEFAULT_I2C_BUS;
    return i2c.openPromisified(i2cBusNumber);
  }).
  then(i2cBus => {
    const i2cAddress = options.i2cAddress !== undefined ?
      options.i2cAddress : DEFAULT_I2C_ADDRESS;
    const bme280I2c = new Bme280I2c(i2cBus, i2cAddress);

    return bme280I2c.initialize().then(_ => new Bme280(bme280I2c));
  });
};
module.exports.open = open;

const validateOpenOptions = options => {
  if (typeof options !== 'object') {
    return 'Expected options to be of type object.' +
      ' Got type ' + typeof options + '.';
  }

  if (options.i2cBusNumber !== undefined &&
      (!Number.isSafeInteger(options.i2cBusNumber) ||
       options.i2cBusNumber < 0
      )
     ) {
    return 'Expected i2cBusNumber to be a non-negative integer.' +
      ' Got "' + options.i2cBusNumber + '".';
  }

  if (options.i2cAddress !== undefined &&
      (!Number.isSafeInteger(options.i2cAddress) ||
       options.i2cAddress < 0 ||
       options.i2cAddress > 0x7f
      )
     ) {
    return 'Expected i2cAddress to be an integer' +
      ' >= 0 and <= 0x7f. Got "' + options.i2cAddress + '".';
  }

  return null;
};

class Bme280I2c {
  constructor(i2cBus, i2cAddress) {
    this._i2cBus = i2cBus;
    this._i2cAddress = i2cAddress;
    this._coefficients = null;
  }

  readByte(register) {
    return this._i2cBus.readByte(this._i2cAddress, register);
  }

  writeByte(register, byte) {
    return this._i2cBus.writeByte(this._i2cAddress, register, byte);
  }

  readI2cBlock(register, length, buffer) {
    return this._i2cBus.readI2cBlock(
      this._i2cAddress, register, length, buffer
    );
  }

  checkChipId(tries = 5) {
    return this.readByte(CHIP_ID_REG).
    then(chipId => {
      if (chipId !== CHIP_ID) {
        return Promise.reject(new Error(
          `Expected bme280 chip id to be 0x${CHIP_ID.toString(16)}` +
          `, got chip id 0x${chipId.toString(16)}`
        ));
      }
    }).catch(err => {
      if (tries > 1) {
        return delay(1).then(_ => this.checkChipId(tries - 1));
      }
      return Promise.reject(err);
    });
  }

  softReset() {
    return this.writeByte(RESET_REG, SOFT_RESET_COMMAND);
  }

  waitForImageRegisterUpdate(tries = 5) {
    return delay(2).
    then(_ => this.readByte(STATUS_REG)).
    then(statusReg => {
      if ((statusReg & IM_UPDATE_BIT) !== 0) {
        if (tries - 1 > 0) {
          return this.waitForImageRegisterUpdate(tries - 1);
        }
        return Promise.reject(new Error('Image register update failed'));
      }
    });
  }

  readCoefficients() {
    const tpRegs = Buffer.alloc(TP_COEFFICIENT_REGS_LEN);
    const hRegs = Buffer.alloc(H_COEFFICIENT_REGS_LEN);

    return this.readI2cBlock(
      TP_COEFFICIENT_REGS, TP_COEFFICIENT_REGS_LEN, tpRegs
    ).
    then(_ => this.readI2cBlock(
      H_COEFFICIENT_REGS, H_COEFFICIENT_REGS_LEN, hRegs
    )).
    then(_ => {
      this._coefficients = Object.freeze({
        t1: tpRegs.readUInt16LE(0),
        t2: tpRegs.readInt16LE(2),
        t3: tpRegs.readInt16LE(4),

        p1: tpRegs.readUInt16LE(6),
        p2: tpRegs.readInt16LE(8),
        p3: tpRegs.readInt16LE(10),
        p4: tpRegs.readInt16LE(12),
        p5: tpRegs.readInt16LE(14),
        p6: tpRegs.readInt16LE(16),
        p7: tpRegs.readInt16LE(18),
        p8: tpRegs.readInt16LE(20),
        p9: tpRegs.readInt16LE(22),

        h1: tpRegs.readUInt8(25),
        h2: hRegs.readInt16LE(0),
        h3: hRegs.readUInt8(2),
        h4: (hRegs.readInt8(3) * 16) | (hRegs[4] & 0xf),
        h5: (hRegs.readInt8(5) * 16) | (hRegs[4] >> 4),
        h6: hRegs.readInt8(6)
      });
    });
  }

  configureSettings() {
    return this.readByte(CTRL_HUM_REG).
    then(ctrlHumReg => this.writeByte(
      CTRL_HUM_REG, (ctrlHumReg & ~OSRS_H_BITS) | OSRS_H_X1
    )).
    then(_ => this.readByte(CTRL_MEAS_REG)).
    then(ctrlMessReg => this.writeByte(
      CTRL_MEAS_REG,
      (ctrlMessReg & ~(OSRS_T_BITS | OSRS_P_BITS)) |
        OSRS_T_X2 | 
        OSRS_P_X16 |
        MODE_NORMAL
    )).
    then(_ => this.writeByte(CONFIG_REG, FILTER_COEFF_16));
  }

  readRawData() {
    return this.readI2cBlock(
      DATA_REGS, DATA_REGS_LEN, Buffer.alloc(DATA_REGS_LEN)
    ).
    then(dataRegs => {
      const regs = dataRegs.buffer;

      return {
        pressure: regs[0] << 12 | regs[1] << 4 | regs[2] >> 4,
        temperature: regs[3] << 12 | regs[4] << 4 | regs[5] >> 4,
        humidity: regs[6] << 8 | regs[7]
      };
    });
  }

  compensateTemperature(adcT) {
    const c = this._coefficients;

    return ((adcT / 16384 - c.t1 / 1024) * c.t2) +
      ((adcT / 131072 - c.t1 / 8192) * (adcT / 131072 - c.t1 / 8192) * c.t3);
  }

  compensateHumidity(adcH, tFine) {
    const c = this._coefficients;

    let h = tFine - 76800;
    h = (adcH - (c.h4 * 64 + c.h5 / 16384 * h)) *
      (c.h2 / 65536 * (1.0 + c.h6 / 67108864 * h * (1 + c.h3 / 67108864 * h)));
    h = h * (1 - c.h1 * h / 524288);

    if (h > 100) {
      h = 100;
    } else if (h < 0) {
      h = 0;
    }

    return h;
  }

  compensatePressure(adcP, tFine) {
    const c = this._coefficients;

    let var1 = tFine / 2 - 64000;
    let var2 = var1 * var1 * c.p6 / 32768;
    var2 = var2 + var1 * c.p5 * 2;
    var2 = (var2 / 4) + (c.p4 * 65536);
    var1 = (c.p3 * var1 * var1 / 524288 + c.p2 * var1) / 524288;
    var1 = (1 + var1 / 32768) * c.p1;

    if (var1 === 0) {
      return 0; // avoid exception caused by division by zero
    }

    let p = 1048576 - adcP;
    p = (p - (var2 / 4096)) * 6250 / var1;
    var1 = c.p9 * p * p / 2147483648;
    var2 = p * c.p8 / 32768;
    p = p + (var1 + var2 + c.p7) / 16;

    return p;
  }

  compensateRawData(rawData) {
    const tFine = this.compensateTemperature(rawData.temperature);
    const humidity = this.compensateHumidity(rawData.humidity, tFine);
    const pressure = this.compensatePressure(rawData.pressure, tFine);

    return {
      temperature: tFine / 5120,
      pressure: pressure / 100,
      humidity: humidity
    };
  }

  initialize() {
    return this.checkChipId().
    then(_ => this.softReset()).
    then(_ => this.waitForImageRegisterUpdate()).
    then(_ => this.readCoefficients()).
    then(_ => this.configureSettings());
  }

  close() {
    return this._i2cBus.close();
  }

  read() {
    return this.readRawData().
    then(rawData => this.compensateRawData(rawData));
  }
}

class Bme280 {
  constructor(bme280I2c) {
    this._bme280I2c = bme280I2c;
  }

  close() {
    return this._bme280I2c.close();
  }

  read() {
    return this._bme280I2c.read();
  }
}

