import type { Metadata } from 'next'
import { Share_Tech_Mono } from 'next/font/google'
import './globals.css'

const shareTechMono = Share_Tech_Mono({
  subsets: ['latin'],
  weight: '400',
})

export const metadata: Metadata = {
  title: 'L-AMB Sequencer / Synth - LFO',
  description: 'Synth LFO with duty cycle',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={shareTechMono.className}>
      <body>{children}</body>
    </html>
  )
}
