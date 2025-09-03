// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      return true;
    },
    async session({ session, token, user }) {
      session.user.email = token.email;
      session.user.name = token.name;
      return session;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
};

// **Wichtig für App Router**
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
