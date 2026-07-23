import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DeFi Agent — Live Web3 Tools',
  description: 'DeFi Agent showcase on defiagent.llm.christmas — live package tools via tools.defiagent.llm.christmas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
