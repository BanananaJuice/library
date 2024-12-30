'use client'

import Link from 'next/link'
import { Book, BarChart2, User, Search, Upload } from 'lucide-react'
import { UserButton, SignInButton, SignedIn, SignedOut } from '@clerk/nextjs'
import DarkModeToggle from './dark-mode-toggle'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left side - Logo and main nav */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-2xl font-bold text-amber-500 dark:text-indigo-400">
                  BookTrack
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <SignedIn>
                  <Link
                    href="/library"
                    className="inline-flex items-center px-1 pt-1 text-gray-700 dark:text-gray-200 hover:text-amber-500 dark:hover:text-indigo-400"
                  >
                    <Book className="h-5 w-5 mr-1" />
                    Library
                  </Link>
                  <Link
                    href="/analytics"
                    className="inline-flex items-center px-1 pt-1 text-gray-700 dark:text-gray-200 hover:text-amber-500 dark:hover:text-indigo-400"
                  >
                    <BarChart2 className="h-5 w-5 mr-1" />
                    Analytics
                  </Link>
                  <Link
                    href="/upload"
                    className="inline-flex items-center px-1 pt-1 text-gray-700 dark:text-gray-200 hover:text-amber-500 dark:hover:text-indigo-400"
                  >
                    <Upload className="h-5 w-5 mr-1" />
                    Upload
                  </Link>
                </SignedIn>
              </div>
            </div>

            {/* Right side - Search and user menu */}
            <div className="flex items-center space-x-4">
              <SignedIn>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search books..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:focus:ring-indigo-500 focus:border-amber-500 dark:focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </SignedIn>

              <DarkModeToggle />

              <SignedOut>
                <SignInButton mode="modal">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-500 dark:bg-indigo-600 hover:bg-amber-600 dark:hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 dark:focus:ring-indigo-500">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>

              <SignedIn>
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10"
                    }
                  }}
                />
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main>{children}</main>
    </div>
  )
}

