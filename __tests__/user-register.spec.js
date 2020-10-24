const request = require("supertest");
const app = require("../src/app");
const User = require("../src/user/user");
const sequelize = require("../src/config/db");

beforeAll(() => sequelize.sync());

beforeEach(() => User.destroy({ truncate: true }));

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
  const passwordRequired = "Password is required";
  const passwordSize = "Password must be at least 6 characters";
  const passwordPattern = "Password must have at least 1 uppercase, 1 lowercase letter and 1 number";

  it("returns 200 OK when signup request is valid", async (done) => {
    const { status } = await postUser();
    expect(status).toBe(200);
    done();
  });

  it("returns success message when signup request is valid", async (done) => {
    const {
      body: { message },
    } = await postUser();
    expect(message).toBe(userCreated);
    done();
  });

  it("saves the user to database", async (done) => {
    await postUser();
    const userList = await User.findAll();
    expect(userList.length).toBe(1);
    done();
  });

  it("saves the name and email to database", async (done) => {
    await postUser();
    const userList = await User.findAll();
    const { username, email } = userList[0];
    expect(username).toBe(validUser.username);
    expect(email).toBe(validUser.email);
    done();
  });

  it("hashes the password in database", async (done) => {
    await postUser();
    const userList = await User.findAll();
    const { password } = userList[0];
    expect(password).not.toBe(validUser.password);
    done();
  });

  it("returns 400 when username is null", async (done) => {
    const { status } = await postUser({ user: { ...validUser, username: null } });
    expect(status).toBe(400);
    done();
  });

  it("returns errors field in response body when validation error occurs", async (done) => {
    const {
      body: { errors },
    } = await postUser({ user: { ...validUser, username: null } });
    expect(errors).not.toBeUndefined();
    done();
  });

  it("returns errors for both when username and email is null/undefined", async (done) => {
    const {
      body: { errors },
    } = await postUser({ user: { ...validUser, username: null, email: null } });
    expect(Object.keys(errors)).toEqual(["username", "email"]);
    done();
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
    ${"password"} | ${"UPPER123456789"} | ${passwordPattern}
  `("returns $expectedMessage when $field is $value", async ({ field, expectedMessage, value }) => {
    const user = { ...validUser };
    user[field] = value;
    const {
      body: { errors },
    } = await postUser({ user });
    expect(errors[field]).toBe(expectedMessage);
  });

  it(`returns ${emailInUse} when same email is already in use`, async (done) => {
    await User.create(validUser);
    const {
      body: {
        errors: { email },
      },
    } = await postUser();
    expect(email).toBe(emailInUse);
    done();
  });

  it("returns errors for both username is null/undefined and email is in use", async (done) => {
    await User.create(validUser);
    const {
      body: { errors },
    } = await postUser({ user: { ...validUser, username: null } });
    expect(Object.keys(errors)).toEqual(["username", "email"]);
    done();
  });
});

describe("Internationalization", () => {
  const userCreated = "Пользователь создан";
  const usernameRequired = "Имя обязательно для заполнения";
  const usernameSize = "Должно быть от 4 до 32 символов";
  const emailRequired = "Почта обязательна для заполнения";
  const emailInvalid = "Почта введена не верно";
  const emailInUse = "Почта уже используется";
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

  it(`returns ${emailInUse} when same email is already in use when language is set as russian`, async (done) => {
    await User.create(validUser);
    const {
      body: {
        errors: { email },
      },
    } = await postUser({ lng: "ru" });
    expect(email).toBe(emailInUse);
    done();
  });

  it(`returns ${userCreated} when signup request is valid is set as russian`, async (done) => {
    const {
      body: { message },
    } = await postUser({ lng: "ru" });
    expect(message).toBe(userCreated);
    done();
  });
});
