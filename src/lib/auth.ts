import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Sifre", type: "password" },
      },
      async authorize(credentials) {
        console.log("[AUTH] Login attempt:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH] Missing email or password");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: (credentials.email as string).toLowerCase().trim() },
        });

        if (!user || !user.password) {
          console.log("[AUTH] User not found for email:", credentials.email);
          return null;
        }

        if (user.isBlacklisted) {
          console.log("[AUTH] User blacklisted:", user.email);
          throw new Error("Hesabiniz engellenmistir.");
        }

        const isValid = await compare(
          credentials.password as string,
          user.password
        );

        console.log("[AUTH] Password valid:", isValid, "for user:", user.email, "role:", user.role);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/giris",
    error: "/giris",
  },
  session: {
    strategy: "jwt",
  },
});
