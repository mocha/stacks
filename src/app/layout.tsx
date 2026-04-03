import type { Metadata } from "next";
import { Fira_Code } from "next/font/google";
import "./globals.css";
import { StackedLayout } from "@/components/catalyst/stacked-layout";
import {
  Navbar,
  NavbarSection,
  NavbarSpacer,
  NavbarItem,
} from "@/components/catalyst/navbar";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AuthButton } from "@/components/AuthButton";

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stacklist",
  description: "Claim your stack. There can be only one.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let dbUser: { providerUsername: string; avatarUrl: string | null } | null = null;
  if (user) {
    dbUser = await prisma.user.findFirst({
      where: { supabaseAuthId: user.id },
      select: { providerUsername: true, avatarUrl: true },
    });
  }

  return (
    <html lang="en" className={`${firaCode.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white dark:bg-zinc-900 ">
        <StackedLayout
          navbar={
            <Navbar>
              <NavbarSection>
                <NavbarItem href="/" className="font-bold text-lg">
                  Stacklist
                </NavbarItem>
              </NavbarSection>
              <NavbarSpacer />
              <div className="flex items-center gap-4">
                <a href="/build" className="text-sm font-medium text-zinc-950 dark:text-white hover:text-zinc-700 dark:hover:text-zinc-300">
                  Create a Stack
                </a>
                <AuthButton user={dbUser} />
              </div>
            </Navbar>
          }
          sidebar={<div />}
        >
          {children}
        </StackedLayout>
      </body>
    </html>
  );
}
