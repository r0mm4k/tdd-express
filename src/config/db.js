const Sequelize = require("sequelize");

const sequelize = new Sequelize("tdd-express", "r0mm4k", "12345", {
  dialect: "sqlite",
  storage: "./db.sqlite",
  logging: false,
});

module.exports = sequelize;
