const nodemailer = require("nodemailer");
const transporter = require("../config/email-transporter");

const sendAccountActivation = async (email, token) => {
  const info = await transporter.sendMail({
    from: "My App <info@my-app.com>",
    to: email,
    subject: "Account Activation",
    html: `
      <div>
        <b>Please, click link to activate your account</b>
      </div>
      <div>
        <a href="http://localhost:3000/login?token=${token}">Activate</a>
      </div>
      `,
  });

  if (process.env.NODE_ENV === "development") {
    console.log(`url: ${nodemailer.getTestMessageUrl(info)}`);
  }
};

module.exports = { sendAccountActivation };
