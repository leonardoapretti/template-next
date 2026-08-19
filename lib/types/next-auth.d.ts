// src/types/next-auth.d.ts

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    nome: string;
    isAdmin: boolean;
  }

  interface Session {
    user: {
      id: string;
      nome: string;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    nome?: string;
    isAdmin?: boolean;
  }
}
