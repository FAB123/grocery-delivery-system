var accountSid = "ACeec4d195a6f44a233ca918cc8725395f";
var authToken = "6b41bcc5b3fdb70356b2f9c886a1ef23";

var twilio = require("twilio");

const client = require("twilio")(accountSid, authToken);

module.exports = {
  send_otp: (otp, mobile) => {
    return new Promise((resolve, reject) => {
      client.messages
        .create({
          body: "For activate your account enter " + otp + " as OTP",
          to: "+966" + mobile,
          from: "+12313665680",
        })
        .then((message) => {
          console.log("test");
          resolve(message);
        });
    });
  },
  send_otp_d7: () => {
    return new Promise((resolve, reject) => {
      var request = require("request");
      var options = {
        method: "POST",
        url:
          "https://http-api.d7networks.com/send?username=bnql9667&password=GWQzJqsk&dlr=no&from=smsinfo&content=This is the sample content sent to test &to=0530829178",
        headers: {},
        formData: {},
      };
      request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log("apicalled "+response.body);
        resolve(response)
      });
    });
  },
};
