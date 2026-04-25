import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'
import type { UserRole, ApprovalStatus } from '@prisma/client'

declare module 'next-auth' {
  interface User {
    role: UserRole
    approvalStatus: ApprovalStatus
    company?: string | null
  }
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: UserRole
      approvalStatus: ApprovalStatus
      company?: string | null
    }
  }
}


export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) return null

        try {
          const user = await prisma.user.findUnique({ where: { email } })
          if (!user || !user.passwordHash) return null

          const valid = await compare(password, user.passwordHash)
          if (!valid) return null

          // Return the user — approvalStatus check happens in sign-in callback
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            approvalStatus: user.approvalStatus,
            company: user.company,
          }
        } catch (err) {
          console.error('[auth] Database error during sign-in:', err)
          return null
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      // Block non-approved users from completing sign-in
      if (
        user.approvalStatus === 'PENDING' ||
        user.approvalStatus === 'REJECTED' ||
        user.approvalStatus === 'SUSPENDED'
      ) {
        return false
      }
      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role
        token.approvalStatus = user.approvalStatus
        token.company = user.company
      }
      return token
    },

    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as UserRole
      session.user.approvalStatus = token.approvalStatus as ApprovalStatus
      session.user.company = token.company as string | null | undefined
      return session
    },
  },

  pages: {
    signIn: '/signin',
    error: '/signin',
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
})
