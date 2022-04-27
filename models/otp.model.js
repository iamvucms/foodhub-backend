const { response } = require("express");
const { mailer } = require("../utils/mailer");
const db = require("./");
const { User } = require("./user.model");
module.exports.OTP = {
  createOTPForUser: function (user_id, emailOrPhone) {
    return new Promise((resolve, reject) => {
      const otp = Math.floor(Math.random() * 10000);
      //send otp to email
      // mailer.sendMail({
      //   from: process.env.GMAIL,
      //   to: emailOrPhone,
      //   subject: "Sending Email using Node.js",
      //   text: "That was easy!",
      // });
      db.serialize(() => {
        db.run(
          "INSERT INTO otp (user_id, code) VALUES (?, ?)",
          [user_id, otp],
          function (err) {
            if (err) {
              console.log({ err });
              return reject(false);
            }
            resolve(true);
          }
        );
      });
    });
  },
  checkOTP: function (user_id, otp) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.get(
          "SELECT count(*) FROM otp WHERE user_id = ? AND code = ?",
          [user_id, otp],
          function (err, row) {
            if (err) {
              console.log("err", err);
              return reject("OTP is not correct");
            }
            const isExist = row["count(*)"] > 0;
            resolve(isExist);
          }
        );
      });
    });
  },
};
