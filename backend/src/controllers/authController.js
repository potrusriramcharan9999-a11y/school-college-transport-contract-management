const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");
const { env } = require("../config/env");
const userModel = require("../models/userModel");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/appError");
const { success } = require("../utils/apiResponse");

const allowedRoles = ["ADMIN", "STAFF", "VIEWER"];
const passwordRoles = ["ADMIN", "STAFF"];
const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

const fixedCredentialUsers = [
  {
    email: "admin@transport-contract.local",
    password: "Admin@2026",
    full_name: "Admin User",
    role: "ADMIN"
  },
  {
    email: "staff@transport-contract.local",
    password: "Staff@2026",
    full_name: "Staff User",
    role: "STAFF"
  }
];

function isFixedCredentialEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  return fixedCredentialUsers.some(account => account.email === normalizedEmail);
}

const register = asyncHandler(async (req, res) => {
  const { full_name, email, password, role } = req.body;

  if (!full_name || !email || !password || !role) {
    throw new AppError("full_name, email, password, and role are required", 400);
  }

  if (!allowedRoles.includes(role)) {
    throw new AppError("Invalid role", 400);
  }

  if (!passwordRoles.includes(role)) {
    throw new AppError("Viewer accounts can sign in with Google only", 400);
  }

  const existingUser = await userModel.findByEmail(email);
  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  const password_hash = await bcrypt.hash(password, 10);
  const user = await userModel.create({ full_name, email, password_hash, role });

  return success(res, { user }, 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("email and password are required", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const fixedUser = fixedCredentialUsers.find(
    account => account.email === normalizedEmail && account.password === password
  );

  if (fixedUser) {
    const user = await ensureFixedCredentialUser(fixedUser);
    await userModel.updateLastLogin(user.id);
    return res.json(buildAuthResponse(user));
  }

  const user = await userModel.findByEmail(email);
  if (!user || !user.is_active) {
    throw new AppError("Invalid credentials", 401);
  }

  if (!passwordRoles.includes(user.role)) {
    throw new AppError("Viewer accounts can sign in with Google only", 403);
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new AppError("Invalid credentials", 401);
  }

  await userModel.updateLastLogin(user.id);

  return res.json(buildAuthResponse(user));
});

const me = asyncHandler(async (req, res) => {
  return success(res, { user: req.user });
});

async function ensureFixedCredentialUser(account) {
  const existingUser = await userModel.findByEmail(account.email);

  if (existingUser) {
    if (!existingUser.is_active) {
      throw new AppError("User is inactive", 401);
    }

    if (existingUser.role !== account.role) {
      throw new AppError("Fixed credential email is assigned to a different role", 409);
    }

    return existingUser;
  }

  const password_hash = await bcrypt.hash(account.password, 10);
  return userModel.create({
    full_name: account.full_name,
    email: account.email,
    password_hash,
    role: account.role
  });
}

async function convertLegacyUserToViewer(user, fullName) {
  if (!user.is_active) {
    throw new AppError("User is inactive", 401);
  }

  if (isFixedCredentialEmail(user.email)) {
    throw new AppError("This email is reserved for fixed Admin/Staff login", 403);
  }

  return userModel.updateRoleAndName(user.id, {
    role: "VIEWER",
    full_name: fullName
  });
}

async function verifyGoogleProfile(credential) {
  if (!credential) {
    throw new AppError("Google credential token is required", 400);
  }

  if (process.env.ALLOW_DEV_GOOGLE_LOGIN === "true" && credential.startsWith("dev:")) {
    const email = credential.substring(4);
    return {
      email,
      name: email.split("@")[0]
    };
  }

  if (!googleClient || !env.googleClientId) {
    throw new AppError("Google Client ID is not configured on the server", 500);
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.googleClientId,
    });
    const payload = ticket.getPayload();

    if (!payload.email_verified) {
      throw new AppError("Google email address is not verified", 401);
    }

    return {
      email: payload.email,
      name: payload.name
    };
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError("Invalid Google credential token: " + err.message, 401);
  }
}

function buildAuthResponse(user) {
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  return {
    success: true,
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role
    }
  };
}

const googleRegister = asyncHandler(async (req, res) => {
  const { credential, full_name } = req.body;
  const requestedName = typeof full_name === "string" ? full_name.trim() : "";

  if (!requestedName) {
    throw new AppError("full_name is required to create a Viewer account", 400);
  }

  const { email } = await verifyGoogleProfile(credential);

  if (!email) {
    throw new AppError("Could not retrieve email from Google credential", 400);
  }

  const existingUser = await userModel.findByEmail(email);
  if (existingUser) {
    if (existingUser.role === "VIEWER") {
      throw new AppError("Email already registered. Please log in with Google instead.", 409);
    }

    const user = await convertLegacyUserToViewer(existingUser, requestedName);
    return success(res, { user }, 200);
  }

  const randomPassword = crypto.randomBytes(32).toString("hex");
  const password_hash = await bcrypt.hash(randomPassword, 10);
  const user = await userModel.create({
    full_name: requestedName,
    email,
    password_hash,
    role: "VIEWER"
  });

  return success(res, { user }, 201);
});

const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  const { email, name } = await verifyGoogleProfile(credential);

  if (!email) {
    throw new AppError("Could not retrieve email from Google credential", 400);
  }

  let user = await userModel.findByEmail(email);

  if (!user) {
    const randomPassword = crypto.randomBytes(32).toString("hex");
    const password_hash = await bcrypt.hash(randomPassword, 10);
    user = await userModel.create({
      full_name: name || email.split("@")[0],
      email,
      password_hash,
      role: "VIEWER"
    });
  }

  if (!user.is_active) {
    throw new AppError("User is inactive", 401);
  }

  if (user.role !== "VIEWER") {
    user = await convertLegacyUserToViewer(user, name || email.split("@")[0]);
  }

  await userModel.updateLastLogin(user.id);

  return res.json(buildAuthResponse(user));
});

module.exports = {
  register,
  login,
  googleRegister,
  googleLogin,
  me
};
