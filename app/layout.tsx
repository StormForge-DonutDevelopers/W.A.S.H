import "./globals.css"
import { Fira_Sans } from 'next/font/google'

const fira_sans = Fira_Sans({ 
  subsets: ["latin"], 
  weight: "400"
});

export const metadata = {
  title: "WASH - Weekly Academic Schedule Helper",
  description: "Course planning and scheduling for SFU students",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={fira_sans.className}>{children}</body>
    </html>
  )
}