/*
 Adapted to run on 1 Minute candles with candle batching
 by Gryphon/RJPGriffin Nov'18

	RSI Bull and Bear + ADX modifier
	1. Use different RSI-strategies depending on a longer trend
	2. But modify this slighly if shorter BULL/BEAR is detected
	-
	(CC-BY-SA 4.0) Tommie Hansen
	https://creativecommons.org/licenses/by-sa/4.0/
	-
	NOTE: Requires custom indicators found here:
	https://github.com/Gab0/Gekko-extra-indicators
	(c) Gabriel Araujo
	Howto: Download + add to gekko/strategies/indicators
*/

// req's
var log = require('../core/log.js');
var config = require('../core/util.js').getConfig();
var RSI = require('./indicators/RSI.js')
var ADX = require('./indicators/ADX.js')
var SMA = require('./indicators/SMA.js')


// strategy
var strat = {

  /* INIT */
  init: function() {
    // core
    this.name = 'RSI Bull and Bear + ADX M1';
    this.requiredHistory = config.tradingAdvisor.historySize;
    this.resetTrend();

    // debug? set to false to disable all logging/messages/stats (improves performance in backtests)
    this.debug = false;

    // performance
    config.backtest.batchSize = 1000; // increase performance
    config.silent = true; // NOTE: You may want to set this to 'false' @ live
    config.debug = false;

    //Add Custom Timeframe indicators
    //SMA
    this.maSlow = new SMA(this.settings.SMA_long);
    this.maFast = new SMA(this.settings.SMA_short)

    // RSI
    this.BULL_RSI = [];
    for (let i = 0; i < this.settings.BULL_RSI_Timeframe; i++) {
      this.BULL_RSI[i] = new RSI({
        interval: this.settings.BULL_RSI
      });
    }

    this.BEAR_RSI = [];
    for (let i = 0; i < this.settings.BEAR_RSI_Timeframe; i++) {
      this.BEAR_RSI[i] = new RSI({
        interval: this.settings.BEAR_RSI
      });
    }

    // ADX
    this.ADX = new ADX(this.settings.ADX);

    this.timeframes = {
      SMA: this.settings.SMA_Timeframe,
      SMA_Count: 0,
      BULL_RSI: this.settings.BULL_RSI_Timeframe,
      BULL_RSI_Count: 0,
      BEAR_RSI: this.settings.BEAR_RSI_Timeframe,
      BEAR_RSI_Count: 0,
      ADX: this.settings.ADX_Timeframe,
      ADX_Count: 0
    };

    // ADX
    this.addIndicator('ADX', 'ADX', this.settings.ADX);

    // MOD (RSI modifiers)
    this.BULL_MOD_high = this.settings.BULL_MOD_high;
    this.BULL_MOD_low = this.settings.BULL_MOD_low;
    this.BEAR_MOD_high = this.settings.BEAR_MOD_high;
    this.BEAR_MOD_low = this.settings.BEAR_MOD_low;


    // debug stuff
    this.startTime = new Date();

    // add min/max if debug
    if (this.debug) {
      this.stat = {
        adx: {
          min: 1000,
          max: 0
        },
        bear: {
          min: 1000,
          max: 0
        },
        bull: {
          min: 1000,
          max: 0
        }
      };
    }

    /* MESSAGES */

    // message the user about required history
    log.info("====================================");
    log.info('Running', this.name);
    log.info('====================================');
    log.info("Make sure your warmup period matches SMA_long and that Gekko downloads data if needed");

    // warn users
    if (this.requiredHistory < this.settings.SMA_long) {
      log.warn("*** WARNING *** Your Warmup period is lower then SMA_long. If Gekko does not download data automatically when running LIVE the strategy will default to BEAR-mode until it has enough data.");
    }

  }, // init()


  /* RESET TREND */
  resetTrend: function() {
    var trend = {
      duration: 0,
      direction: 'none',
      longPos: false,
    };

    this.trend = trend;
  },


  /* get low/high for backtest-period */
  lowHigh: function(val, type) {
    let cur;
    if (type == 'bear') {
      cur = this.stat.bear;
      if (val < cur.min) this.stat.bear.min = val; // set new
      else if (val > cur.max) this.stat.bear.max = val;
    } else if (type == 'bull') {
      cur = this.stat.bull;
      if (val < cur.min) this.stat.bull.min = val; // set new
      else if (val > cur.max) this.stat.bull.max = val;
    } else {
      cur = this.stat.adx;
      if (val < cur.min) this.stat.adx.min = val; // set new
      else if (val > cur.max) this.stat.adx.max = val;
    }
  },

  //Update all of the non gekko managed indicators here
  update: function(candle) {
    tf = this.timeframes;
    if (tf.SMA_Count >= tf.SMA) {
      this.maSlow.update(candle.close);
      this.maFast.update(candle.close);
      tf.SMA_Count = 0;
    } else {
      tf.SMA_Count++;
    }

    tf.BULL_RSI_Count = (tf.BULL_RSI_Count + 1) % (tf.BULL_RSI - 1);
    this.BULL_RSI[tf.BULL_RSI_Count].update(candle);


    tf.BEAR_RSI_Count = (tf.BEAR_RSI_Count + 1) % (tf.BEAR_RSI - 1);
    this.BEAR_RSI[tf.BEAR_RSI_Count].update(candle);

    if (tf.ADX_Count >= tf.ADX) {
      this.ADX.update(candle);
      tf.ADX_Count = 0;
    } else {
      tf.ADX_Count++;
    }
  },


  /* CHECK */
  check: function(candle) {
    // get all indicators

    var maSlow = this.maSlow.result,
      maFast = this.maFast.result,
      rsi,
      adx = this.ADX.result;

    // BEAR TREND
    // NOTE: maFast will always be under maSlow if maSlow can't be calculated
    if (maFast < maSlow) {
      rsi = this.BEAR_RSI[this.timeframes.BEAR_RSI_Count].result;
      let rsi_hi = this.settings.BEAR_RSI_high,
        rsi_low = this.settings.BEAR_RSI_low;

      // ADX trend strength?
      if (adx > this.settings.ADX_high) rsi_hi = rsi_hi + this.BEAR_MOD_high;
      else if (adx < this.settings.ADX_low) rsi_low = rsi_low + this.BEAR_MOD_low;

      if (rsi > rsi_hi) this.short();
      else if (rsi < rsi_low) this.long();

      if (this.debug) this.lowHigh(rsi, 'bear');
    }

    // BULL TREND
    else {
      rsi = this.BULL_RSI[this.timeframes.BULL_RSI_Count].result;
      let rsi_hi = this.settings.BULL_RSI_high,
        rsi_low = this.settings.BULL_RSI_low;

      // ADX trend strength?
      if (adx > this.settings.ADX_high) rsi_hi = rsi_hi + this.BULL_MOD_high;
      else if (adx < this.settings.ADX_low) rsi_low = rsi_low + this.BULL_MOD_low;

      if (rsi > rsi_hi) this.short();
      else if (rsi < rsi_low) this.long();
      if (this.debug) this.lowHigh(rsi, 'bull');
    }

    // add adx low/high if debug
    if (this.debug) this.lowHigh(adx, 'adx');

  }, // check()


  /* LONG */
  long: function() {
    if (this.trend.direction !== 'up') // new trend? (only act on new trends)
    {
      this.resetTrend();
      this.trend.direction = 'up';
      this.advice('long');
      if (this.debug) log.info('Going long');
    }

    if (this.debug) {
      this.trend.duration++;
      log.info('Long since', this.trend.duration, 'candle(s)');
    }
  },


  /* SHORT */
  short: function() {
    // new trend? (else do things)
    if (this.trend.direction !== 'down') {
      this.resetTrend();
      this.trend.direction = 'down';
      this.advice('short');
      if (this.debug) log.info('Going short');
    }

    if (this.debug) {
      this.trend.duration++;
      log.info('Short since', this.trend.duration, 'candle(s)');
    }
  },


  /* END backtest */
  end: function() {
    let seconds = ((new Date() - this.startTime) / 1000),
      minutes = seconds / 60,
      str;

    minutes < 1 ? str = seconds.toFixed(2) + ' seconds' : str = minutes.toFixed(2) + ' minutes';

    log.info('====================================');
    log.info('Finished in ' + str);
    log.info('====================================');

    // print stats and messages if debug
    if (this.debug) {
      let stat = this.stat;
      log.info('BEAR RSI low/high: ' + stat.bear.min + ' / ' + stat.bear.max);
      log.info('BULL RSI low/high: ' + stat.bull.min + ' / ' + stat.bull.max);
      log.info('ADX min/max: ' + stat.adx.min + ' / ' + stat.adx.max);
    }

  }

};

module.exports = strat;