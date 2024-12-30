'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

interface BookCoverProps {
  src: string
  alt: string
}

export default function BookCover({ src, alt }: BookCoverProps) {
  const [imgSrc, setImgSrc] = useState('/placeholder.svg')

  useEffect(() => {
    async function fetchCover() {
      try {
        const response = await fetch(src)
        const data = await response.json()
        if (data.coverUrl) {
          setImgSrc(data.coverUrl)
        }
      } catch (error) {
        console.error('Error fetching book cover:', error)
        setImgSrc('/placeholder.svg')
      }
    }

    if (src.startsWith('/api/fetch-book-cover')) {
      fetchCover()
    } else {
      setImgSrc(src)
    }
  }, [src])

  return (
    <div className="relative w-full h-48">
      <Image 
        src={imgSrc}
        alt={alt}
        fill
        className="object-cover"
        unoptimized
        onError={() => setImgSrc('/placeholder.svg')}
      />
    </div>
  )
} 