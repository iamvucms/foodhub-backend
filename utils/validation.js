const isEmail = (email) => {
  if (typeof email !== "string") {
    return false;
  }
  const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/;
  return regex.test(email);
};
const isVietnamesePhoneNumber = (phoneNumber) => {
  if (typeof phoneNumber !== "string") {
    return false;
  }
  const regex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;
  return regex.test(phoneNumber);
};
module.exports = {
  isEmail,
  isVietnamesePhoneNumber,
};
