import type { Request, Response } from "express";
import { z } from "zod";
import { RefreshToken, User } from "@/models/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { sendSuccess } from "@/utils/apiResponse.js";
import { generateAccessToken, generateRefreshTokenString, hashToken } from "@/utils/jwt.js";
import { hashPassword, verifyPassword } from "@/utils/password.js";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const authController = {
  /**
   * Register a new citizen account
   */
  async register(req: Request, res: Response) {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      throw ApiError.badRequest("Validation failed", parse.error.flatten().fieldErrors);
    }

    const { name, email, password, phone } = parse.data;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw ApiError.conflict("An account with this email address already exists.");
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "CITIZEN",
      phone,
      isActive: true,
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { token: rawRefreshToken, expiresAt } = generateRefreshTokenString();
    await RefreshToken.create({
      user: user._id,
      tokenHash: hashToken(rawRefreshToken),
      expiresAt,
    });

    sendSuccess(
      res,
      {
        user,
        tokens: {
          accessToken,
          refreshToken: rawRefreshToken,
        },
      },
      "Registration successful",
      201,
    );
  },

  /**
   * Log in an existing user
   */
  async login(req: Request, res: Response) {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      throw ApiError.badRequest("Validation failed", parse.error.flatten().fieldErrors);
    }

    const { email, password } = parse.data;

    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user || !user.isActive) {
      throw ApiError.unauthorized("Invalid email or password.");
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized("Invalid email or password.");
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      department: user.department?.toString(),
    });

    const { token: rawRefreshToken, expiresAt } = generateRefreshTokenString();
    await RefreshToken.create({
      user: user._id,
      tokenHash: hashToken(rawRefreshToken),
      expiresAt,
    });

    // Remove passwordHash before response
    user.passwordHash = undefined as unknown as string;

    sendSuccess(
      res,
      {
        user,
        tokens: {
          accessToken,
          refreshToken: rawRefreshToken,
        },
      },
      "Login successful",
    );
  },

  /**
   * Rotate refresh token and get a new access token
   */
  async refresh(req: Request, res: Response) {
    const parse = refreshSchema.safeParse(req.body);
    if (!parse.success) {
      throw ApiError.badRequest("Refresh token is required");
    }

    const { refreshToken: rawToken } = parse.data;
    const tokenHash = hashToken(rawToken);

    const storedToken = await RefreshToken.findOne({ tokenHash, revoked: false });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw ApiError.unauthorized("Invalid or expired refresh token.");
    }

    const user = await User.findById(storedToken.user);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized("User not found or inactive.");
    }

    // Revoke old token (Token rotation security)
    storedToken.revoked = true;
    storedToken.revokedAt = new Date();
    await storedToken.save();

    // Issue new pair
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      department: user.department?.toString(),
    });

    const { token: newRawRefreshToken, expiresAt } = generateRefreshTokenString();
    await RefreshToken.create({
      user: user._id,
      tokenHash: hashToken(newRawRefreshToken),
      expiresAt,
    });

    sendSuccess(
      res,
      {
        tokens: {
          accessToken,
          refreshToken: newRawRefreshToken,
        },
      },
      "Token refreshed successfully",
    );
  },

  /**
   * Log out and revoke refresh token
   */
  async logout(req: Request, res: Response) {
    const token = req.body?.refreshToken;
    if (token) {
      const tokenHash = hashToken(token);
      await RefreshToken.updateOne({ tokenHash }, { revoked: true, revokedAt: new Date() });
    }

    sendSuccess(res, null, "Logged out successfully");
  },

  /**
   * Get current authenticated user profile
   */
  async me(req: Request, res: Response) {
    sendSuccess(res, { user: req.user }, "User profile retrieved");
  },
};
