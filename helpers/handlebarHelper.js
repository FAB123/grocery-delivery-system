module.exports = {
    eqIf: (arg1, arg2) => {
      return arg1 == arg2 ? true : false;
    },
    elseIf:(arg1,arg2,options)=>{
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    },
    ifnot:(arg1,options)=>{
      return (arg1) ? options.inverse(this) : options.fn(this);
    }
};
