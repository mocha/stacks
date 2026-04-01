import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
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
                <NavbarItem href="/build">Create a Stack</NavbarItem>
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
