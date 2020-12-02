const crypto = require("crypto");

function generate(options) {
  const { type, length, upperCase, special, charSet } = { ...options };
  const num = "0123456789";
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const spe = `!"#$%&'()*+,-./:;<=>?@[\\]^_\`{|}~`;

  let str;

  switch (type) {
    case "numeric":
      str = num;
      break;
    case "alphabetic":
      str = chars;
      break;
    case "alphanumeric":
      str = chars + num;
      break;
    default:
    case "hex":
      str = num + "abcdef";
      break;
    case "binary":
      str = "01";
      break;
    case "special":
      str = num + chars + spe;
      break;
  }

  if (upperCase === "with") {
    str = str.replace(/[a-z]+/g, (el) => el + el.toUpperCase());
  }
  if (upperCase === "only") str = str.toUpperCase();
  if (charSet) str = charSet;
  if (special) str += special;

  return random(length, str);
}

function random(length, chars) {
  length = length ? length : 32;
  let str = [];

  crypto.randomBytes(length).forEach( el => {
    const number = Math.round(el * ((chars.length - 1) / 256));
    str.push(chars[number]);
  });

  return str.join("");
}

module.exports = generate;
