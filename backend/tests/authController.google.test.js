const mockUsers = new Map();
let mockPayloads = {};

function mockPutUser(user) {
  mockUsers.set(user.email.toLowerCase(), { ...user });
}

jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn(async ({ idToken }) => ({
      getPayload: () => mockPayloads[idToken]
    }))
  }))
}));

jest.mock("../src/models/userModel", () => ({
  findByEmail: jest.fn(async email => mockUsers.get(email.toLowerCase()) || null),
  create: jest.fn(async user => {
    const created = {
      id: mockUsers.size + 1,
      is_active: true,
      last_login: null,
      created_at: new Date(),
      ...user
    };
    mockPutUser(created);
    return created;
  }),
  updateLastLogin: jest.fn(),
  updateRoleAndName: jest.fn(async (id, { role, full_name }) => {
    for (const [email, user] of mockUsers) {
      if (user.id === id) {
        const updated = { ...user, role, full_name: full_name || user.full_name };
        mockUsers.set(email, updated);
        return updated;
      }
    }
    return null;
  })
}));

async function callHandler(handler, body) {
  return new Promise(resolve => {
    const req = { body };
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ statusCode: this.statusCode, payload });
      }
    };

    handler(req, res, error => resolve({ error }));
  });
}

describe("Google viewer registration", () => {
  let authController;

  beforeEach(() => {
    mockUsers.clear();
    mockPayloads = {};
    process.env.GOOGLE_CLIENT_ID = "test-client.apps.googleusercontent.com";
    process.env.NODE_ENV = "test";
    authController = require("../src/controllers/authController");
  });

  it("converts a legacy admin email to viewer even if stale role data is sent", async () => {
    mockPutUser({
      id: 1,
      full_name: "Old Admin",
      email: "old-admin@example.com",
      role: "ADMIN",
      is_active: true
    });
    mockPayloads.legacyAdmin = {
      email: "old-admin@example.com",
      name: "Old Admin From Google",
      email_verified: true
    };

    const result = await callHandler(authController.googleRegister, {
      credential: "legacyAdmin",
      full_name: "Amith",
      role: "ADMIN"
    });

    expect(result.statusCode).toBe(200);
    expect(result.payload.data.user).toMatchObject({
      email: "old-admin@example.com",
      full_name: "Amith",
      role: "VIEWER"
    });
  });

  it("does not convert reserved fixed admin email through Google", async () => {
    mockPutUser({
      id: 1,
      full_name: "Admin User",
      email: "admin@transport-contract.local",
      role: "ADMIN",
      is_active: true
    });
    mockPayloads.fixedAdmin = {
      email: "admin@transport-contract.local",
      name: "Fixed Admin",
      email_verified: true
    };

    const result = await callHandler(authController.googleRegister, {
      credential: "fixedAdmin",
      full_name: "Fixed Admin",
      role: "ADMIN"
    });

    expect(result.error.statusCode).toBe(403);
    expect(result.error.message).toBe("This email is reserved for fixed Admin/Staff login");
  });

  it("creates a viewer account when Google returns a verified email for a new user", async () => {
    mockPayloads.newViewer = {
      email: "viewer@example.com",
      name: "Viewer User",
      email_verified: true
    };

    const result = await callHandler(authController.googleLogin, {
      credential: "newViewer"
    });

    expect(result.statusCode).toBe(200);
    expect(result.payload).toMatchObject({
      success: true,
      user: {
        email: "viewer@example.com",
        role: "VIEWER"
      }
    });
  });

  it("accepts a development fallback credential when local testing is enabled", async () => {
    process.env.ALLOW_DEV_GOOGLE_LOGIN = "true";
    authController = require("../src/controllers/authController");

    const result = await callHandler(authController.googleLogin, {
      credential: "dev:viewer@example.com"
    });

    expect(result.statusCode).toBe(200);
    expect(result.payload).toMatchObject({
      success: true,
      user: {
        email: "viewer@example.com",
        role: "VIEWER"
      }
    });
  });
});
