import { auth } from "@clerk/nextjs";

export const checkRoleAdmin = (role: "admin") => {
  const { sessionClaims } = auth();
  return sessionClaims?.metadata.role === role;
};