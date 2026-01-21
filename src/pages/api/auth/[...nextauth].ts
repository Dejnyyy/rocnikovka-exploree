// pages/api/auth/[...nextauth].ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" }, // necessary for middleware
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const existing = await prisma.user.findUnique({
        where: { email: user.email },
      });
      if (!existing) {
        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name ?? null,
            image: user.image ?? null,
          },
        });
      }
      return true;
    },
    // ⬇️ JWT carries id + username
    async jwt({ token, user }) {
      const email = user?.email ?? token.email;
      if (!email) return token;
      const dbUser = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          email: true,
        },
      });

      if (dbUser) {
        token.uid = dbUser.id;
        token.username = dbUser.username ?? null;
        token.name = dbUser.name ?? token.name;
        token.picture = dbUser.image ?? token.picture;
        token.email = dbUser.email ?? token.email;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.username =
          (token as { username?: string | null }).username ?? null;
        session.user.name = token.name ?? session.user.name;
        session.user.image =
          (token.picture as string | null) ?? session.user.image ?? null;
        session.user.email = token.email ?? session.user.email;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
