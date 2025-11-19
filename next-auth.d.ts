import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id: string;
      plan?: string;
      quota?: number;
      reportsUsed?: number;
      remainingQuota?: number;
    };
  }

  interface User {
    plan: string;
    quota: number;
    reportsUsed: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    plan?: string;
    quota?: number;
    reportsUsed?: number;
  }
}
