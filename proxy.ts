import { clerkMiddleware } from "@clerk/nextjs/server";

function isPublicRoute(pathname: string) {
  return pathname === "/sources" || pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
}

export default clerkMiddleware(
  async (auth, request) => {
    if (!isPublicRoute(request.nextUrl.pathname)) await auth.protect();
  },
  { signInUrl: "/sign-in", signUpUrl: "/sign-up" },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
