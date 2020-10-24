const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("./user");
const EmailService = require("../email/email-service");

const generateActivationToken = (length) => crypto.randomBytes(length).toString("hex").substring(0, length);

const save = async ({ username, email, password }) => {
  const hash = await bcrypt.hash(password, 10);
  const activationToken = generateActivationToken(16);
  await User.create({ username, email, password: hash, activationToken });
  await EmailService.sendAccountActivation(email, activationToken);
};

const findByEmail = async (email) => User.findOne({ where: { email } });

module.exports = { save, findByEmail };
