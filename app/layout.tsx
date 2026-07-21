import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agent LLM Christmas — Web3 & DeFi Agent Showcase',
  description: 'Agentic workspace and OSS toolkit showcase powered by LLM.Christmas gateway',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
