module.exports = {
    eqIf: (arg1, arg2) => {
      return arg1 == arg2 ? true : false;
    },
    elseIf:(arg1,arg2,options)=>{
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    },
    // ifnot:(arg1,options)=>{
    //   return (arg1) ? options.fn(this) : options.inverse(this);
    // },
    ifEq:(arg1,arg2,options)=>{
      return (arg1 == arg2) ? options.inverse(this) : options.fn(this);
    },
    dateTime:(date)=>{
      return date.toLocaleString();
    },
    ifnot:(arg1,options)=>{
      return (arg1) ? options.inverse(this) : options.fn(this);
    },
    getLaststatus:(status)=>{
      let index = status.length - 1
      return status[index].status + '  '+ status[index].date.toLocaleString();
    },
    getStorestatus:(start, end)=>{
      var now = getMinutesNow();
      var start = getMinutes(start);
      var end = getMinutes(end);
      if (start > end) end += getMinutes("24:00");
      if (now > start && now < end) {
        //console.log("now Open");
        return ''
      } else {
        //console.log("Closed");
        return " [CLOSED]"
      }
    }
};

function timechecker() {
  var now = getMinutesNow();
  var start = getMinutes("10:00:12 PM");
  var end = getMinutes("17:35:12 AM");
 // if (start > end) end += getMinutes("24:00");

  if (now > start && now < end) {
    console.log("now Open");
  } else {
    console.log("Closed");
  }
}

function getMinutesNow() {
  var timeNow = new Date();
  return timeNow.getHours() * 60 + timeNow.getMinutes();
}

function getMinutes(str) {
  var time = str.split(":");
  var format = str.split(" ");
  time[0] = parseInt(time[0])
  time[1] = parseInt(time[1])
  format[1] == "PM" ? (time[0] = time[0] + 12) : time[0] = time[0];
  return time[0] * 60 + time[1] * 1;
}
