import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ReactScan } from "@/components/react-scan-component"

import "./globals.css"
import ReactQueryProvider from "@/components/provider/react-query-provider"
import ReduxProvider from "@/components/provider/redux-provider"
import { Toaster } from "@/components/ui/sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Orchestronic",
  description:
    "Orchestronic is an Internal Developer Platform that streamlines and automates cloud resource provisioning. Developers can request VMs, databases, and storage, while approval workflows ensure governance by project managers and IT operations.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <ReactScan />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>
          <ReactQueryProvider>{children}</ReactQueryProvider>
        </ReduxProvider>
        <Toaster />
      </body>
    </html>
  )
}
