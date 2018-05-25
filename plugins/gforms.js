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


  //Track advice, linked to trades
  this.advicePrice = 0;
  this.adviceTime = 0;
  this.question = [];

  var prefill = gfc.prefill;
  prefill = prefill.slice(34, prefill.length);
  var result = prefill.search('/');
  this.formID = prefill.slice(0, result);
  prefill = prefill.slice(result + 20, prefill.length);
  this.formUrl = 'https://docs.google.com/forms/d/e/' + this.formID + '/formResponse?usp=pp_url&'

  let count = 0;

  while (count < 11) {
    var start = prefill.search('entry') + 6;
    var end = prefill.search('=');
    this.question.push(prefill.slice(start, end));
    prefill = prefill.slice(end + 2, prefill.length);
    count++
  }

  //TODO - Add check that above has actually worked.

  this.done = done;
  this.setup();
};

gforms.prototype.setup = function(done) {
  var setupGforms = function(err, result) {
    log.info('gForms Plugin Active. Any new trades will be sent to your google form');

  };
  setupGforms.call(this)

};

gforms.prototype.processAdvice = function(advice) {
  //Get advice price and time
  this.advicePrice = advice.candle.close;
  this.adviceTime = Date.now();
};

gforms.prototype.processTrade = function(trade) {
  let currency = config.watch.currency;
  let asset = config.watch.asset;
  let exchange = config.watch.exchange;
  let tradeTime = Date.now();

  let timeToComplete = (tradeTime - this.adviceTime) * 60000; //Difference in ms, converted to minutes

  //build up data string
  let dataString =
    'entry.' + this.question[0] + '=' + gfc.botTag + '&' +
    'entry.' + this.question[1] + '=' + exchange + '&' +
    'entry.' + this.question[2] + '=' + currency + '&' +
    'entry.' + this.question[3] + '=' + asset + '&' +
    'entry.' + this.question[4] + '=' + trade.action + '&' +
    'entry.' + this.question[5] + '=' + trade.portfolio.asset + '&' +
    'entry.' + this.question[6] + '=' + trade.price + '&' +
    'entry.' + this.question[7] + '=' + trade.portfolio.currency + '&' +
    'entry.' + this.question[8] + '=' + trade.balance + '&' +
    'entry.' + this.question[9] + '=' + this.advicePrice + '&' +
    'entry.' + this.question[10] + '=' + timeToComplete;

  /*
  Index: (-1 for array index
  1: Tag
  2: Exchange
  3: Currency
  4: Asset
  5: Action
  6: Asset in Portfolio
  7: Price
  8: Currency in Portfolio
  9: Balance
  10: Advice Price
  11: Time to Fill
*/

  log.info("Sending Trade Data to your Google Sheet");
  log.info(this.formUrl + dataString);

  request.post(this.formUrl + dataString + '&submit=Submit', function(error, response) {});


};

module.exports = gforms;