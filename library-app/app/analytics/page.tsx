'use client'

import { useState, useEffect } from 'react'
import Layout from '../components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getGenreAnalytics, getAuthorAnalytics, getBooksTimeline } from '../actions/analytics'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'

interface GenreCount {
  name: string
  value: number
}

interface AuthorCount {
  name: string
  books: number
}

interface TimelineData {
  month: string
  books: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']
const PAGE_SIZE = 10

// Loading component
const ChartLoading = () => (
  <div className="h-[300px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
    <p className="text-gray-500 dark:text-gray-400">Loading chart data...</p>
  </div>
)

export default function AnalyticsPage() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [genreData, setGenreData] = useState<GenreCount[]>([])
  const [authorData, setAuthorData] = useState<AuthorCount[]>([])
  const [timelineData, setTimelineData] = useState<TimelineData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isMounted, setIsMounted] = useState(false)

  // Paginated author data
  const paginatedAuthorData = authorData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch genre data first for quick initial load
        const genreResult = await getGenreAnalytics()
        if (genreResult.success) {
          setGenreData(genreResult.data || [])
        }

        // Then fetch author and timeline data
        const [authorResult, timelineResult] = await Promise.all([
          getAuthorAnalytics(),
          getBooksTimeline()
        ])

        if (!authorResult.success) throw new Error(authorResult.error)
        if (!timelineResult.success) throw new Error(timelineResult.error)

        setAuthorData(authorResult.data || [])
        setTimelineData(timelineResult.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  if (loading || !isMounted) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8 text-gray-800 dark:text-white">Analytics</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <ChartLoading />
            <ChartLoading />
          </div>
          <ChartLoading />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8 text-gray-800 dark:text-white">Error</h1>
          <p className="text-red-500">{error}</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-800 dark:text-white">Analytics</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Favorite Genres Pie Chart */}
          <Card className="bg-white dark:bg-gray-800 border-2 border-amber-500 dark:border-indigo-500">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">Favorite Genres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genreData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      onMouseEnter={onPieEnter}
                    >
                      {genreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Most-Read Authors Bar Chart */}
          <Card className="bg-white dark:bg-gray-800 border-2 border-amber-500 dark:border-indigo-500">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">Most-Read Authors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paginatedAuthorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="books" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Pagination */}
              <div className="flex justify-center mt-4 space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-amber-500 dark:bg-indigo-600 text-white rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1">
                  Page {currentPage} of {Math.ceil(authorData.length / PAGE_SIZE)}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(authorData.length / PAGE_SIZE), p + 1))}
                  disabled={currentPage >= Math.ceil(authorData.length / PAGE_SIZE)}
                  className="px-3 py-1 bg-amber-500 dark:bg-indigo-600 text-white rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Books Added Over Time Line Graph */}
        <Card className="bg-white dark:bg-gray-800 border-2 border-amber-500 dark:border-indigo-500 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">Books Added Over Time</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="books" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Summary Section */}
        <Card className="bg-white dark:bg-gray-800 border-2 border-amber-500 dark:border-indigo-500">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">Key Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Total Books</h3>
                <p className="text-3xl font-bold text-amber-600 dark:text-indigo-400">
                  {genreData.reduce((sum, genre) => sum + genre.value, 0)}
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Favorite Genre</h3>
                <p className="text-3xl font-bold text-amber-600 dark:text-indigo-400">
                  {genreData[0]?.name || 'N/A'}
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Top Author</h3>
                <p className="text-3xl font-bold text-amber-600 dark:text-indigo-400">
                  {authorData[0]?.name || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

