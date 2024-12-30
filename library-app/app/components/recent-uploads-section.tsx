'use client'

import Image from 'next/image'
import { Trash2, Edit2, X } from 'lucide-react'
import { useEditMode } from './edit-mode-provider'
import { deleteBook } from '../actions/books'
import { useState } from 'react'

interface Book {
  id: string
  title: string
  author: string
  cover: string
}

interface RecentUploadsSectionProps {
  books: Book[]
}

export function RecentUploadsSection({ books }: RecentUploadsSectionProps) {
  const { isEditMode, setIsEditMode } = useEditMode()

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold font-mono text-gray-800 dark:text-white">Recent Uploads</h2>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 dark:bg-indigo-600 text-white hover:bg-amber-600 dark:hover:bg-indigo-700 transition-colors"
        >
          {isEditMode ? (
            <>
              <X className="w-4 h-4" />
              Done
            </>
          ) : (
            <>
              <Edit2 className="w-4 h-4" />
              Edit
            </>
          )}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {books.map((book) => (
          <div key={book.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-2 border-amber-500 dark:border-indigo-500 relative group">
            <Image 
              src={book.cover} 
              alt={book.title} 
              width={300} 
              height={400} 
              className="w-full h-48 object-cover"
              priority
            />
            <div className="p-4">
              <h3 className="font-semibold font-mono text-gray-800 dark:text-white">{book.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 font-mono">{book.author}</p>
            </div>
            {isEditMode && <DeleteButton bookId={book.id} />}
          </div>
        ))}
      </div>
    </section>
  )
}

function DeleteButton({ bookId }: { bookId: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (isDeleting) return
    
    if (!confirm('Are you sure you want to delete this book?')) return

    try {
      setIsDeleting(true)
      const result = await deleteBook(bookId)
      if (result.success) {
        // Refresh the page to show updated book list
        window.location.reload()
      } else {
        alert('Failed to delete book: ' + result.error)
      }
    } catch (error) {
      alert('An error occurred while deleting the book')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="absolute top-2 right-2 p-2 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Delete book"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
} 