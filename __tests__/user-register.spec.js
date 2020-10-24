const request = require("supertest");
const { SMTPServer } = require("smtp-server");
const app = require("../src/app");
const User = require("../src/user/user");
const sequelize = require("../src/config/db");

let lastMail, server;
let simulateSmtpFailure = false;

beforeAll(async () => {
  server = new SMTPServer({
    authOptional: true,
    onData: (stream, session, callback) => {
      let mailBody;
      stream.on("data", (data) => {
        mailBody += data.toString();
      });
      stream.on("end", () => {
        if (simulateSmtpFailure) {
          const err = new Error("Invalid mailbox");
          err.responceCode = 553;
          return callback(err);
        }
        lastMail = mailBody;
        callback();
      });
    },
  });

  await server.listen(8587, "localhost");

  await sequelize.sync();
});

beforeEach(() => {
  simulateSmtpFailure = false;
  return User.destroy({ truncate: true });
});

afterAll(async () => {
  await server.close();
});

const validUser = {
  username: "admin",
  email: "admin@mail.com",
  password: "admin12345ADMIN",
};

const postUser = ({ user = validUser, lng = "en" } = {}) =>
  request(app).post("/api/1.0/users").set("Accept-Language", lng).send(user);

describe("User Registration", () => {
  const userCreated = "User created";
  const usernameRequired = "Username is required";
  const usernameSize = "Must have 4 and max 32 characters";
  const emailRequired = "Email is required";
  const emailInvalid = "Email is not valid";
  const emailInUse = "Email in use";
  const emailFailure = "Email failure";
  const passwordRequired = "Password is required";
  const passwordSize = "Password must be at least 6 characters";
  const passwordPattern = "Password must have at least 1 uppercase, 1 lowercase letter and 1 number";

  it("returns 200 OK when signup request is valid", async () => {
    const { status } = await postUser();
    expect(status).toBe(200);
  });

  it("returns success message when signup request is valid", async () => {
    const {
      body: { message },
    } = await postUser();
    expect(message).toBe(userCreated);
  });

  it("saves the user to database", async () => {
    await postUser();
    const userList = await User.findAll();
    expect(userList.length).toBe(1);
  });

  it("saves the name and email to database", async () => {
    await postUser();
    const userList = await User.findAll();
    const { username, email } = userList[0];
    expect(username).toBe(validUser.username);
    expect(email).toBe(validUser.email);
  });

  it("hashes the password in database", async () => {
    await postUser();
    const userList = await User.findAll();
    const { password } = userList[0];
    expect(password).not.toBe(validUser.password);
  });

  it("returns 400 when username is null", async () => {
    const { status } = await postUser({ user: { ...validUser, username: null } });
    expect(status).toBe(400);
  });

  it("returns errors field in response body when validation error occurs", async () => {
    const {
      body: { errors },
    } = await postUser({ user: { ...validUser, username: null } });
    expect(errors).not.toBeUndefined();
  });

  it("returns errors for both when username and email is null/undefined", async () => {
    const {
      body: { errors },
    } = await postUser({ user: { ...validUser, username: null, email: null } });
    expect(Object.keys(errors)).toEqual(["username", "email"]);
  });

  it.each`
    field         | value               | expectedMessage
    ${"username"} | ${null}             | ${usernameRequired}
    ${"username"} | ${"adm"}            | ${usernameSize}
    ${"username"} | ${"a".repeat(33)}   | ${usernameSize}
    ${"email"}    | ${null}             | ${emailRequired}
    ${"email"}    | ${"mail.com"}       | ${emailInvalid}
    ${"email"}    | ${"admin.mail.com"} | ${emailInvalid}
    ${"email"}    | ${"admin@mail"}     | ${emailInvalid}
    ${"password"} | ${null}             | ${passwordRequired}
    ${"password"} | ${"pass"}           | ${passwordSize}
    ${"password"} | ${"alllowercase"}   | ${passwordPattern}
    ${"password"} | ${"ALLUPPERCASE"}   | ${passwordPattern}
    ${"password"} | ${"123456789"}      | ${passwordPattern}
    ${"password"} | ${"lower123456789"} | ${passwordPattern}
    ${"password"} | ${"lowerUPPER"}     | ${passwordPattern}
    ${"password"} | ${"UPPER123456789"} | ${passwordPattern}
  `("returns $expectedMessage when $field is $value", async ({ field, expectedMessage, value }) => {
    const user = { ...validUser };
    user[field] = value;
    const {
      body: { errors },
    } = await postUser({ user });
    expect(errors[field]).toBe(expectedMessage);
  });

  it(`returns ${emailInUse} when same email is already in use`, async () => {
    await User.create(validUser);
    const {
      body: {
        errors: { email },
      },
    } = await postUser();
    expect(email).toBe(emailInUse);
  });

  it("returns errors for both username is null/undefined and email is in use", async () => {
    await User.create(validUser);
    const {
      body: { errors },
    } = await postUser({ user: { ...validUser, username: null } });
    expect(Object.keys(errors)).toEqual(["username", "email"]);
  });

  it("creates user in inactive mode", async () => {
    await postUser();
    const userList = await User.findAll();
    const { inactive } = userList[0];
    expect(inactive).toBe(true);
  });

  it("creates user in inactive mode even the request body contains inactive as false", async () => {
    await postUser({ user: { ...validUser, inactive: false } });
    const userList = await User.findAll();
    const { inactive } = userList[0];
    expect(inactive).toBe(true);
  });

  it("creates an activationToken for user", async () => {
    await postUser({ user: { ...validUser, inactive: false } });
    const userList = await User.findAll();
    const { activationToken } = userList[0];
    expect(activationToken).toBeTruthy();
  });

  it("sends an Account activation email with activationToken", async () => {
    await postUser();
    const userList = await User.findAll();
    const { activationToken } = userList[0];
    expect(lastMail).toContain(validUser.email);
    expect(lastMail).toContain(activationToken);
  });

  it("returns  502 Bad Gateway when sending email fails", async () => {
    simulateSmtpFailure = true;
    const { status } = await postUser();
    expect(status).toBe(502);
  });

  it(`returns ${emailFailure} message when sending email fails`, async () => {
    simulateSmtpFailure = true;
    const {
      body: { message },
    } = await postUser();
    expect(message).toBe(emailFailure);
  });

  it(`does not save user to database if activation email fails`, async () => {
    simulateSmtpFailure = true;
    await postUser();
    const userList = await User.findAll();
    expect(userList.length).toBe(0);
  });
});

describe("Internationalization", () => {
  const userCreated = "Пользователь создан";
  const usernameRequired = "Имя обязательно для заполнения";
  const usernameSize = "Должно быть от 4 до 32 символов";
  const emailRequired = "Почта обязательна для заполнения";
  const emailInvalid = "Почта введена не верно";
  const emailInUse = "Почта уже используется";
  const emailFailure = "Неудачная почта";
  const passwordRequired = "Пароль обязателен для заполнения";
  const passwordSize = "Пароль должен состоять не менее чем из 6 символов";
  const passwordPattern = "Пароль должен состоять как минимум из 1 заглавной, 1 строчной буквы и 1 цифры";

  it.each`
    field         | value               | expectedMessage
    ${"username"} | ${null}             | ${usernameRequired}
    ${"username"} | ${"adm"}            | ${usernameSize}
    ${"username"} | ${"a".repeat(33)}   | ${usernameSize}
    ${"email"}    | ${null}             | ${emailRequired}
    ${"email"}    | ${"mail.com"}       | ${emailInvalid}
    ${"email"}    | ${"admin.mail.com"} | ${emailInvalid}
    ${"email"}    | ${"admin@mail"}     | ${emailInvalid}
    ${"password"} | ${null}             | ${passwordRequired}
    ${"password"} | ${"pass"}           | ${passwordSize}
    ${"password"} | ${"alllowercase"}   | ${passwordPattern}
    ${"password"} | ${"ALLUPPERCASE"}   | ${passwordPattern}
    ${"password"} | ${"123456789"}      | ${passwordPattern}
    ${"password"} | ${"lower123456789"} | ${passwordPattern}
    ${"password"} | ${"lowerUPPER"}     | ${passwordPattern}
    ${"password"} | ${"UPPER123456789"} | ${passwordPattern}
  `(
    "returns $expectedMessage when $field is $value when language is set as russian",
    async ({ field, expectedMessage, value }) => {
      const user = { ...validUser };
      user[field] = value;
      const {
        body: { errors },
      } = await postUser({ user, lng: "ru" });
      expect(errors[field]).toBe(expectedMessage);
    }
  );

  it(`returns ${emailInUse} when same email is already in use when language is set as russian`, async () => {
    await User.create(validUser);
    const {
      body: {
        errors: { email },
      },
    } = await postUser({ lng: "ru" });
    expect(email).toBe(emailInUse);
  });

  it(`returns ${userCreated} when signup request is valid is set as russian`, async () => {
    const {
      body: { message },
    } = await postUser({ lng: "ru" });
    expect(message).toBe(userCreated);
  });

  it(`returns ${emailFailure} message when sending email fails is set as russian`, async () => {
    simulateSmtpFailure = true;
    const {
      body: { message },
    } = await postUser({ lng: "ru" });
    expect(message).toBe(emailFailure);
  });
});
