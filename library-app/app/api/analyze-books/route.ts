import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    const { text } = await request.json()
    
    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      )
    }

    const prompt = `
      Analyze the following text from a book image or bookshelf and extract book information.
      If multiple books are detected, list all of them.
      For each book, provide the title, author (if available), and likely genre based on the title or content.
      Format the response as a JSON array with the following structure:
      {
        "books": [
          {
            "title": "Book Title",
            "author": "Author Name or 'Unknown'",
            "genre": "Likely Genre"
          }
        ]
      }
      
      Text to analyze:
      ${text}
    `

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that analyzes text from book covers and bookshelves to extract book information. Always respond with valid JSON in the specified format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0].message.content
    if (!content) {
      throw new Error('No content in response')
    }

    const parsedResponse = JSON.parse(content)
    return NextResponse.json(parsedResponse)

  } catch (error) {
    console.error('ChatGPT Analysis Error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze text' },
      { status: 500 }
    )
  }
} 