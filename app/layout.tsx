import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shaheen',
  description: 'Secure File Sharing',

}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (


<html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon0.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
