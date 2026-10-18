import React, { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { TabBar } from "@/components/TabBar";
import { PageDecor } from "@/components/illustrations";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col bg-[var(--bg)] text-[var(--ink)]">
      <PageDecor corners={["tr", "bl"]} />
      <Suspense fallback={<header className="topbar hidden md:flex" />}>
        <AppHeader />
      </Suspense>
      <Suspense fallback={<header className="m-header md:hidden" />}>
        <MobileHeader />
      </Suspense>
      <main className="flex-1 relative z-10 w-full flex flex-col">{children}</main>
      <Suspense fallback={<nav className="tabbar md:hidden" />}>
        <TabBar />
      </Suspense>
    </div>
  );
}
