var SMMA = require('./SMMA.js');
var convnetjs = require('convnetjs');
var math = require('mathjs');
var log = require('../../core/log.js');

var Indicator = function(settings) {
  this.input = 'candle'
  this.priceBuffer = [];
  this.price_buffer_len = settings.price_buffer_len;
  this.scale = 1;
  this.prediction = 0;

  this.SMMA = new SMMA(settings.NN_SMMA_Length);

    let layers = [
      {type:'input', out_sx:1, out_sy:1, out_depth: 1},
      {type: settings.type_layer_1, num_neurons: settings.numb_nerurons_layer_1, activation: settings.activation_layer_1 },
      {type: settings.type_layer_2, num_neurons: settings.numb_nerurons_layer_2, activation: settings.activation_layer_2 },
      {type: settings.type_layer_3, num_neurons: settings.numb_nerurons_layer_3, activation: settings.activation_layer_3 },
      {type:'regression', num_neurons: 1}
    ];

    this.nn = new convnetjs.Net();

    this.nn.makeLayers( layers );

    this.trainer = new convnetjs.Trainer(this.nn, {
      method: settings.method,
      learning_rate: settings.learning_rate,
      momentum: settings.momentum,
      batch_size: settings.batch_size,
      l1_decay: settings.l1_decay,
      l2_decay: settings.l2_decay
    });
}

Indicator.prototype.setNormalizeFactor = function(candle) {
  this.scale = Math.pow(10,Math.trunc(candle.high).toString().length+2);
  log.debug('Set normalization factor to',this.scale);
}

Indicator.prototype.learn = function () {
  for (let i = 0; i < this.priceBuffer.length - 1; i++) {
    let data = [this.priceBuffer[i]];
    let current_price = [this.priceBuffer[i + 1]];
    let vol = new convnetjs.Vol(data);
    this.trainer.train(vol, current_price);
    let predicted_values = this.nn.forward(vol);
    // Debug Training Session
    console.log("," + data + "," + current_price + "," + predicted_values.w[0]);
    //console.log("prediction in learn stage is: " + predicted_values.w[0]);
    //let percent_diff = (predicted_values.w[0] / current_price - 1) * 100;
    //console.log("Diff %: " + percent_diff);
  }
}

Indicator.prototype.predictCandle = function() {
  let vol = new convnetjs.Vol(this.priceBuffer);
  let prediction = this.nn.forward(vol);
  return prediction.w[0];
}

Indicator.prototype.update = function(candle) {
  this.SMMA.update( (candle.high + candle.close + candle.low + candle.vwp) /4);
  let smmaFast = this.SMMA.result;

  if (1 === this.scale && 1 < candle.high && 0 === this.predictionCount) this.setNormalizeFactor(candle);

  this.priceBuffer.push(smmaFast / this.scale );
  if (2 > this.priceBuffer.length) return;

  this.learn();

  while (this.price_buffer_len < this.priceBuffer.length) this.priceBuffer.shift();

  this.prediction = this.predictCandle() * this.scale;

}

module.exports = Indicator;
