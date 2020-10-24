const express = require("express");
const { check, validationResult } = require("express-validator");
const UserService = require("./user-service");

const router = express.Router();

router.post(
  "/api/1.0/users",
  check("username").notEmpty().withMessage("Username is required"),
  check("email").notEmpty().withMessage("Email is required"),
  check("password").notEmpty().withMessage("Password is required"),
  async (req, res) => {
    const errorFormatter = ({ msg }) => msg;
    const errors = validationResult(req).formatWith(errorFormatter);

    if (!errors.isEmpty()) {
      return res.status(400).send({ errors: errors.mapped() });
    }

    await UserService.save(req.body);
    return res.send({ message: "User created" });
  }
);

module.exports = router;
