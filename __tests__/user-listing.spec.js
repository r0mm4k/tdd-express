const request = require("supertest");
const app = require("../src/app");

describe("Listing Users", () => {
  it("returns 200 ok when there are no user in database", async () => {
    const { status } = await request(app).get("/api/1.0/users");
    expect(status).toBe(200);
  });

  it("returns page object as response body", async () => {
    const { body } = await request(app).get("/api/1.0/users");
    expect(body).toEqual({
      content: [],
      page: 0,
      size: 10,
      totalPages: 0,
    });
  });
});
