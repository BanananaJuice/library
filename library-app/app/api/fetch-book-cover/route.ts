import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Cache duration in seconds (24 hours)
const CACHE_DURATION = 86400

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title')
    const author = searchParams.get('author')

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Create cache key
    const cacheKey = `cover:${title}:${author || ''}`
    
    // Check Supabase cache first
    const supabase = createClient()
    const { data: cachedCover } = await supabase
      .from('cover_cache')
      .select('cover_url, updated_at')
      .eq('cache_key', cacheKey)
      .single()

    // If we have a valid cached cover that's less than 24 hours old, return it
    if (cachedCover) {
      const cacheAge = Date.now() - new Date(cachedCover.updated_at).getTime()
      if (cacheAge < CACHE_DURATION * 1000) {
        return NextResponse.json({ coverUrl: cachedCover.cover_url })
      }
    }

    // If no cache or expired, fetch from Google Books API
    const query = `${title}${author ? ` ${author}` : ''}`
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${process.env.GOOGLE_BOOKS_API_KEY}`

    const response = await fetch(url, {
      next: { revalidate: CACHE_DURATION }
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch from Google Books API')
    }

    // Get the first book's cover image
    const book = data.items?.[0]
    const coverUrl = book?.volumeInfo?.imageLinks?.thumbnail || null

    // If we found a cover URL, modify it to use HTTPS and cache it
    const secureUrl = coverUrl ? coverUrl.replace('http://', 'https://') : null
    
    if (secureUrl) {
      // Update cache in Supabase
      await supabase
        .from('cover_cache')
        .upsert({
          cache_key: cacheKey,
          cover_url: secureUrl,
          updated_at: new Date().toISOString()
        })
    }

    return NextResponse.json({ coverUrl: secureUrl })
  } catch (error) {
    console.error('Error fetching book cover:', error)
    return NextResponse.json(
      { error: 'Failed to fetch book cover' },
      { status: 500 }
    )
  }
} 