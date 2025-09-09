import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching users from backend...');
    
    // Get the backend URL from environment variable or use default
    const backendUrl = process.env.BACKEND_API_URL || 'https://server.kallin.ai';
    
    // Make the request to your backend server
    const response = await fetch(`${backendUrl}/api/auth/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add any authentication headers your backend expects
        // 'Authorization': `Bearer ${token}`, // if needed
      },
    });

    if (!response.ok) {
      console.error('Backend API failed:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch users from backend' },
        { status: response.status }
      );
    }

    const users = await response.json();
    console.log('Successfully fetched users:', users.users?.length || 0, 'users');

    // Return the data with proper CORS headers
    return NextResponse.json(users, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
