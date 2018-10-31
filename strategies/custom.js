// This is a basic example strategy for Gekko.
// For more information on everything please refer
// to this document:
//
// https://gekko.wizb.it/docs/strategies/creating_a_strategy.html
//
// The example below is pretty bad investment advice: on every new candle there is
// a 10% chance it will recommend to change your position (to either
// long or short).

var log = require('../core/log');

// Let's create our own strat
var strat = {};

// Prepare everything our method needs
strat.init = function() {
  this.toggle = 1;
  this.input = 'candle';
  this.currentTrend = 'long';
  this.requiredHistory = 0;
}

// What happens on every new candle?
strat.update = function(candle) {}

// For debugging purposes.
strat.log = function() {}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function() {

  if (this.toggle === 0) {
    this.notify("Going Short")
    this.advice('short');
    this.toggle = 1;
  } else {
    this.notify("Going Long")
    this.advice('long');
    this.toggle = 0;
  }
}

module.exports = strat;