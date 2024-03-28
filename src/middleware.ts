import { authMiddleware } from "@clerk/nextjs";
 
export default authMiddleware({
  publicRoutes: ['/', '/dashboard'], // An array of paths
});
 
export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/(api|trpc)(.*)"
  ]
};
