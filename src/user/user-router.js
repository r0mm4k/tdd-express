const express = require("express");
const { check, validationResult } = require("express-validator");
const UserService = require("./user-service");
const ValidationException = require("../error/validation-exception");

const router = express.Router();

router.post(
  "/api/1.0/users",
  check("username")
    .notEmpty()
    .withMessage("usernameRequired")
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage("usernameSize"),
  check("email")
    .notEmpty()
    .withMessage("emailRequired")
    .bail()
    .isEmail()
    .withMessage("emailInvalid")
    .bail()
    .custom(async (email) => {
      const user = await UserService.findByEmail(email);
      if (user) {
        throw new Error("emailInUse");
      }
    }),
  check("password")
    .notEmpty()
    .withMessage("passwordRequired")
    .bail()
    .isLength({ min: 6 })
    .withMessage("passwordSize")
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage("passwordPattern"),
  async (req, res, next) => {
    const errorFormatter = ({ msg }) => req.t(msg);
    const errors = validationResult(req).formatWith(errorFormatter);

    if (!errors.isEmpty()) {
      // return res.status(400).send({ errors: errors.mapped() });
      return next(new ValidationException(errors.mapped()));
    }

    try {
      await UserService.save(req.body);
      return res.send({ message: req.t("userCreated") });
    } catch (err) {
      next(err);
      // return res.status(502).send({ message: req.t(err.message) });
    }
  }
);

router.post("/api/1.0/users/token/:token", async (req, res, next) => {
  const token = req.params.token;

  try {
    await UserService.activate(token);
    return res.send({ message: req.t("accountActivationSuccess") });
  } catch (err) {
    next(err);
    // return res.status(400).send({ message: req.t(err.message) });
  }
});

module.exports = router;
