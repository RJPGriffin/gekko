const moment = require('moment');
const request = require('request');

let trade = {
  "cost": 0.00001645,
  "amount": 0.01645438
}

console.log(`Percentage: ${getNumStr((trade.cost / trade.amount) * 100,2)}%`);


function capF(inWord) { //Capitalise first letter of string
  return (inWord.charAt(0).toUpperCase() + inWord.slice(1));
}


function getNumStr(num, fixed = 3) {
  let numStr = '';

  if (typeof num != "number") {
    num = Number(num);
    if (isNaN(num)) {
      console.log("Pushbullet Plugin: Number Conversion Failed");
      return "Conversion Failure";
    }
  }


  if (Number.isInteger(num)) {
    numStr = num.toString();
  } else {

    //Create modNum Max - Must be a better way...
    let modNumMax = '1';
    for (let i = 1; i < fixed; i++) {
      modNumMax = modNumMax + '0';
    }
    // console.log(modNumMax);
    modNumMax = Number(modNumMax);

    let i = 0;
    if (num < 1) {
      let modNum = num - Math.floor(num);
      while (modNum < modNumMax && i < 8) {
        modNum *= 10;
        i += 1;
      }
    } else {
      i = fixed;
    }
    numStr = num.toFixed(i);
    //Remove any excess zeros
    while (numStr.charAt(numStr.length - 1) === '0') {
      numStr = numStr.substring(0, numStr.length - 1);
    }

    //If last char remaining is a decimal point, remove it
    if (numStr.charAt(numStr.length - 1) === '.') {
      numStr = numStr.substring(0, numStr.length - 1);
    }

  }

  //Add commas for thousands etc
  let dp = numStr.indexOf('.'); //find deciaml point
  if (dp < 0) { //no dp found
    dp = numStr.length;
  }

  let insPos = dp - 3;
  insCount = 0;
  while (insPos > 0) {
    insCount++;
    numStr = numStr.slice(0, insPos) + ',' + numStr.slice(insPos);
    insPos -= 3;
  }


  return (numStr);
}