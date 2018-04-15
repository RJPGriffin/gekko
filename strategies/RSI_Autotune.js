/*

  RSI - cykedev 14/02/2014

  (updated a couple of times since, check git history)

 */
// helpers
var _ = require('lodash');
var log = require('../core/log.js');
var fs = require('fs');

var EMA = require('./indicators/EMA.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.name = 'RSI';
  this.startTime = new Date();
  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

  this.rsiHistory = [];
  this.rsiLows = []
  this.rsiHighs = [];

  this.marketType = 'none'

  this.lowThreshold = 0;
  this.highThreshold = 100;

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('rsi', 'RSI', {
    interval: this.settings.interval
  });
  this.addIndicator('maFast', 'SMA', this.settings.SMA_short);
  this.addIndicator('maSlow', 'SMA', this.settings.SMA_long);

  //Indicators we are updating ourselves
  this.highEma = new EMA(this.settings.Threshold_Ema);
  this.lowEma = new EMA(this.settings.Threshold_Ema);

}

// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
  var digits = 8;
  var rsi = this.indicators.rsi;

  // log.debug('calculated RSI properties for candle:');
  // log.debug('\t', 'rsi:', rsi.result.toFixed(digits));
  // log.debug('\t', 'price:', candle.close.toFixed(digits));
}

method.check = function(candle) {
  let ind = this.indicators;
  var rsi = ind.rsi.result,
    maSlow = ind.maSlow.result,
    maFast = ind.maFast.result;


  if (maFast > maSlow) {
    this.marketType = 'bull';
  } else {
    this.marketType = 'bear';
  }

  this.rsiHistory.push(rsi);

  if (this.rsiHistory.length < this.settings.historyLength - 1) return false;

  while (this.rsiHistory.length > this.settings.historyLength) {
    this.rsiHistory.shift();
  }

  let rsiPeaks = [];
  let rsiTroughs = [];

  let h = this.rsiHistory;

  //remove any values that are equal to the previous value - messes up below calculated

  for (let i = 0; i < h.length; i++) {
    if (h[i] = h[i + 1]) {
      h.splice(i, 1);
    }
  }


  for (let i = 1; i < h.length; i++) { //start 1 into the araray
    if (h[i - 1] < h[i] && h[i + 1] < h[i]) {
      rsiPeaks.push(h[i]);
    } else if (h[i - 1] > h[i] && h[i + 1] > h[i]) {
      rsiTroughs.push(h[i]);
    }
  }

  //now to find the max values in peaks and troughs
  rsiPeaks.sort(function(a, b) {
    return b - a
  });
  rsiTroughs.sort(function(a, b) {
    return a - b
  });

  // log.debug('Peaks: ' + rsiPeaks[0] + ', ' + rsiPeaks[1]);
  // log.debug('Troughs: ' + rsiTroughs[0] + ', ' + rsiTroughs[1]);

  //For now we will just take the 3rd peak/trough as a value. Need to immprive the selection
  // maybe mean + a stdDev
  let highUpdate, lowUpdate;

  let mM = this.settings.marketModifier;

  let modifier = this.market === 'bull' ? mM : -mM;

  if (typeof rsiPeaks[2] != 'undefined') {
    this.highEma.update(((rsiPeaks[0] + rsiPeaks[1]) / 2) + modifier);
  }
  if (typeof rsiTroughs[2] != 'undefined') {
    this.lowEma.update((rsiTroughs[0] + rsiTroughs[1]) / 2 + modifier);
  }



  this.highThreshold = this.highEma.result;
  this.lowThreshold = this.lowEma.result;



  fs.appendFile('ResultsLog/Autotune Test ' + this.startTime + '.csv', candle.high + "," + rsi + "," + this.lowThreshold + "," + this.highThreshold + "\n", function(err) {
    if (err) {
      return console.log(err);
    }
  });


  if (rsi > this.highThreshold) {

    // new trend detected
    if (this.trend.direction !== 'high')
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'high',
        adviced: false
      };

    this.trend.duration++;

    // // log.debug('In high since', this.trend.duration, 'candle(s)');

    if (this.trend.duration >= this.settings.persistence)
      this.trend.persisted = true;

    if (this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('short');
    } else
      this.advice();

  } else if (rsi < this.lowThreshold) {

    // new trend detected
    if (this.trend.direction !== 'low')
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'low',
        adviced: false
      };

    this.trend.duration++;

    // log.debug('In low since', this.trend.duration, 'candle(s)');

    if (this.trend.duration >= this.settings.persistence)
      this.trend.persisted = true;

    if (this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('long');
    } else
      this.advice();

  } else {

    // // log.debug('In no trend');

    this.advice();
  }
}

module.exports = method;