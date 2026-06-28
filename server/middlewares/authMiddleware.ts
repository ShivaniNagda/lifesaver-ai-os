import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "lifesaver_os_ultra_secure_secret_token_1867145";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn(`[Middleware Blocked] Access denied on path ${req.originalUrl}: No Bearer auth header found.`);
    return res.status(401).json({ error: "Access denied. No authentication token provided." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    req.user = decoded;
    console.log(`[Middleware Approved] Verified JWT user: ${decoded.email || decoded.id} (${decoded.role})`);
    next();
  } catch (err: any) {
    console.warn(`[Middleware Blocked] JWT verification failed on path ${req.originalUrl}: ${err.message || err}`);
    return res.status(401).json({ error: "Invalid or expired session token. Please re-authenticate." });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Access denied. Authentication required." });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden. Insufficient clearance level." });
    }
    next();
  };
}
