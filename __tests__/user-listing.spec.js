const request = require("supertest");
const app = require("../src/app");
const User = require("../src/user/user");
const sequelize = require("../src/config/db");

beforeAll(async () => {
  await sequelize.sync();
});

beforeEach(() => {
  return User.destroy({ truncate: true });
});

const getUsers = () => request(app).get("/api/1.0/users");

const addUsers = async (activeUserCount, inactiveUserCount = 0) => {
  for (let i = 0; i < activeUserCount + inactiveUserCount; i++) {
    await User.create({
      username: `user${i + 1}`,
      email: `user${i + 1}@mail.com`,
      inactive: i >= activeUserCount,
    });
  }
};

describe("Listing Users", () => {
  it("returns 200 ok when there are no user in database", async () => {
    const { status } = await getUsers();
    expect(status).toBe(200);
  });

  it("returns page object as response body", async () => {
    const { body } = await getUsers();
    expect(body).toEqual({
      content: [],
      page: 0,
      size: 10,
      totalPages: 0,
    });
  });

  it("returns 10 users in page content when there 11 users in database", async () => {
    await addUsers(11);
    const {
      body: { content },
    } = await getUsers();
    expect(content.length).toBe(10);
  });

  it("returns 6 users in page content when there are active 6 users and inactive 5 users in database", async () => {
    await addUsers(6, 5);
    const {
      body: { content },
    } = await getUsers();
    expect(content.length).toBe(6);
  });

  it("returns only id, username and email in content array for each user", async () => {
    await addUsers(11);
    const {
      body: { content },
    } = await getUsers();
    expect(Object.keys(content[0])).toEqual(["id", "username", "email"]);
  });

  it("returns 2 as totalPages when there are active 15 and inactive 7 users in database", async () => {
    await addUsers(15, 7);
    const {
      body: { totalPages },
    } = await getUsers();
    expect(totalPages).toBe(2);
  });
});
