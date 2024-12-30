'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Camera, Book, Settings, ChevronRight } from 'lucide-react'
import Layout from '../components/layout'

export default function ProfilePage() {
  const [user, setUser] = useState({
    name: 'Jane Bookworm',
    email: 'jane@example.com',
    totalBooks: 142,
    profilePicture: '/placeholder.svg'
  })

  const recentBooks = [
    { id: 1, title: 'Neuromancer', author: 'William Gibson', cover: '/placeholder.svg' },
    { id: 2, title: 'Snow Crash', author: 'Neal Stephenson', cover: '/placeholder.svg' },
    { id: 3, title: 'Cryptonomicon', author: 'Neal Stephenson', cover: '/placeholder.svg' },
    { id: 4, title: 'The Diamond Age', author: 'Neal Stephenson', cover: '/placeholder.svg' },
  ]

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-800 dark:text-white">User Profile</h1>
        
        {/* Profile Picture Section */}
        <section className="mb-12">
          <div className="flex items-center justify-center">
            <div className="relative">
              <Image
                src={user.profilePicture}
                alt="Profile Picture"
                width={200}
                height={200}
                className="rounded-full border-4 border-amber-500 dark:border-indigo-500"
              />
              <button className="absolute bottom-0 right-0 bg-amber-400 dark:bg-indigo-600 text-gray-800 dark:text-white p-2 rounded-full hover:bg-amber-300 dark:hover:bg-indigo-500 transition-colors duration-200">
                <Camera size={24} />
              </button>
            </div>
          </div>
        </section>
        
        {/* User Details Section */}
        <section className="mb-12 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-2 border-amber-500 dark:border-indigo-500">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">User Details</h2>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Name</label>
              <p className="text-lg text-gray-800 dark:text-white">{user.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Email</label>
              <p className="text-lg text-gray-800 dark:text-white">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Total Books Uploaded</label>
              <p className="text-lg text-gray-800 dark:text-white">{user.totalBooks}</p>
            </div>
          </div>
        </section>
        
        {/* Recently Uploaded Books Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Recently Uploaded Books</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {recentBooks.map((book) => (
              <div key={book.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-2 border-amber-500 dark:border-indigo-500">
                <Image src={book.cover} alt={book.title} width={300} height={400} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white">{book.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{book.author}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Settings Section */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-2 border-amber-500 dark:border-indigo-500">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Account Settings</h2>
          <ul className="space-y-2">
            {['Notification Preferences', 'Privacy Settings', 'Change Password', 'Connected Accounts'].map((setting, index) => (
              <li key={index}>
                <button className="w-full text-left py-2 px-4 rounded-lg hover:bg-amber-100 dark:hover:bg-indigo-900 transition-colors duration-200 flex justify-between items-center">
                  <span className="text-gray-800 dark:text-white">{setting}</span>
                  <ChevronRight className="text-gray-400" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Layout>
  )
}

