import { Response } from "express";
import fs from "fs";
import path from "path";
import { UserRepository } from "../repositories/baseRepository";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Ensure uploads directory exists at project root
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Parses data URL containing base64 data to separate mimeType and base64 string
function parseBase64Image(dataUrl: string) {
  const matches = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return null;
  }
  return {
    mimeType: matches[1],
    base64Data: matches[2]
  };
}

export async function getAvatar(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await UserRepository.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    return res.json({ profileImage: user.profileImage || "" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch avatar." });
  }
}

export async function uploadAvatar(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Missing image data. Supported formats: JPG, JPEG, PNG, WEBP." });
    }

    const parsed = parseBase64Image(image);
    if (!parsed) {
      return res.status(400).json({ error: "Invalid image: Malformed base64 image data." });
    }

    const { mimeType, base64Data } = parsed;
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(mimeType)) {
      return res.status(400).json({ error: "Unsupported format. Only JPG, JPEG, PNG, and WEBP formats are supported." });
    }

    // Validate size (max 5MB)
    const sizeInBytes = (base64Data.length * 3) / 4 - (base64Data.endsWith("==") ? 2 : base64Data.endsWith("=") ? 1 : 0);
    if (sizeInBytes > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "Large file: Profile image must be less than 5 MB." });
    }

    const buffer = Buffer.from(base64Data, "base64");
    if (!buffer || buffer.length < 100) {
      return res.status(400).json({ error: "Corrupted image: The uploaded file is invalid or corrupted." });
    }

    const user = await UserRepository.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    // Determine extension
    let ext = "png";
    if (mimeType === "image/jpeg" || mimeType === "image/jpg") ext = "jpg";
    else if (mimeType === "image/webp") ext = "webp";

    const fileName = `avatar_${userId}_${Date.now()}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    // Save file
    fs.writeFileSync(filePath, buffer);

    // Delete old avatar if it exists
    if (user.profileImage && user.profileImage.startsWith("/uploads/")) {
      const oldPath = path.join(process.cwd(), user.profileImage);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          console.error("[Avatar] Failed to clean up old avatar:", e);
        }
      }
    }

    const relativeUrl = `/uploads/${fileName}`;
    await UserRepository.findByIdAndUpdate(userId, { profileImage: relativeUrl });

    return res.json({
      message: "Profile picture updated successfully.",
      profileImage: relativeUrl
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to upload avatar." });
  }
}

export async function deleteAvatar(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await UserRepository.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    // Delete old avatar if it exists on disk
    if (user.profileImage && user.profileImage.startsWith("/uploads/")) {
      const oldPath = path.join(process.cwd(), user.profileImage);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          console.error("[Avatar] Failed to clean up deleted avatar:", e);
        }
      }
    }

    await UserRepository.findByIdAndUpdate(userId, { profileImage: "" });

    return res.json({
      message: "Profile picture removed.",
      profileImage: ""
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to remove avatar." });
  }
}
