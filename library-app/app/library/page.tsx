'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import Layout from '../components/layout'
import BookCover from '../components/book-cover'
import { searchBooks } from '../actions/books'
import debounce from 'lodash/debounce'

interface FormattedBook {
  id: string
  title: string
  author: string
  genre: string
  cover: string
  bookshelves: string[]
}

export default function LibrarySearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [books, setBooks] = useState<FormattedBook[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchTerm = searchParams.get('search') || ''
  const filter = (searchParams.get('filter') || 'title') as 'title' | 'author' | 'genre'

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term: string, filterType: 'title' | 'author' | 'genre') => {
      try {
        setLoading(true)
        const result = await searchBooks(term, filterType)
        
        if (result.error) {
          setError(result.error)
          setBooks([])
        } else {
          // Format books for display
          const formattedBooks: FormattedBook[] = result.books?.map(book => ({
            id: book.id,
            title: book.title,
            author: book.authors?.[0]?.name || 'Unknown Author',
            genre: book.genres?.[0]?.name || 'Uncategorized',
            cover: `/api/fetch-book-cover?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.authors?.[0]?.name || '')}`,
            bookshelves: book.bookshelves?.map(shelf => shelf.name) || []
          })) || []
          
          setBooks(formattedBooks)
          setError(null)
        }
      } catch (err) {
        setError('Error searching books')
        setBooks([])
      } finally {
        setLoading(false)
      }
    }, 300),
    []
  )

  // Effect to handle search
  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm, filter)
    } else {
      // Load all books when no search term
      debouncedSearch('', 'title')
    }

    return () => {
      debouncedSearch.cancel()
    }
  }, [searchTerm, filter, debouncedSearch])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const searchValue = formData.get('search') as string
    const filterValue = formData.get('filter') as 'title' | 'author' | 'genre'

    const params = new URLSearchParams()
    if (searchValue) params.set('search', searchValue)
    if (filterValue) params.set('filter', filterValue)

    router.push(`/library?${params.toString()}`)
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-800 dark:text-white">My Library</h1>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-amber-500 dark:border-indigo-500">
            <input
              type="text"
              name="search"
              placeholder="Search for books..."
              defaultValue={searchTerm}
              className="flex-grow p-3 bg-transparent text-gray-800 dark:text-white focus:outline-none"
            />
            <select
              name="filter"
              className="p-3 bg-amber-100 dark:bg-gray-700 text-gray-800 dark:text-white border-l-2 border-amber-500 dark:border-indigo-500 focus:outline-none"
              defaultValue={filter}
            >
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="genre">Genre</option>
            </select>
            <button type="submit" className="p-3 bg-amber-400 dark:bg-indigo-600 text-gray-800 dark:text-white hover:bg-amber-300 dark:hover:bg-indigo-500 transition-colors duration-200">
              <Search size={24} />
            </button>
          </div>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-300">Searching books...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Books Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            {books.map((book) => (
              <div key={book.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-2 border-amber-500 dark:border-indigo-500">
                <BookCover src={book.cover} alt={book.title} />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white">{book.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{book.author}</p>
                  <p className="text-amber-600 dark:text-indigo-400">{book.genre}</p>
                  {book.bookshelves.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Bookshelves:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {book.bookshelves.map((shelf, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 text-xs rounded-full bg-amber-100 dark:bg-indigo-900 text-amber-800 dark:text-indigo-200"
                          >
                            {shelf}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && books.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-300">
              {searchTerm 
                ? `No books found matching "${searchTerm}" in ${filter}.` 
                : 'No books found in your library.'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}

