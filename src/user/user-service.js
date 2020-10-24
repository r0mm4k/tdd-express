const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("./user");

const generateActivationToken = (length) => crypto.randomBytes(length).toString("hex").substring(0, length);

const save = async ({ username, email, password }) => {
  const hash = await bcrypt.hash(password, 10);
  await User.create({ username, email, password: hash, activationToken: generateActivationToken(16) });
};

const findByEmail = async (email) => User.findOne({ where: { email } });

module.exports = { save, findByEmail };
