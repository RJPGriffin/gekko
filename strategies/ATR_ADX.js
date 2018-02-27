/*
	ATR ADX Adaptive Strategy for gekko
  Built to immitate this script:https://www.tradingview.com/script/H48yeyRa-Adaptive-ATR-ADX-Trend-V2/
	-
	(CC-BY-SA 4.0) Rowan Griffin
	https://creativecommons.org/licenses/by-sa/4.0/
*/

// req's
var log = require('../core/log.js');
var config = require('../core/util.js').getConfig();

// strategy
var strat = {

  /* INIT */
  init: function() {
    // core
    this.name = 'Adaptive ATR ADX';
    this.requiredHistory = config.tradingAdvisor.historySize;

    // debug? set to false to disable all logging/messages/stats (improves performance in backtests)
    this.debug = false;

    // performance
    config.backtest.batchSize = 1000; // increase performance
    config.silent = true;
    config.debug = true;

    // ATR
    this.addTulipIndicator('ATR', 'atr', {
      optInTimePeriod: this.settings.ATR
    });

    // ADX
    this.addTulipIndicator('ADX', 'adx', {
      optInTimePeriod: this.settings.ADX
    })

    //Directional Indicator - Needed to decide initial long or short position on strat start
    this.addTulipIndicator('DI', 'di', {
      optInTimePeriod: this.settings.ADX //matches the ADX period
    })

    //High and low
    this.highs[this.settings.ATR];
    this.lows[this.settings.ATR];
    this.arrayCounter = 0; // to track array position
    this.periodMax = 0;
    this.periodMin = 0;

    //Variables
    this.trend = 'none';
    this.stop;



    //ATR Level Modifiers
    this.ATR_threshold = this.settings.ATR_threshold;
    this.ATR_Multiplier_high = this.settings.ATR_Multiplier_high;
    this.ATR_Multiplier_low = this.settings.ATR_Multiplier_low;


    // debug stuff
    this.startTime = new Date();


    /* MESSAGES */

    // message the user about required history
    log.info("====================================");
    log.info('Running', this.name);
    log.info('====================================');
    log.info("Make sure your warmup period matches the longer of ATR or ADX and that Gekko downloads data if needed");

    // warn users
    if (this.requiredHistory < this.settings.ATR || this.requiredHistory < this.settings.ATR) {
      log.warn("*** WARNING *** Your Warmup period is lower than ATR|ADX. If Gekko does not download data automatically when running LIVE the strategy will not behave as expected");
    }

  }, // init()


  /* CHECK */
  check: function(candle) {
    // get all indicators
    let ind = this.tulipIndicators,
      atr = ind.ATR.result.result,
      adx = ind.ADX.result.result,
      di = ind.DI.result,
      price = candle.close;
    updateMinMax(candle);




    //Check for long
    if (this.trend === 'bull') {
      //Calculate new stop target
      if (adx > this.ATR_threshold) {
        this.stop = this.periodMax - (adx * this.ATR_Multiplier_high);
      } else {
        this.stop = this.periodMax - (adx * this.ATR_Multiplier_low);
      }
      //check if price has hit target
      if (candle.close <= this.stop) {
        short();
      }


    } else if (this.trend === 'bear') {
      //Calculate new stop target
      if (adx > this.ATR_threshold) {
        this.stop = this.periodMin + (adx * this.ATR_Multiplier_high);
      } else {
        this.stop = this.periodMin + (adx * this.ATR_Multiplier_low);
      }
      //check if price has hit target
      if (candle.close >= this.stop) {
        short();
      }
    }
    //check if first run - make long or short decision
    else if (this.trend === 'none') {
      if (di.plus_di > di.minus_di) { //BULL
        this.long();
      } else {
        this.short();
      }
    }






  }, // check()


  updateMinMax: function(candle) {
    this.lows[this.arrayCounter] = candle.min;
    this.highs[this.arrayCounter] = candle.max;
    this.arrayCounter = this.arrayCounter + 1;

    if (this.arrayCounter === this.settings.ATR) { //reset counter
      this.arrayCounter = 0;
    }

    this.periodMax = Math.max.apply(Math, this.highs);
    this.periodMin = Math.min.apply(Math, this.lows);

  },

  /* LONG */
  long: function() {
    if (this.trend !== 'bull') // new trend? (only act on new trends)
    {
      this.trend = 'bull';
      this.advice('long');
      if (this.debug) log.info('Going long');
    }
  },


  /* SHORT */
  short: function() {
    // new trend? (else do things)
    if (this.trend !== 'bear') {
      this.trend = 'bear';
      this.advice('short');
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