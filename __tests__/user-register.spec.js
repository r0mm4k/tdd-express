const request = require("supertest");
const app = require("../src/app");
const User = require("../src/user/user");
const sequelize = require("../src/config/db");

beforeAll(() => sequelize.sync());

beforeEach(() => User.destroy({ truncate: true }));

describe("User Registration", () => {
  const validUser = {
    username: "test",
    email: "test@mail.com",
    password: "test12345",
  };

  const postValidUser = () => request(app).post("/api/1.0/users").send(validUser);

  it("returns 200 OK when signup request is valid", async (done) => {
    const { status } = await postValidUser();
    expect(status).toBe(200);
    done();
  });

  it("returns success message when signup request is valid", async (done) => {
    const {
      body: { message },
    } = await postValidUser();
    expect(message).toBe("User created");
    done();
  });

  it("saves the user to database", async (done) => {
    await postValidUser();
    const userList = await User.findAll();
    expect(userList.length).toBe(1);
    done();
  });

  it("saves the name and email to database", async (done) => {
    await postValidUser();
    const userList = await User.findAll();
    const { username, email } = userList[0];
    expect(username).toBe(validUser.username);
    expect(email).toBe(validUser.email);
    done();
  });

  it("hashes the password in database", async (done) => {
    await postValidUser();
    const userList = await User.findAll();
    const { password } = userList[0];
    expect(password).not.toBe(validUser.password);
    done();
  });
});
