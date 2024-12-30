import './globals.css'
import { VT323 } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { ClerkProvider } from '@clerk/nextjs'

const vt323 = VT323({ weight: '400', subsets: ['latin'] })

export const metadata = {
  title: 'BookTrack - Manage Your Book Inventory',
  description: 'Upload photos of your bookshelves and manage your book collection with ease.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={vt323.className} suppressHydrationWarning>
        <ClerkProvider>
          {children}
          <Toaster position="top-right" />
        </ClerkProvider>
      </body>
    </html>
  )
}

