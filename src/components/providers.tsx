"use client";

import { PayCaseProvider } from "@/lib/store";
import { MiniAppShell } from "@/components/wechat/MiniAppShell";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PayCaseProvider>
      <MiniAppShell>{children}</MiniAppShell>
    </PayCaseProvider>
  );
}
