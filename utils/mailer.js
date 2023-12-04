const nodemailer = require("nodemailer");
const {
  GMAIL,
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN,
  GMAIL_ACCESS_TOKEN,
} = require("../.env");

const mailer = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  auth: {
    type: "OAuth2",
    user: GMAIL,
    clientId: GMAIL_CLIENT_ID,
    clientSecret: GMAIL_CLIENT_SECRET,
    refreshToken: GMAIL_REFRESH_TOKEN,
    accessToken: GMAIL_ACCESS_TOKEN,
  },
});
module.exports = {
  mailer,
};
