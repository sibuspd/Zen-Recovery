import "@/app/ui/global.css"
import { inter } from "./ui/fonts";
import { Metadata } from "next";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}

// META DATA OBJECT
export const metadata: Metadata = {
  title: {
    template: "%s | Zen Recovery",
   default: "Zen Recovery Dashboard",
  },
  description: "List of all Loans and Payments related to Paathshala",
  metadataBase: new URL('https://zen-recovery-dashboard.vercel.app/'),
}