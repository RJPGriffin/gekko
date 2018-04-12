/*

  STC Demo Strategy - RJPGriffin 12/4/2018

*/

// helpers
var _ = require('lodash');
var log = require('../core/log.js');
var config = require('../core/util.js').getConfig();


var STC = require('./indicators/STC.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.name = 'STC';

  config.backtest.batchSize = 1000; // increase performance
  config.silent = true; // NOTE: You may want to set this to 'false' @ live
  config.debug = false;

  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('stc', 'STC', this.settings.STC);
}

// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
  // var digits = 2;
  // var stc = this.indicators.stc;
  //
  // log.debug('calculated RSI properties for candle:');
  // log.debug('\t', 'stc:', stc.result.toFixed(digits));
  // log.debug('\t', 'price:', candle.close.toFixed(digits));
}

method.check = function() {
  var stc = this.indicators.stc;
  var stcVal = stc.result;

  if (stcVal > this.settings.thresholds.high) {

    // new trend detected
    if (this.trend.direction !== 'high')
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'high',
        adviced: false
      };

    this.trend.duration++;

    //log.debug('In high since', this.trend.duration, 'candle(s)');

    if (this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if (this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('short');
    } else
      this.advice();

  } else if (stcVal < this.settings.thresholds.low) {

    // new trend detected
    if (this.trend.direction !== 'low')
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'low',
        adviced: false
      };

    this.trend.duration++;

    //log.debug('In low since', this.trend.duration, 'candle(s)');

    if (this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if (this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('long');
    } else
      this.advice();

  } else {

    //log.debug('In no trend');

    this.advice();
  }
}

module.exports = method;