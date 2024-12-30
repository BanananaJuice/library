'use server'

import { createClient } from '@/lib/supabase/server'
import { currentUser } from "@clerk/nextjs/server"
import OpenAI from 'openai'

interface BookRecommendation {
  id: string
  title: string
  author: string
  cover: string
}

interface UserBook {
  title: string
  author: string
  genre: string
}

interface BookData {
  books: {
    title: string
    author: {
      name: string
    }
    genre: {
      name: string
    }
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function fetchGoogleBookCover(title: string, author: string): Promise<string> {
  try {
    const query = `${title} ${author}`.replace(/\s+/g, '+')
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${process.env.GOOGLE_BOOKS_API_KEY}`
    )
    const data = await response.json()

    if (data.items && data.items[0]?.volumeInfo?.imageLinks?.thumbnail) {
      return data.items[0].volumeInfo.imageLinks.thumbnail
    }
    
    return '/placeholder.svg'
  } catch (error) {
    console.error('Error fetching book cover:', error)
    return '/placeholder.svg'
  }
}

export async function getRecommendations(): Promise<{
  success: boolean
  data?: BookRecommendation[]
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

    // Get user's books with their genres and authors
    const { data: userBooks, error: booksError } = await supabase
      .from('bookshelf_books')
      .select(`
        books (
          title,
          author:authors (
            name
          ),
          genre:genres (
            name
          )
        )
      `)
      .in('bookshelf_id', bookshelves.map(b => b.id)) as { data: BookData[] | null, error: any }

    if (booksError) throw booksError

    // Format books for ChatGPT prompt
    const formattedBooks = userBooks
      ?.map(item => ({
        title: item.books?.title || '',
        author: item.books?.author?.name || '',
        genre: item.books?.genre?.name || ''
      }))
      .filter(book => book.title && book.author) as UserBook[]

    if (!formattedBooks.length) {
      return { success: true, data: [] }
    }

    // Create ChatGPT prompt
    const prompt = `Based on the following books in the user's library:
${formattedBooks.map(book => `- "${book.title}" by ${book.author} (${book.genre})`).join('\n')}

Please recommend 3 books they might enjoy. Consider the genres, themes, and writing styles of their current books.
Return your response in this exact JSON format:
{
  "recommendations": [
    {"title": "Book Title 1", "author": "Author Name 1"},
    {"title": "Book Title 2", "author": "Author Name 2"},
    {"title": "Book Title 3", "author": "Author Name 3"}
  ]
}`

    // Get recommendations from ChatGPT
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No recommendations received from ChatGPT')
    }

    const parsedResponse = JSON.parse(content)
    if (!parsedResponse.recommendations || !Array.isArray(parsedResponse.recommendations)) {
      throw new Error('Invalid recommendations format received from ChatGPT')
    }

    // Fetch book covers from Google Books API
    const recommendationsWithCovers = await Promise.all(
      parsedResponse.recommendations.map(async (book: { title: string, author: string }) => {
        const cover = await fetchGoogleBookCover(book.title, book.author)
        return {
          id: `${book.title}-${book.author}`.replace(/\s+/g, '-').toLowerCase(),
          title: book.title,
          author: book.author,
          cover
        }
      })
    )

    return { success: true, data: recommendationsWithCovers }
  } catch (error) {
    console.error('Error getting recommendations:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }
  }
} 