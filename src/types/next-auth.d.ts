// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string | null;
    } & DefaultSession["user"]; // name, email, image
  }

  interface User extends DefaultUser {
    id: string;
    username?: string | null;
  }
}
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    uid?: string;
    username?: string | null;
    picture?: string | null; // <- přidej, když ho plníš v jwt callbacku
  }
}

// (Optional) handy local types if you use them elsewhere:
export type UserSelect = {
  id?: boolean;
  email?: boolean;
  name?: boolean;
  image?: boolean;
  username?: boolean;
};

export type UserCreateInput = {
  id?: string;
  email: string;
  name?: string | null;
  image?: string | null;
  username?: string | null;
};
