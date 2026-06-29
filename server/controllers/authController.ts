import { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/baseRepository";
import { RegisterSchema, LoginSchema } from "../validators/schemas";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

const JWT_SECRET = process.env.JWT_SECRET || "lifesaver_os_ultra_secure_secret_token_1867145";

export async function register(req: any, res: Response) {
  try {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Validation failed", details: parseResult.error.format() });
    }

    const { username, email, password, role } = parseResult.data;

    // Check if user exists
    const existingUser = await UserRepository.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered in the database." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await UserRepository.create({
      username,
      email,
      passwordHash,
      role: role || "Executive Officer"
    });

    // Generate JWT
    const token = jwt.sign(
      { id: newUser.id || newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Operator registered successfully.",
      token,
      user: {
        id: newUser.id || newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        profileImage: newUser.profileImage || ""
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to register operator." });
  }
}

export async function login(req: any, res: Response) {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Validation failed", details: parseResult.error.format() });
    }

    const { email, password } = parseResult.data;

    const user = await UserRepository.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user.id || user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Handshake completed. Core session online.",
      token,
      user: {
        id: user.id || user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage || ""
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to establish core session." });
  }
}

export async function forgotPassword(req: any, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await UserRepository.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "No operator found with this email." });
    }

    // Since we don't have an email sender, we return a mock verification link for full functionality
    const resetToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: "15m" });
    const resetLink = `/reset-password?token=${resetToken}`;

    return res.json({
      message: "Password reset link generated securely.",
      resetLink,
      resetToken
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to generate security token." });
  }
}

export async function resetPassword(req: any, res: Response) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required." });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: "Expired or invalid security token." });
    }

    const user = await UserRepository.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ error: "Operator not found." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await UserRepository.findByIdAndUpdate(user.id || user._id, { passwordHash });

    return res.json({ message: "Password updated successfully. Session secured." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to update security credentials." });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated." });
    }

    const user = await UserRepository.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "Operator account not found." });
    }

    return res.json({
      id: user.id || user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage || ""
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch operator parameters." });
  }
}

export async function logout(req: any, res: Response) {
  return res.json({ message: "Operator session terminated safely." });
}
