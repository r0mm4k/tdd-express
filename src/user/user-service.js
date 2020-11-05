const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sequelize = require("../config/db");
const User = require("./user");
const EmailService = require("../email/email-service");
const EmailException = require("../email/email-exception");
const InvalidTokenException = require("./user-exception");

const generateActivationToken = (length) => crypto.randomBytes(length).toString("hex").substring(0, length);

const save = async ({ username, email, password }) => {
  const hash = await bcrypt.hash(password, 10);
  const activationToken = generateActivationToken(16);
  const transaction = await sequelize.transaction();
  await User.create({ username, email, password: hash, activationToken }, { transaction });

  try {
    await EmailService.sendAccountActivation(email, activationToken);
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw new EmailException();
  }
};

const findByEmail = async (email) => User.findOne({ where: { email } });

const activate = async (activationToken) => {
  const user = await User.findOne({ where: { activationToken } });

  if (!user) {
    throw new InvalidTokenException();
  }

  user.inactive = false;
  user.activationToken = null;
  await user.save();
};

const getUsers = async () => {
  return {
    content: [],
    page: 0,
    size: 10,
    totalPages: 0,
  };
};

module.exports = { save, findByEmail, activate, getUsers };
