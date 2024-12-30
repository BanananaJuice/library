'use server'

import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'
import { currentUser } from "@clerk/nextjs/server"

interface SaveBookParams {
  title: string
  author: string
  genre: string
  bookshelfId?: string
}

interface Bookshelf {
  id: string
  name: string
  description: string
}

interface Book {
  id: string
  title: string
  authors?: Array<{ name: string }>
  genres?: Array<{ name: string }>
  bookshelves?: Array<{ name: string }>
}

interface SearchBooksResult {
  success: boolean
  books?: Book[]
  error?: string
}

interface BookshelfBook {
  book: {
    id: string
    title: string
    authors: Array<{ name: string }>
    genres: Array<{ name: string }>
  }
}

interface BookWithRelations {
  id: string
  title: string
  author: {
    name: string
  }
  genre: {
    name: string
  }
}

interface BookshelfBookWithRelations {
  books: BookWithRelations
}

interface BookshelfBookResponse {
  book: {
    id: string;
    title: string;
    authors: Array<{ name: string }>;
  }
}

interface DatabaseBook {
  id: string
  title: string
  author: { name: string } | null
  genre: { name: string } | null
  bookshelves: Array<{ bookshelf: { name: string } }> | null
}

export async function getBookshelves(): Promise<{ 
  success: boolean
  bookshelves?: Bookshelf[]
  error?: string 
}> {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = createClient()
    const { data: bookshelves, error } = await supabase
      .from('bookshelves')
      .select('id, name, description')
      .eq('user_id', user.id)
      .order('name')

    if (error) throw error

    return { success: true, bookshelves }
  } catch (error) {
    console.error('Error fetching bookshelves:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }
  }
}

export async function createBookshelf(name: string, description: string): Promise<{
  success: boolean
  bookshelf?: Bookshelf
  error?: string
}> {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = createClient()
    const { data: bookshelf, error } = await supabase
      .from('bookshelves')
      .insert({ 
        user_id: user.id,
        name,
        description
      })
      .select('id, name, description')
      .single()

    if (error) throw error

    return { success: true, bookshelf }
  } catch (error) {
    console.error('Error creating bookshelf:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }
  }
}

export async function saveBook({ title, author, genre, bookshelfId }: SaveBookParams): Promise<{ 
  success: boolean
  error?: string
  bookId?: string
}> {
  try {
    console.log('Starting saveBook server action')
    const user = await currentUser()
    console.log('Current user check result:', { 
      exists: !!user, 
      id: user?.id,
      primaryEmailAddress: user?.primaryEmailAddress,
    })
    
    if (!user) {
      console.error('No authenticated user found')
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = createClient()
    console.log('Supabase client created')

    // 1. Find or create author
    console.log('Finding or creating author:', author)
    let authorId: string
    const { data: existingAuthor } = await supabase
      .from('authors')
      .select('id')
      .eq('name', author)
      .single()

    if (existingAuthor) {
      authorId = existingAuthor.id
      console.log('Found existing author:', authorId)
    } else {
      const { data: newAuthor, error: authorError } = await supabase
        .from('authors')
        .insert({ name: author })
        .select('id')
        .single()

      if (authorError) {
        console.error('Error creating author:', authorError)
        throw authorError
      }
      authorId = newAuthor.id
      console.log('Created new author:', authorId)
    }

    // 2. Find or create genre
    console.log('Finding or creating genre:', genre)
    let genreId: string
    const { data: existingGenre } = await supabase
      .from('genres')
      .select('id')
      .eq('name', genre)
      .single()

    if (existingGenre) {
      genreId = existingGenre.id
      console.log('Found existing genre:', genreId)
    } else {
      const { data: newGenre, error: genreError } = await supabase
        .from('genres')
        .insert({ name: genre })
        .select('id')
        .single()

      if (genreError) {
        console.error('Error creating genre:', genreError)
        throw genreError
      }
      genreId = newGenre.id
      console.log('Created new genre:', genreId)
    }

    // 3. Get bookshelf ID (use provided or find/create default)
    console.log('Getting bookshelf ID')
    let finalBookshelfId: string
    
    if (bookshelfId) {
      // Verify the bookshelf exists and belongs to the user
      const { data: existingBookshelf, error: verifyError } = await supabase
        .from('bookshelves')
        .select('id')
        .eq('id', bookshelfId)
        .eq('user_id', user.id)
        .single()

      if (verifyError || !existingBookshelf) {
        throw new Error('Invalid bookshelf selected')
      }
      finalBookshelfId = bookshelfId
    } else {
      // Find or create default bookshelf
      const { data: defaultBookshelf } = await supabase
        .from('bookshelves')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', 'Default')
        .single()

      if (defaultBookshelf) {
        finalBookshelfId = defaultBookshelf.id
      } else {
        const { data: newBookshelf, error: createError } = await supabase
          .from('bookshelves')
          .insert({ 
            user_id: user.id,
            name: 'Default',
            description: 'Default bookshelf'
          })
          .select('id')
          .single()

        if (createError) throw createError
        finalBookshelfId = newBookshelf.id
      }
    }

    // 4. Create the book
    console.log('Creating book entry')
    const { data: book, error: bookError } = await supabase
      .from('books')
      .insert({
        title,
        author_id: authorId,
        genre_id: genreId,
      })
      .select('id')
      .single()

    if (bookError) {
      console.error('Error creating book:', bookError)
      throw bookError
    }

    // 5. Add book to bookshelf
    console.log('Adding book to bookshelf')
    const { error: bookshelfBookError } = await supabase
      .from('bookshelf_books')
      .insert({
        book_id: book.id,
        bookshelf_id: finalBookshelfId,
      })

    if (bookshelfBookError) {
      console.error('Error adding book to bookshelf:', bookshelfBookError)
      throw bookshelfBookError
    }

    return { success: true, bookId: book.id }
  } catch (error) {
    console.error('Error in saveBook:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }
  }
}

export async function searchBooks(
  searchTerm: string,
  filterBy: 'title' | 'author' | 'genre' = 'title'
): Promise<SearchBooksResult> {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('books')
      .select(`
        id,
        title,
        author:authors!books_author_id_fkey (
          name
        ),
        genre:genres!books_genre_id_fkey (
          name
        ),
        bookshelves:bookshelf_books!inner (
          bookshelf:bookshelves (
            name
          )
        )
      `)
      .eq('bookshelf_books.bookshelves.user_id', user.id)
      .ilike(
        filterBy === 'title' ? 'title' : 
        filterBy === 'author' ? 'authors.name' : 
        'genres.name',
        searchTerm ? `%${searchTerm}%` : '%'
      )

    if (error) {
      console.error('Supabase query error:', error)
      throw error
    }

    if (!data) {
      return { success: true, books: [] }
    }

    // Safely type the response data
    const books = data as unknown as DatabaseBook[]

    // Transform the data to match the expected format
    const transformedBooks: Book[] = books.map(book => ({
      id: book.id,
      title: book.title,
      authors: book.author ? [{ name: book.author.name }] : [],
      genres: book.genre ? [{ name: book.genre.name }] : [],
      bookshelves: book.bookshelves?.map(b => ({ name: b.bookshelf.name })) || []
    }))

    return { success: true, books: transformedBooks }
  } catch (error) {
    console.error('Error searching books:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search books'
    }
  }
}

export async function deleteBook(bookId: string): Promise<{ 
  success: boolean
  error?: string 
}> {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = createClient()

    // Delete the book - this will cascade to bookshelf_books
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', bookId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error deleting book:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }
  }
} 