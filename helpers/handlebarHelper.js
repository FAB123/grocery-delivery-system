module.exports = {
  eqIf: (arg1, arg2) => {
    return arg1 == arg2 ? true : false;
  },
  elseIf: (arg1, arg2, options) => {
    return arg1 == arg2 ? options.fn(this) : options.inverse(this);
  },
  // ifnot:(arg1,options)=>{
  //   return (arg1) ? options.fn(this) : options.inverse(this);
  // },
  ifEq: (arg1, arg2, options) => {
    return arg1 == arg2 ? options.inverse(this) : options.fn(this);
  },
  dateTime: (date) => {
    return date.toLocaleString();
  },
  ifnot: (arg1, options) => {
    return arg1 ? options.inverse(this) : options.fn(this);
  },
  getLaststatus: (status) => {
    let index = status.length - 1;
    return status[index].status + "  " + status[index].date.toLocaleString();
  },
  getStorestatus1: (start, end) => {
    var now = getMinutesNow();
    var start = getMinutes(start);
    var end = getMinutes(end);

    if (start > end) end += getMinutes("24:00");
    //  console.log("start"+start+"end"+end+"now"+now)

    if (now >= start && now < end) {
      console.log("now Open");
      return "";
    } else {
      console.log("Closed" + now + ">=" + start + "&&" + now + "<" + end);
      return " [CLOSED]";
    }
  },
  calcProgress:(value)=>{
    return value*20;
  },
  getStorestatus: (start, end) => {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1;
    var yyyy = today.getFullYear();
  
    dd = dd < 10 ? "0" + dd : dd;
    mm = mm < 10 ? "0" + mm : mm;
    tempDate = yyyy + "/" + mm + "/" + dd;
  
    calcStartdate = getHour(start);
    calcEnddate = getHour(end);
    console.log(new Date())
  
    let startDate = generateTimestamp(tempDate, start);
    let now = Date.now() / 1000;
    var endDate = generateTimestamp(tempDate, end);

    if (calcStartdate > calcEnddate) {

      console.log(startDate)
      console.log(now)
      console.log(endDate)
    }

    if (now >= startDate && now < endDate) {
      return "";
    } else {
      return " [CLOSED]";
    }
  },
};

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}  

function getHour(gtime) {
  var time = gtime.split(":");
  var format = gtime.split(" ");
  time[0] = parseInt(time[0]);
  format[1] == "PM" ? (time[0] = time[0] + 12) : (time[0] = time[0]);
  return time[0];
}

function generateTimestamp(tempDate, gtime) {
  var time = gtime.split(":");
  var format = gtime.split(" ");
  time[0] = parseInt(time[0]);
  time[1] = parseInt(time[1]);
  format[1] == "PM" ? (time[0] = time[0] + 12) : (time[0] = time[0]);
  
  time[0] = time[0] < 10 ? "0" + time[0] : time[0];
  time[1] = time[1] < 10 ? "0" + time[1] : time[1];
  let strap = Math.round(new Date(tempDate + ' ' + time[0] + ':' + time[1] + ':00').getTime() / 1000)
  return strap;
}
