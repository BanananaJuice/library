'use client'

import { Camera } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function UploadButton() {
  const router = useRouter()

  return (
    <button 
      className="bg-gray-800 dark:bg-amber-400 text-white dark:text-gray-800 font-semibold py-3 px-6 rounded-lg flex items-center justify-center mx-auto hover:bg-gray-700 dark:hover:bg-amber-300 transition-colors font-mono"
      onClick={() => router.push('/upload')}
    >
      <Camera className="mr-2" />
      Upload Bookshelf Photo
    </button>
  )
} 