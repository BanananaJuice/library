import { ImageAnnotatorClient } from '@google-cloud/vision'
import { NextResponse } from 'next/server'
import path from 'path'

const vision = new ImageAnnotatorClient({
  keyFilename: path.join(process.cwd(), 'app', 'google.json'),
  projectId: process.env.GOOGLE_CLOUD_PROJECT
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Perform text detection
    const [result] = await vision.textDetection(buffer)
    const detections = result.textAnnotations

    if (!detections || !detections[0]) {
      return NextResponse.json(
        { error: 'No text detected in the image' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      text: detections[0].description || ''
    })

  } catch (error) {
    console.error('Vision API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    )
  }
} 