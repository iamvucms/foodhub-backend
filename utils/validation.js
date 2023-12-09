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
const isPassword = (password) => {
  if (typeof password !== "string") {
    return false;
  }
  const regex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(.{8,})$/;
  return regex.test(password);
};
const isValidMediaUrl = (url, isVideo = false) => {
  if (typeof url !== "string") {
    return false;
  }
  const regex = isVideo
    ? /(http|https):\/\/foodhub123\.me\/uploads\/.*\.(mp4|mov)/g
    : /(http|https):\/\/foodhub123\.me\/uploads\/.*\.(jpeg|png|jpg)/g;
  return regex.test(url);
};
const isValidName = (name) => {
  if (typeof name !== "string") {
    return false;
  }
  const regex = /^[a-zA-Z ]{5,}$/;
  return regex.test(name.trim());
};
const isValidVerified = (verified) => {
  if (typeof verified !== "boolean") {
    return false;
  }
  return true;
};
module.exports = {
  isEmail,
  isVietnamesePhoneNumber,
  isPassword,
  isValidMediaUrl,
  isValidName,
  isValidVerified,
};
