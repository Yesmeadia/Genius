import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  // Security: Only allow proxying from authorized sources to prevent SSRF
  const allowedDomains = [
    'https://firebasestorage.googleapis.com/',
    'https://fonts.gstatic.com/'
  ];
  
  const isAllowed = allowedDomains.some(domain => imageUrl.startsWith(domain));

  if (!isAllowed) {
    return new NextResponse('Unauthorized source', { status: 403 });
  }

  try {
    // Fetch the image from Firebase Storage (Server-side, bypasses browser CORS)
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error('Failed to fetch image');
    
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    
    return NextResponse.json({ 
      success: true, 
      base64: `data:${contentType};base64,${base64}` 
    });
  } catch (error) {
    console.error('Proxy image error:', error);
    return new NextResponse('Failed to proxy image', { status: 500 });
  }
}
