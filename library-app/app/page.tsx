import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Layout from './components/layout'
import UploadButton from './components/upload-button'
import WelcomeMessage from './components/welcome-message'
import { createClient } from '@/lib/supabase/server'
import { getGenreAnalytics, getAuthorAnalytics } from './actions/analytics'
import { getRecommendations } from './actions/recommendations'
import { EditModeProvider } from './components/edit-mode-provider'
import { RecentUploadsSection } from './components/recent-uploads-section'

export default async function Home() {
  // Check authentication using Clerk
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  // Get user details from Clerk
  const user = await currentUser()
  const userName = user?.firstName || 'Reader'

  const supabase = createClient()

  // Fetch analytics data and recommendations
  const [genreResult, authorResult, recommendationsResult] = await Promise.all([
    getGenreAnalytics(),
    getAuthorAnalytics(),
    getRecommendations()
  ])

  // Fetch recent uploads
  const { data: recentBooks } = await supabase
    .from('books')
    .select(`
      id,
      title,
      cover_image_url,
      authors:authors (
        name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(3)

  // Format recent uploads for display
  const recentUploads = recentBooks?.map(book => ({
    id: book.id,
    title: book.title,
    author: book.authors?.[0]?.name || 'Unknown Author',
    cover: book.cover_image_url || '/placeholder.svg'
  })) || []

  // Prepare analytics highlights with real data
  const totalBooks = genreResult.success ? genreResult.data?.reduce((sum, genre) => sum + genre.value, 0) : 0
  const favoriteGenre = genreResult.success && genreResult.data?.[0]?.name || 'N/A'
  const topAuthor = authorResult.success && authorResult.data?.[0]?.name || 'N/A'

  const analyticsHighlights = [
    { label: 'Total Books', value: totalBooks },
    { label: 'Favorite Genre', value: favoriteGenre },
    { label: 'Top Author', value: topAuthor },
  ]

  // Get recommended books
  const recommendedBooks = recommendationsResult.success ? recommendationsResult.data || [] : []

  return (
    <EditModeProvider>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <section className="bg-amber-400 dark:bg-indigo-800 text-gray-800 dark:text-white rounded-lg p-8 mb-12 border-4 border-amber-600 dark:border-indigo-600">
            <WelcomeMessage userName={userName} />
            <UploadButton />
          </section>

          {/* Recent Uploads */}
          <RecentUploadsSection books={recentUploads} />

          {/* Analytics Highlights */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 font-mono text-gray-800 dark:text-white">Analytics Highlights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {analyticsHighlights.map((item, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-amber-500 dark:border-indigo-500">
                  <h3 className="text-lg font-semibold mb-2 font-mono text-gray-800 dark:text-white">{item.label}</h3>
                  <p className="text-3xl font-bold text-amber-600 dark:text-indigo-400 font-mono">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Recommended Books */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 font-mono text-gray-800 dark:text-white">
              AI-Powered Recommendations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendedBooks.map((book) => (
                <div key={book.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-2 border-amber-500 dark:border-indigo-500">
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
                </div>
              ))}
            </div>
          </section>
        </div>
      </Layout>
    </EditModeProvider>
  )
}

