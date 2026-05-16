// lib/auth.ts — your config looks correct ✅
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  basePath: "/api/oauth",          // ✅ custom base path
  providers: [
    Google({
  clientId:     process.env.GOOGLE_CLIENT_ID     ?? "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  authorization: {
    params: {
      redirect_uri: "http://localhost:3000/api/oauth/callback/google",
    },
  },
}),
  ],
  pages: {
    signIn: "/login",
  },
});