import NextAuth, { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import AzureADProvider from "next-auth/providers/azure-ad";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const emailServer = process.env.EMAIL_SERVER;
const emailFrom = process.env.EMAIL_FROM;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const appleClientId = process.env.APPLE_CLIENT_ID;
const appleClientSecret = process.env.APPLE_CLIENT_SECRET;
const microsoftClientId = process.env.AZURE_AD_CLIENT_ID;
const microsoftClientSecret = process.env.AZURE_AD_CLIENT_SECRET;

if (!emailServer || !emailFrom) {
  console.warn(
    "⚠️ EMAIL_SERVER 或 EMAIL_FROM 未设置，NextAuth 邮件登录将无法正常工作。"
  );
}

if (!googleClientId || !googleClientSecret) {
  console.warn(
    "⚠️ GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET 未设置，Google 登录将无法工作。"
  );
}

if (!appleClientId || !appleClientSecret) {
  console.warn(
    "⚠️ APPLE_CLIENT_ID / APPLE_CLIENT_SECRET 未设置，Apple 登录将无法工作。"
  );
}

if (!microsoftClientId || !microsoftClientSecret) {
  console.warn(
    "⚠️ AZURE_AD_CLIENT_ID / AZURE_AD_CLIENT_SECRET 未设置，Microsoft 登录将无法工作。"
  );
}

const providers = [
  EmailProvider({
    server: emailServer,
    from: emailFrom,
    maxAge: 10 * 60, // 10 分钟内有效
  }),
  ...(googleClientId && googleClientSecret
    ? [
        GoogleProvider({
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        }),
      ]
    : []),
  ...(appleClientId && appleClientSecret
    ? [
        AppleProvider({
          clientId: appleClientId,
          clientSecret: appleClientSecret,
        }),
      ]
    : []),
  ...(microsoftClientId && microsoftClientSecret
    ? [
        AzureADProvider({
          clientId: microsoftClientId,
          clientSecret: microsoftClientSecret,
        }),
      ]
    : []),
];

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
  },
  providers,
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.plan = user.plan;
        session.user.quota = user.quota;
        session.user.reportsUsed = user.reportsUsed;
        session.user.remainingQuota = Math.max(
          user.quota - user.reportsUsed,
          0
        );
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = user.plan;
        token.quota = user.quota;
        token.reportsUsed = user.reportsUsed;
      }
      return token;
    },
  },
  pages: {
    verifyRequest: "/auth/verify",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
