const transporter = require("../config/email-transporter");

const sendAccountActivation = async (email, token) =>
  transporter.sendMail({
    from: "My App <info@my-app.com>",
    to: email,
    subject: "Account Activation",
    html: `Token is ${token}`,
  });

module.exports = { sendAccountActivation };
