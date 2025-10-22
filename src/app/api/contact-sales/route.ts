import { NextRequest } from 'next/server';
import { sendContactSalesEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    
    // Log the incoming request
    console.log('Contact sales form submission received', formData);
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phoneNumber', 'companyName', 'city', 'state', 'services'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        console.log(`Missing required field: ${field}`);
        return Response.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Send the email
    await sendContactSalesEmail(formData);
    
    console.log('Contact sales email sent successfully');
    return Response.json({ success: true, message: 'Contact form submitted successfully' });
  } catch (error) {
    console.error('Error sending contact sales email:', error);
    return Response.json(
      { error: 'Failed to send contact form', details: (error as Error).message || 'Unknown error' },
      { status: 500 }
    );
  }
}