const moment = require('moment');

let a = moment([2000, 1, 5]).add(3, 'hours');
let b = moment([2000, 1, 5]).add(3, 'hours').add(10, 'minutes').add(30, 'seconds');
let days = moment.duration(b.diff(a));
// console.log(days.humanize());
// console.log(`\nExposure Time: ${days.humanize()}`);
// let num = '8547086.462';
let num = '0.0001234';



let oBal = 150;
let nBal = 200;
let percDiff = (Math.abs(nBal - oBal) / oBal) * 100;

console.log(getNumStr(num, 5));

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
    console.log(modNumMax);
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