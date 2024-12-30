'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { Upload, Plus } from 'lucide-react'
import Layout from '../components/layout'
import { saveBook, getBookshelves, createBookshelf } from '../actions/books'
import { useUser } from '@clerk/nextjs'
import { toast } from 'react-hot-toast'
import { redirect } from 'next/navigation'

interface BookInfo {
  title: string
  author: string
  genre: string
  coverUrl?: string
  isEditing?: boolean
  bookshelfId?: string
}

interface Bookshelf {
  id: string
  name: string
  description: string
}

export default function BookUploadPage() {
  const { user, isLoaded } = useUser()
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle')
  const [bookPreview, setBookPreview] = useState<{ title: string; author: string; genre: string; cover: string; bookshelfId?: string } | null>(null)
  const [extractedText, setExtractedText] = useState<string>('')
  const [detectedBooks, setDetectedBooks] = useState<BookInfo[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingAll, setIsSavingAll] = useState(false)
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([])
  const [isCreatingBookshelf, setIsCreatingBookshelf] = useState(false)
  const [newBookshelfName, setNewBookshelfName] = useState('')
  const [newBookshelfDescription, setNewBookshelfDescription] = useState('')

  useEffect(() => {
    const loadBookshelves = async () => {
      const result = await getBookshelves()
      if (result.success && result.bookshelves) {
        setBookshelves(result.bookshelves)
      }
    }
    if (user) {
      loadBookshelves()
    }
  }, [user])

  const handleCreateBookshelf = async () => {
    if (!newBookshelfName.trim()) {
      toast.error('Please enter a bookshelf name')
      return
    }

    try {
      const result = await createBookshelf(
        newBookshelfName.trim(),
        newBookshelfDescription.trim()
      )

      if (result.success && result.bookshelf) {
        setBookshelves(prev => [...prev, result.bookshelf as Bookshelf])
        setIsCreatingBookshelf(false)
        setNewBookshelfName('')
        setNewBookshelfDescription('')
        toast.success('Bookshelf created successfully!')
      } else {
        toast.error(result.error || 'Failed to create bookshelf')
      }
    } catch (error) {
      toast.error('Failed to create bookshelf')
    }
  }

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-xl text-gray-600 dark:text-gray-300">Loading...</div>
          </div>
        </div>
      </Layout>
    )
  }

  // Redirect if not authenticated
  if (!user) {
    redirect('/sign-in')
  }

  const handleSaveToLibrary = async () => {
    if (!user || !bookPreview) return

    try {
      setIsSaving(true)
      console.log('Starting save process with book:', { 
        title: bookPreview.title, 
        author: bookPreview.author, 
        genre: bookPreview.genre,
        bookshelfId: bookPreview.bookshelfId
      })
      
      console.log('Calling saveBook function with processed data')
      const result = await saveBook({
        title: bookPreview.title,
        author: bookPreview.author,
        genre: bookPreview.genre,
        bookshelfId: bookPreview.bookshelfId
      })

      console.log('Save book result:', result)

      if (result.success) {
        toast.success('Book saved to library!')
        // Reset the form
        setUploadProgress(0)
        setUploadStatus('idle')
        setBookPreview(null)
        setExtractedText('')
        setDetectedBooks([])
      } else {
        console.error('Failed to save book with error:', result.error)
        toast.error(result.error || 'Failed to save book')
      }
    } catch (error) {
      console.error('Error saving book:', error)
      if (error instanceof Error) {
        console.error('Error details:', error.message)
        console.error('Error stack:', error.stack)
      }
      toast.error('Failed to save book')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAllBooks = async () => {
    if (!user || detectedBooks.length === 0) return

    try {
      setIsSavingAll(true)
      
      const results = await Promise.all(
        detectedBooks.map(book => 
          saveBook({
            title: book.title,
            author: book.author,
            genre: book.genre,
            bookshelfId: book.bookshelfId
          })
        )
      )

      const allSuccessful = results.every(result => result.success)
      
      if (allSuccessful) {
        toast.success('All books saved to library!')
        // Reset the form
        setUploadProgress(0)
        setUploadStatus('idle')
        setBookPreview(null)
        setExtractedText('')
        setDetectedBooks([])
      } else {
        const failedCount = results.filter(result => !result.success).length
        toast.error(`Failed to save ${failedCount} books`)
      }
    } catch (error) {
      console.error('Error saving all books:', error)
      toast.error('Failed to save books')
    } finally {
      setIsSavingAll(false)
    }
  }

  const handleEditBook = (index: number, field: 'title' | 'author' | 'genre', value: string) => {
    setDetectedBooks(prevBooks => {
      const newBooks = [...prevBooks]
      newBooks[index] = { ...newBooks[index], [field]: value }
      return newBooks
    })

    // Update preview if this book is currently selected
    if (bookPreview && 
        bookPreview.title === detectedBooks[index].title && 
        bookPreview.author === detectedBooks[index].author) {
      setBookPreview(prev => prev ? { ...prev, [field]: value } : null)
    }
  }

  const fetchBookCover = async (title: string, author: string) => {
    try {
      const response = await fetch(
        `/api/fetch-book-cover?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`
      )
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch book cover')
      }
      
      return data.coverUrl
    } catch (error) {
      console.error('Error fetching book cover:', error)
      return null
    }
  }

  const analyzeTextWithGPT = async (text: string) => {
    try {
      const response = await fetch('/api/analyze-books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze text')
      }

      // Fetch covers for all detected books
      const booksWithCovers = await Promise.all(
        data.books.map(async (book: BookInfo) => ({
          ...book,
          coverUrl: await fetchBookCover(book.title, book.author)
        }))
      )

      setDetectedBooks(booksWithCovers)
      
      // Set the first book as preview if available
      if (booksWithCovers.length > 0) {
        setBookPreview({
          title: booksWithCovers[0].title,
          author: booksWithCovers[0].author,
          genre: booksWithCovers[0].genre,
          cover: booksWithCovers[0].coverUrl || ''
        })
      }
    } catch (error) {
      console.error('Book Analysis Error:', error)
    }
  }

  const processImageWithVision = async (file: File) => {
    try {
      setUploadStatus('processing')

      // Create form data
      const formData = new FormData()
      formData.append('file', file)

      // Send to our API endpoint
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process image')
      }

      console.log('Extracted Text:', data.text)
      setExtractedText(data.text)

      // Analyze the extracted text with ChatGPT
      await analyzeTextWithGPT(data.text)

      setUploadStatus('success')
    } catch (error) {
      console.error('Vision API Error:', error)
      setUploadStatus('error')
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setUploadStatus('uploading')
      setUploadProgress(0)
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(interval)
            // Start Vision API processing after upload
            processImageWithVision(file)
            return 100
          }
          return prevProgress + 10
        })
      }, 200)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1
  })

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-800 dark:text-white">Upload Book Cover</h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 border-2 border-amber-500 dark:border-indigo-500">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
              isDragActive ? 'border-amber-500 dark:border-indigo-500 bg-amber-100 dark:bg-indigo-900' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Drag & drop a book cover image here, or click to select a file
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Supported formats: PNG, JPG, JPEG
            </p>
          </div>

          {uploadStatus !== 'idle' && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {uploadStatus === 'uploading' ? 'Uploading...' : 
                   uploadStatus === 'processing' ? 'Processing OCR...' :
                   uploadStatus === 'success' ? 'Processing complete' : 'Processing failed'}
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {uploadStatus === 'processing' ? 'OCR' : `${uploadProgress}%`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div 
                  className={`h-2.5 rounded-full ${
                    uploadStatus === 'success' ? 'bg-green-600' : 
                    uploadStatus === 'error' ? 'bg-red-600' : 
                    'bg-amber-500 dark:bg-indigo-500'
                  }`}
                  style={{ width: uploadStatus === 'processing' ? '100%' : `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Detected Books Table */}
        {detectedBooks.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 border-2 border-amber-500 dark:border-indigo-500">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Detected Books</h2>
              <button
                onClick={handleSaveAllBooks}
                disabled={isSavingAll}
                className={`px-4 py-2 bg-amber-500 dark:bg-indigo-600 text-white rounded-lg 
                  ${isSavingAll ? 'opacity-50 cursor-not-allowed' : 'hover:bg-amber-600 dark:hover:bg-indigo-700'} 
                  transition-colors duration-200`}
              >
                {isSavingAll ? 'Saving All...' : 'Save All Books'}
              </button>
            </div>

            {/* Bookshelf Creation UI */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <button
                  onClick={() => setIsCreatingBookshelf(!isCreatingBookshelf)}
                  className="flex items-center space-x-1 text-amber-500 dark:text-indigo-400 hover:text-amber-600 dark:hover:text-indigo-500"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Bookshelf</span>
                </button>
              </div>

              {isCreatingBookshelf && (
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bookshelf Name
                      </label>
                      <input
                        type="text"
                        value={newBookshelfName}
                        onChange={(e) => setNewBookshelfName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 dark:focus:ring-indigo-500 bg-white dark:bg-gray-800"
                        placeholder="Enter bookshelf name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={newBookshelfDescription}
                        onChange={(e) => setNewBookshelfDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 dark:focus:ring-indigo-500 bg-white dark:bg-gray-800"
                        placeholder="Enter description (optional)"
                      />
                    </div>
                    <button
                      onClick={handleCreateBookshelf}
                      className="px-4 py-2 bg-amber-500 dark:bg-indigo-600 text-white rounded-lg hover:bg-amber-600 dark:hover:bg-indigo-700 transition-colors duration-200"
                    >
                      Create Bookshelf
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Author
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Genre
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Bookshelf
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {detectedBooks.map((book, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <input
                          type="text"
                          value={book.title}
                          onChange={(e) => handleEditBook(index, 'title', e.target.value)}
                          className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-amber-500 dark:focus:border-indigo-500 outline-none"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <input
                          type="text"
                          value={book.author}
                          onChange={(e) => handleEditBook(index, 'author', e.target.value)}
                          className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-amber-500 dark:focus:border-indigo-500 outline-none"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <input
                          type="text"
                          value={book.genre}
                          onChange={(e) => handleEditBook(index, 'genre', e.target.value)}
                          className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-amber-500 dark:focus:border-indigo-500 outline-none"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <select
                          value={book.bookshelfId || ''}
                          onChange={(e) => {
                            const newBooks = [...detectedBooks]
                            newBooks[index] = { ...newBooks[index], bookshelfId: e.target.value }
                            setDetectedBooks(newBooks)
                            if (bookPreview && 
                                bookPreview.title === book.title && 
                                bookPreview.author === book.author) {
                              setBookPreview(prev => prev ? { ...prev, bookshelfId: e.target.value } : null)
                            }
                          }}
                          className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-amber-500 dark:focus:border-indigo-500 outline-none"
                        >
                          <option value="">Select Bookshelf</option>
                          {bookshelves.map(shelf => (
                            <option key={shelf.id} value={shelf.id}>
                              {shelf.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 flex items-center space-x-4">
                        {book.coverUrl && (
                          <Image
                            src={book.coverUrl}
                            alt={`Cover of ${book.title}`}
                            width={40}
                            height={60}
                            className="rounded shadow-sm"
                          />
                        )}
                        <button 
                          onClick={() => setBookPreview({
                            title: book.title,
                            author: book.author,
                            genre: book.genre,
                            cover: book.coverUrl || '',
                            bookshelfId: book.bookshelfId
                          })}
                          className="text-amber-500 dark:text-indigo-400 hover:text-amber-600 dark:hover:text-indigo-500"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {bookPreview && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 border-2 border-amber-500 dark:border-indigo-500">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Book Preview</h2>
            <div className="flex flex-col md:flex-row items-start md:items-center">
              {bookPreview.cover ? (
                <Image 
                  src={bookPreview.cover}
                  alt={`Cover of ${bookPreview.title}`}
                  width={150}
                  height={225}
                  className="rounded-lg shadow-md mb-4 md:mb-0 md:mr-6 object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-[150px] h-[225px] bg-gray-200 dark:bg-gray-700 rounded-lg shadow-md mb-4 md:mb-0 md:mr-6 flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400">No cover available</span>
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">{bookPreview.title}</p>
                <p className="text-md text-gray-600 dark:text-gray-300">by {bookPreview.author}</p>
                <p className="text-md text-gray-600 dark:text-gray-300">Genre: {bookPreview.genre}</p>
                {extractedText && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Extracted Text:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-h-40 overflow-y-auto">
                      {extractedText}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={handleSaveToLibrary}
              disabled={isSaving || !bookPreview}
              className={`mt-6 px-4 py-2 bg-amber-500 dark:bg-indigo-600 text-white rounded-lg 
                ${isSaving || !bookPreview 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-amber-600 dark:hover:bg-indigo-700'} 
                transition-colors duration-200`}
            >
              {isSaving ? 'Saving...' : 'Save to Library'}
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}

