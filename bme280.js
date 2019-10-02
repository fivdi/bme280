'use strict';

const i2c = require('i2c-bus');

const DEFAULT_I2C_BUS = 1;
const DEFAULT_I2C_ADDRESS = 0x77;

const OVERSAMPLE = {
  SKIPPED: 0,
  X1: 1,
  X2: 2,
  X4: 3,
  X8: 4,
  X16: 5
};

const MODE = {
  SLEEP: 0,
  FORCED: 1,
  NORMAL: 3
};

const FILTER = {
  OFF: 0,
  X2: 1,
  X4: 2,
  X8: 3,
  X16: 4
};

const REGS = {
  TP_COEFFICIENT: 0x88,
  CHIP_ID: 0xd0,
  RESET: 0xe0,
  H_COEFFICIENT: 0xe1,
  CTRL_HUM: 0xf2,
  STATUS: 0xf3,
  CTRL_MEAS: 0xf4,
  CONFIG: 0xf5,
  DATA: 0xf7
};

const REG_LENGTHS = {
  TP_COEFFICIENT: 26,
  H_COEFFICIENT: 7,
  DATA: 8
};

const CHIP_ID = 0x60;
const SOFT_RESET_COMMAND = 0xb6;

// STATUS register
const STATUS = Object.freeze({
  IM_UPDATE_BIT: 0x01,
  MEASURING_BIT: 0x08
});

// CTRL_HUM register
const CTRL_HUM = {
  OSRS_H_MASK: 0x07,
  OSRS_H_POS: 0x00
};

// CTRL_MEAS register
const CTRL_MEAS = {
  MODE_POS: 0x00,
  OSRS_P_POS: 0x02,
  OSRS_T_POS: 0x05
};

// CONFIG register
const CONFIG = {
  FILTER_POS: 2
};

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
    return this.readByte(REGS.CHIP_ID).
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
    return this.writeByte(REGS.RESET, SOFT_RESET_COMMAND);
  }

  waitForImageRegisterUpdate(tries = 5) {
    return delay(2).
    then(_ => this.readByte(REGS.STATUS)).
    then(statusReg => {
      if ((statusReg & STATUS.IM_UPDATE_BIT) !== 0) {
        if (tries - 1 > 0) {
          return this.waitForImageRegisterUpdate(tries - 1);
        }
        return Promise.reject(new Error('Image register update failed'));
      }
    });
  }

  readCoefficients() {
    const tpRegs = Buffer.alloc(REG_LENGTHS.TP_COEFFICIENT);
    const hRegs = Buffer.alloc(REG_LENGTHS.H_COEFFICIENT);

    return this.readI2cBlock(
      REGS.TP_COEFFICIENT, REG_LENGTHS.TP_COEFFICIENT, tpRegs
    ).
    then(_ => this.readI2cBlock(
      REGS.H_COEFFICIENT, REG_LENGTHS.H_COEFFICIENT, hRegs
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
    return this.readByte(REGS.CTRL_HUM).
    then(ctrlHumReg => this.writeByte(
      REGS.CTRL_HUM,
      (ctrlHumReg & ~CTRL_HUM.OSRS_H_MASK) |
      (OVERSAMPLE.X1 << CTRL_HUM.OSRS_H_POS)
    )).
    then(_ => this.writeByte(
      REGS.CTRL_MEAS,
      (OVERSAMPLE.X2 << CTRL_MEAS.OSRS_T_POS) |
      (OVERSAMPLE.X16 << CTRL_MEAS.OSRS_P_POS) |
      (MODE.NORMAL << CTRL_MEAS.MODE_POS)
    )).
    then(_ => this.writeByte(REGS.CONFIG, FILTER.X16 << CONFIG.FILTER_POS));
  }

  readRawData() {
    return this.readI2cBlock(
      REGS.DATA, REG_LENGTHS.DATA, Buffer.alloc(REG_LENGTHS.DATA)
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

