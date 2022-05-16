const { mailer } = require("../utils/mailer");
const { Database } = require("../utils/query");
module.exports.OTP = {
  createOTPForUser: async function (user_id, emailOrPhone) {
    try {
      const otp = Math.floor(Math.random() * 10000);
      //send otp to email
      // mailer.sendMail({
      //   from: process.env.GMAIL,
      //   to: emailOrPhone,
      //   subject: "Sending Email using Node.js",
      //   text: "That was easy!",
      // });
      await Database.run("INSERT INTO otp (user_id, code) VALUES (?, ?)", [
        user_id,
        otp,
      ]);
      return true;
    } catch (e) {
      console.log(e);
      throw new Error("Something went wrong");
    }
  },
  checkOTP: async function (user_id, otp) {
    try {
      const isExist = await Database.get(
        "SELECT count(*) FROM otp WHERE user_id = ? AND code = ?",
        [user_id, otp]
      );
      return isExist["count(*)"] > 0;
    } catch (e) {
      console.log(e);
      throw new Error("Something went wrong");
    }
  },
};
