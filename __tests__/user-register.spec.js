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

const postUser = (user = validUser) => request(app).post("/api/1.0/users").send(user);

describe("User Registration", () => {
  it("returns 200 OK when signup request is valid", async (done) => {
    const { status } = await postUser();
    expect(status).toBe(200);
    done();
  });

  it("returns success message when signup request is valid", async (done) => {
    const {
      body: { message },
    } = await postUser();
    expect(message).toBe("User created");
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
    const { status } = await postUser({ ...validUser, username: null });
    expect(status).toBe(400);
    done();
  });

  it("returns errors field in response body when validation error occurs", async (done) => {
    const {
      body: { errors },
    } = await postUser({ ...validUser, username: null });
    expect(errors).not.toBeUndefined();
    done();
  });

  it("returns errors for both when username and email is null/undefined", async (done) => {
    const {
      body: { errors },
    } = await postUser({ ...validUser, username: null, email: null });
    expect(Object.keys(errors)).toEqual(["username", "email"]);
    done();
  });

  it.each`
    field         | value               | expectedMessage
    ${"username"} | ${null}             | ${"Username is required"}
    ${"username"} | ${"adm"}            | ${"Must have 4 and max 32 characters"}
    ${"username"} | ${"a".repeat(33)}   | ${"Must have 4 and max 32 characters"}
    ${"email"}    | ${null}             | ${"Email is required"}
    ${"email"}    | ${"mail.com"}       | ${"Email is not valid"}
    ${"email"}    | ${"admin.mail.com"} | ${"Email is not valid"}
    ${"email"}    | ${"admin@mail"}     | ${"Email is not valid"}
    ${"password"} | ${null}             | ${"Password is required"}
    ${"password"} | ${"alllowercase"}   | ${"Password must have at least 1 uppercase, 1 lowercase letter and 1 number"}
    ${"password"} | ${"ALLUPPERCASE"}   | ${"Password must have at least 1 uppercase, 1 lowercase letter and 1 number"}
    ${"password"} | ${"123456789"}      | ${"Password must have at least 1 uppercase, 1 lowercase letter and 1 number"}
    ${"password"} | ${"lower123456789"} | ${"Password must have at least 1 uppercase, 1 lowercase letter and 1" + " number"}
    ${"password"} | ${"UPPER123456789"} | ${"Password must have at least 1 uppercase, 1 lowercase letter and 1" + " number"}
  `("returns $expectedMessage when $field is $value", async ({ field, expectedMessage, value }) => {
    const user = { ...validUser };
    user[field] = value;
    const {
      body: { errors },
    } = await postUser(user);
    expect(errors[field]).toBe(expectedMessage);
  });
});
