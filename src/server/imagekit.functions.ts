import { createServerFn } from "@tanstack/react-start";
import crypto from "crypto";

/**
 * Returns ImageKit upload auth params (token, expire, signature)
 * computed using the private key stored as a server secret.
 */
export const getImageKitAuth = createServerFn({ method: "GET" }).handler(async () => {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("IMAGEKIT_PRIVATE_KEY is not configured");
  }
  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 60 * 30; // 30 min
  const signature = crypto
    .createHmac("sha1", privateKey)
    .update(token + expire)
    .digest("hex");
  return { token, expire, signature };
});