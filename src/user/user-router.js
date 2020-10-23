const express = require("express");
const UserService = require("./user-service");

const router = express.Router();

router.post("/api/1.0/users", async (req, res) => {
  const { username } = req.body;

  if (username) {
    await UserService.save(req.body);
    return res.send({ message: "User created" });
  } else {
    return res.status(400).send({
      errors: {
        username: "Username is required",
      },
    });
  }
});

module.exports = router;
