import { auth } from "@clerk/nextjs";

export const checkRole = (role: "admin" | "moderator") => {
  const { sessionClaims } = auth();
  return sessionClaims?.metadata.role === role;
};