import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://3758a6b3509d.ngrok-free.app/api';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    console.log('Received payment confirmation request:', payload);

    // Validate required fields
    if (!payload.user_id || !payload.plan_type || typeof payload.minutes === 'undefined') {
      console.error('Missing required fields:', payload);
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Forward the request to the external backend
    console.log('Forwarding payment confirmation to external backend...');
    
    const response = await fetch(`${API_BASE_URL}/stripe/confirm-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('External API failed:', response.status, errorData);
      
      return NextResponse.json(
        { error: errorData.error || errorData.message || 'Payment confirmation failed' },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('Payment confirmation successful:', result);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in payment confirmation:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
