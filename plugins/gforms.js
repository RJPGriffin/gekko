/**
 * Created by Gryphon on 22/3/18.
 */

var _ = require('lodash');
const request = require('request');
var log = require('../core/log.js');
var util = require('../core/util.js');
var config = util.getConfig();
var gfc = config.Gforms;


var Gforms = function(done) {
  _.bindAll(this);

  this.pusher;
  this.price = 'N/A';
  this.formID = gfc.formID; //'1FAIpQLSd25HieT98AETLLirpibgCOLQF4ArO1p1GdCHmuYbvXRvtmMA' TODO delete this comment!
  this.formUrl = 'https://docs.google.com/forms/d/e/' + this.formID '+/viewform?usp=pp_url&'

  this.done = done;
  this.setup();
};

Gforms.prototype.setup = function(done) {
  //noting to do here I think...

};

Gforms.prototype.processCandle = function(candle, done) {
  this.price = candle.close;

  done();
};

Gforms.prototype.processAdvice = function(advice) {
  //Sending on advice doesn't give the actual trade outcomes
};


//https://docs.google.com/forms/d/e/1FAIpQLSd25HieT98AETLLirpibgCOLQF4ArO1p1GdCHmuYbvXRvtmMA/viewform?usp=pp_url&entry.1346916648=exc&entry.1743858251=cur&entry.105864059=ast&entry.68010386=eve&entry.3616735=act&entry.1463011579=pri&entry.1529244935=dat&entry.433943481=port&entry.620326103=bal

Gforms.prototype.processTrade = function(trade) {
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

module.exports = Gforms;
