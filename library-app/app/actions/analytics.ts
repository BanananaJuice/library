'use server'

import { createClient } from '@/lib/supabase/server'
import { currentUser } from "@clerk/nextjs/server"

interface GenreCount {
  name: string
  value: number
}

interface AuthorCount {
  name: string
  books: number
}

interface BookGenre {
  books: {
    genre: {
      name: string
    } | null
  } | null
}

interface BookAuthor {
  books: {
    author: {
      name: string
    } | null
  } | null
}

interface TimelineData {
  month: string
  books: number
}

export async function getGenreAnalytics(): Promise<{ 
  success: boolean
  data?: GenreCount[]
  error?: string 
}> {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = createClient()

    // Get user's bookshelves
    const { data: bookshelves, error: bookshelfError } = await supabase
      .from('bookshelves')
      .select('id')
      .eq('user_id', user.id)

    if (bookshelfError) throw bookshelfError
    if (!bookshelves?.length) {
      return { success: true, data: [] }
    }

    // Count books by genre
    const { data: genreCounts, error: genreError } = await supabase
      .from('bookshelf_books')
      .select(`
        books (
          genre:genres (
            name
          )
        )
      `)
      .in('bookshelf_id', bookshelves.map(b => b.id)) as { data: BookGenre[] | null, error: any }

    if (genreError) throw genreError

    // Process the data to count genres
    const genreMap = new Map<string, number>()
    genreCounts?.forEach(item => {
      const genreName = item.books?.genre?.name
      if (genreName) {
        genreMap.set(genreName, (genreMap.get(genreName) || 0) + 1)
      }
    })

    const result = Array.from(genreMap.entries())
      .map(([name, value]) => ({
        name,
        value
      }))
      .sort((a, b) => b.value - a.value)

    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching genre analytics:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }
  }
}

export async function getAuthorAnalytics(): Promise<{ 
  success: boolean
  data?: AuthorCount[]
  error?: string 
}> {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = createClient()

    // Get user's bookshelves
    const { data: bookshelves, error: bookshelfError } = await supabase
      .from('bookshelves')
      .select('id')
      .eq('user_id', user.id)

    if (bookshelfError) throw bookshelfError
    if (!bookshelves?.length) {
      return { success: true, data: [] }
    }

    // Count books by author
    const { data: authorCounts, error: authorError } = await supabase
      .from('bookshelf_books')
      .select(`
        books (
          author:authors (
            name
          )
        )
      `)
      .in('bookshelf_id', bookshelves.map(b => b.id)) as { data: BookAuthor[] | null, error: any }

    if (authorError) throw authorError

    // Process the data to count authors
    const authorMap = new Map<string, number>()
    authorCounts?.forEach(item => {
      const authorName = item.books?.author?.name
      if (authorName) {
        authorMap.set(authorName, (authorMap.get(authorName) || 0) + 1)
      }
    })

    const result = Array.from(authorMap.entries())
      .map(([name, books]) => ({
        name,
        books
      }))
      .sort((a, b) => b.books - a.books)
      .slice(0, 5) // Get top 5 authors

    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching author analytics:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }
  }
}

export async function getBooksTimeline(): Promise<{ 
  success: boolean
  data?: TimelineData[]
  error?: string 
}> {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = createClient()

    // Get user's bookshelves
    const { data: bookshelves, error: bookshelfError } = await supabase
      .from('bookshelves')
      .select('id')
      .eq('user_id', user.id)

    if (bookshelfError) throw bookshelfError
    if (!bookshelves?.length) {
      return { success: true, data: [] }
    }

    // Get books with their added_at timestamps
    const { data: bookTimeline, error: timelineError } = await supabase
      .from('bookshelf_books')
      .select('added_at')
      .in('bookshelf_id', bookshelves.map(b => b.id))
      .order('added_at')

    if (timelineError) throw timelineError

    // Process the data to group by month
    const monthMap = new Map<string, number>()
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    bookTimeline?.forEach(item => {
      if (item.added_at) {
        const date = new Date(item.added_at)
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1)
      }
    })

    // Convert to array and sort by date
    const result = Array.from(monthMap.entries())
      .map(([month, books]) => ({
        month,
        books
      }))
      .sort((a, b) => {
        const [aMonth, aYear] = a.month.split(' ')
        const [bMonth, bYear] = b.month.split(' ')
        const yearDiff = parseInt(aYear) - parseInt(bYear)
        if (yearDiff !== 0) return yearDiff
        return monthNames.indexOf(aMonth) - monthNames.indexOf(bMonth)
      })
      .slice(-6) // Get last 6 months

    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching books timeline:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }
  }
} 