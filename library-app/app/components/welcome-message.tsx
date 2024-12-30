'use client'

interface WelcomeMessageProps {
  userName: string
}

export default function WelcomeMessage({ userName }: WelcomeMessageProps) {
  return (
    <div className="max-w-3xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-4 font-mono">
        Welcome back, {userName}
      </h1>
      <p className="text-xl mb-8 font-mono">Upload a photo of your bookshelf and let our AI do the rest!</p>
    </div>
  )
} 