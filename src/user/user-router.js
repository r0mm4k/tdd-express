const express = require("express");
const { check, validationResult } = require("express-validator");
const UserService = require("./user-service");

const router = express.Router();

router.post(
  "/api/1.0/users",
  check("username")
    .notEmpty()
    .withMessage("Username is required")
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage("Must have 4 and max 32 characters"),
  check("email").notEmpty().withMessage("Email is required").bail().isEmail().withMessage("Email is not valid"),
  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage("Password must have at least 1 uppercase, 1 lowercase letter and 1 number"),
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
