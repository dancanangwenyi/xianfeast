import { NextResponse } from "next/server"

/**
 * GET /api/test
 * Simple test endpoint to verify server is working
 */
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: "Server is working!",
    timestamp: new Date().toISOString()
  })
}
