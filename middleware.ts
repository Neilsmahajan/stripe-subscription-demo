export { auth as middleware } from "@/auth";

export const config = {
  // Use Node.js runtime instead of Edge runtime
  runtime: "nodejs",
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
