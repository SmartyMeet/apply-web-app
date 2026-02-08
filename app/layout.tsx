import type { Metadata } from "next";
import { AmplifyProvider } from "@/components/AmplifyProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartyTalent - Apply for a Position",
  description: "Apply for open positions through SmartyTalent. Submit your CV, cover letter, and personal details to start your career journey with top employers.",
  applicationName: "SmartyTalent Apply",
  keywords: ["job application", "apply", "career", "recruitment", "SmartyTalent", "CV", "resume"],
  authors: [{ name: "SmartyTalent" }],
  icons: {
    icon: [
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AmplifyProvider>{children}</AmplifyProvider>
      </body>
    </html>
  );
}
