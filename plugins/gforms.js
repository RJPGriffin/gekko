/**
 * Created by Gryphon on 22/3/18.
 */

var _ = require('lodash');
const request = require('request');
var log = require('../core/log.js');
var util = require('../core/util.js');
var config = util.getConfig();
var gfc = config.gforms;


var gforms = function(done) {
  _.bindAll(this);

  this.pusher;
  this.price = 'N/A';
  this.formID = gfc.formID; 
  this.formUrl = 'https://docs.google.com/forms/d/e/' + this.formID '+/viewform?usp=pp_url&'

  this.done = done;
  this.setup();
};

gforms.prototype.setup = function(done) {
  //noting to do here I think...

};

gforms.prototype.processCandle = function(candle, done) {
  this.price = candle.close;

  done();
};

gforms.prototype.processAdvice = function(advice) {
  //Sending on advice doesn't give the actual trade outcomes
};




gforms.prototype.processTrade = function(trade) {
  let currency = config.watch.currency;
  let asset = config.watch.asset;
  let exchange = config.watch.exchange;

  //build up string
  let dataString =
    'entry.' + gfc.exchange + '=' + exchange + '&' +
    'entry.' + gfc.currency + '=' + currency + '&' +
    'entry.' + gfc.asset + '=' + asset + '&' +
    'entry.' + gfc.event + '=trade' + '&' +
    'entry.' + gfc.action + '=' + trade.action + '&' +
    'entry.' + gfc.price + '=' + trade.price + '&' +
    'entry.' + gfc.date + '=' + trade.date + '&' +
    'entry.' + gfc.portfolio + '=' + trade.portfolio + '&' +
    'entry.' + gfc.balance + '=' + trade.balance;

  request.post(this.formUrl + datastring, function(error, response) {
    console.log('error:', error); // Print the error if one occurred
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    console.log('body:', body); // Print the HTML for the Google homepage.
  });


};

module.exports = gforms;
