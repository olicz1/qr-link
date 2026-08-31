import type { Metadata } from "next";
import { Noto_Sans_SC, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const notoSans = Noto_Sans_SC({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "码柜 PayCase — WeChat mini program demo",
  description:
    "Upload payment QR codes, tap the gallery to open a WeChat-style pay sheet, a promo page, or decoded text.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      className={`${notoSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#121a16] text-[#191919]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
