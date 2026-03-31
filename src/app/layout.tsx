import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AuthButton } from "@/components/AuthButton";
import { StackedLayout } from "@/components/catalyst/stacked-layout";
import {
  Navbar,
  NavbarSection,
  NavbarSpacer,
  NavbarItem,
} from "@/components/catalyst/navbar";

const inter = Inter({
  variable: "--font-inter",
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let dbUser: { providerUsername: string } | null = null;
  if (user) {
    dbUser = await prisma.user.findFirst({
      where: { supabaseAuthId: user.id },
      select: { providerUsername: true },
    });
  }

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white dark:bg-zinc-900 font-[family-name:var(--font-inter)]">
        <StackedLayout
          navbar={
            <Navbar>
              <NavbarSection>
                <NavbarItem href="/" className="font-bold text-lg">
                  Stacklist
                </NavbarItem>
              </NavbarSection>
              <NavbarSpacer />
              <NavbarSection>
                <AuthButton user={dbUser} />
              </NavbarSection>
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
