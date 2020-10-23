const express = require("express");
const UserService = require("./user-service");

const router = express.Router();

const validateUsername = (req, res, next) => {
  const { username } = req.body;
  if (!username) {
    req.errors = {
      username: "Username is required",
    };
  }
  next();
};

const validateEmail = (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    req.errors = {
      ...req.errors,
      email: "Email is required",
    };
  }
  next();
};

router.post("/api/1.0/users", validateUsername, validateEmail, async (req, res) => {
  if (req.errors) {
    return res.status(400).send({ errors: req.errors });
  }

  await UserService.save(req.body);
  return res.send({ message: "User created" });
});

module.exports = router;
