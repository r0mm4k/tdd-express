const request = require("supertest");
const app = require("../src/app");
const User = require("../src/user/user");
const sequelize = require("../src/config/db");

beforeAll(() => sequelize.sync());

beforeEach(() => User.destroy({ truncate: true }));

const validUser = {
  username: "test",
  email: "test@mail.com",
  password: "test12345",
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

  it("returns validationErrors field in response body when validation error occurs", async (done) => {
    const {
      body: { errors },
    } = await postUser({ ...validUser, username: null });
    expect(errors).not.toBeUndefined();
    done();
  });

  it("returns Username is required when username is null/undefined", async (done) => {
    const {
      body: {
        errors: { username },
      },
    } = await postUser({ ...validUser, username: null });
    expect(username).toBe("Username is required");
    done();
  });
});
