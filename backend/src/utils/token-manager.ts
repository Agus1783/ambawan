import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { AuthenticationError } from "../exceptions/index";

function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} belum diisi`);
  }
  return value;
}

export interface AccessTokenPayload {
  sub: string;
}

export const TokenManager = {
  generateAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, getEnv("ACCESS_TOKEN_KEY"), {
      expiresIn: "1h",
    });
  },

  generateRefreshToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, getEnv("REFRESH_TOKEN_KEY"), {
      expiresIn: "7d",
    });
  },

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(
        token,
        getEnv("ACCESS_TOKEN_KEY"),
      ) as JwtPayload;
      if (typeof decoded.sub !== "string") {
        throw new Error("Payload token tidak valid");
      }
      return { sub: decoded.sub };
    } catch {
      throw new AuthenticationError("Access token tidak valid");
    }
  },

  verifyRefreshToken(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(
        token,
        getEnv("REFRESH_TOKEN_KEY"),
      ) as JwtPayload;
      if (typeof decoded.sub !== "string") {
        throw new Error("Payload token tidak valid");
      }
      return { sub: decoded.sub };
    } catch {
      throw new AuthenticationError("Refresh token tidak valid");
    }
  },
};

export default TokenManager;
