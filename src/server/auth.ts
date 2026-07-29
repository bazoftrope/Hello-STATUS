import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'employee' | 'manager';
      departmentId: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: 'employee' | 'manager';
    departmentId: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'employee' | 'manager';
    departmentId: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email и пароль обязательны');
        }

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1);

        if (user.length === 0) {
          throw new Error('Неверный email или пароль');
        }

        const foundUser = user[0];

        if (!foundUser.isActive) {
          throw new Error('Аккаунт деактивирован');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          foundUser.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error('Неверный email или пароль');
        }

        return {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.fullName,
          role: foundUser.role,
          departmentId: foundUser.departmentId,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.departmentId = user.departmentId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.departmentId = token.departmentId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
