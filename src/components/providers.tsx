"use client";

import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { GrokBot } from "@/components/chat/grok-bot";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider delayDuration={200}>
        {children}
        <GrokBot />
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
