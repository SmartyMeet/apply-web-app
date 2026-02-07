import type { Metadata } from "next";
import { AmplifyProvider } from "@/components/AmplifyProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apply - Candidate Portal",
  description: "Submit your job application and join our team",
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
