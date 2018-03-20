// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.name = 'ghelper';


  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('sma', 'SMA', this.settings.weight);
  this.addTulipIndicator('ROC', 'roc', {
    optInTimePeriod: 5
  })
}

// what happens on every new candle?
method.update = function(candle) {
  roc = this.tulipIndicators.ROC.result.result;
  normRoc = (roc / ((candle.close + candle.open + candle.high + candle.low) / 4)) * 1000;


  var sendData = {
    "Asset": this.settings.Asset,
    "Currency": this.settings.Currency,
    "Rating": normRoc
  }

  console.log("Data = " + JSON.stringify(sendData))

  // nothing!
}

// for debugging purposes: log the last calculated
// EMAs and diff.
method.log = function() {
  // let sma = this.indicators.sma;
  // log.debug('\t SMA:', sma.result.toFixed(5));

}

method.check = function(candle) {
  // let sma = this.indicators.sma;
  // let price = candle.close;

}

module.exports = method;