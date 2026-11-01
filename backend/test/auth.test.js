const { afterEach, test } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

process.env.SECRET_CODE ||= "test-secret-for-auth-tests";

const User = require("../models/userModel.js");
const { Login, Register } = require("../controllers/authController.js");
const authMiddleware = require("../middleware/authMiddleware.js");
const socketMiddleware = require("../middleware/socketMiddleware.js");

const originalFindOne = User.findOne;
const originalCreate = User.create;

afterEach(() => {
  User.findOne = originalFindOne;
  User.create = originalCreate;
});

function expressRequest(token, cookieToken) {
  const req = { headers: {}, cookies: {} };
  if (token !== undefined) req.headers.authorization = `Bearer ${token}`;
  if (cookieToken !== undefined) req.cookies.token = cookieToken;
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  let continued = false;
  authMiddleware(req, res, () => { continued = true; });
  return { req, res, continued };
}

function socketRequest(authToken, cookieToken) {
  const socket = {
    handshake: {
      auth: authToken ? { token: authToken } : {},
      headers: { cookie: cookieToken ? `other=value; token=${cookieToken}` : "" },
    },
  };
  let error;
  socketMiddleware(socket, (value) => { error = value; });
  return { socket, error };
}

function responseRecorder() {
  return {
    statusCode: 200,
    cookieName: null,
    cookieValue: null,
    cookie(name, value) { this.cookieName = name; this.cookieValue = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("registration returns a JWT without returning password data", async () => {
  const id = new mongoose.Types.ObjectId();
  User.findOne = async () => null;
  User.create = async (data) => ({ _id: id, username: data.username, email: data.email });
  const res = responseRecorder();

  await Register({ body: { username: "Test User", email: "TEST@example.com", password: "secret" } }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.cookieName, "token");
  assert.equal(res.body.success, true);
  assert.equal(jwt.verify(res.body.token, process.env.SECRET_CODE).userId, id.toString());
  assert.equal("password" in res.body, false);
  assert.equal("email" in res.body, false);
});

test("login returns a JWT without returning user secrets", async () => {
  const id = new mongoose.Types.ObjectId();
  User.findOne = async () => ({
    _id: id,
    password: await bcrypt.hash("correct horse", 4),
  });
  const res = responseRecorder();

  await Login({ body: { email: "test@example.com", password: "correct horse" } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.cookieName, "token");
  assert.equal(res.body.success, true);
  assert.equal(jwt.verify(res.body.token, process.env.SECRET_CODE).userId, id.toString());
  assert.equal("password" in res.body, false);
});

test("login rejects invalid credentials", async () => {
  User.findOne = async () => null;
  const res = responseRecorder();
  await Login({ body: { email: "missing@example.com", password: "wrong" } }, res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.token, undefined);
});

test("HTTP auth accepts Bearer and retains cookie fallback", () => {
  const token = jwt.sign({ userId: "user-123" }, process.env.SECRET_CODE, { expiresIn: "1h" });
  const bearer = expressRequest(token);
  assert.equal(bearer.continued, true);
  assert.equal(bearer.req.user.userId, "user-123");

  const cookie = expressRequest(undefined, token);
  assert.equal(cookie.continued, true);
  assert.equal(cookie.req.user.userId, "user-123");

  const invalidBearer = expressRequest("invalid", token);
  assert.equal(invalidBearer.continued, false);
  assert.equal(invalidBearer.res.statusCode, 401);
});

test("Socket.IO auth accepts handshake JWT and retains cookie fallback", () => {
  const token = jwt.sign({ userId: "user-456" }, process.env.SECRET_CODE, { expiresIn: "1h" });
  const handshake = socketRequest(token);
  assert.equal(handshake.error, undefined);
  assert.equal(handshake.socket.userId, "user-456");

  const cookie = socketRequest(undefined, token);
  assert.equal(cookie.error, undefined);
  assert.equal(cookie.socket.userId, "user-456");

  const invalid = socketRequest("expired-or-invalid", token);
  assert.ok(invalid.error);
});

test("expired JWT is rejected by HTTP and Socket.IO auth", () => {
  const expired = jwt.sign({ userId: "user-789" }, process.env.SECRET_CODE, { expiresIn: -1 });
  const http = expressRequest(expired);
  assert.equal(http.continued, false);
  assert.equal(http.res.statusCode, 401);

  const socket = socketRequest(expired);
  assert.ok(socket.error);
});
