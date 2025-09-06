import { NextRequest, NextResponse } from 'next/server';
import { paymentSessions } from '../../../../lib/payment-sessions';

export async function POST(request: NextRequest) {
  try {
    const { userId, planId, paymentIntentId } = await request.json();
    
    console.log('Cleaning up payment session:', { userId, planId, paymentIntentId });
    
    if (!userId || !planId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Mark session as completed and clean it up
    paymentSessions.updateSessionStatus(userId, planId, 'completed');
    paymentSessions.completeSession(userId, planId);
    
    console.log(`Payment session cleaned up successfully for user ${userId}, plan ${planId}`);
    
    return NextResponse.json({ 
      success: true,
      message: 'Payment session cleaned up successfully' 
    });
    
  } catch (error) {
    console.error('Error cleaning up payment session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
