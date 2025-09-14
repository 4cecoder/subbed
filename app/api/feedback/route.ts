import { NextResponse } from 'next/server';

interface FeedbackData {
  category: string;
  message: string;
  email?: string;
  userAgent?: string;
  timestamp?: string;
}

export async function POST(req: Request) {
  try {
    const body: FeedbackData = await req.json();

    // Validate required fields
    if (!body.category || !body.message) {
      return NextResponse.json({ error: 'Category and message are required' }, { status: 400 });
    }

    // Validate category
    const validCategories = ['ui-ux', 'performance', 'accessibility', 'features', 'bugs', 'other'];

    if (!validCategories.includes(body.category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Validate email format if provided
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
    }

    // Log the feedback (in production, you might send this to a database, email, or external service)
    console.log('Feedback received:', {
      category: body.category,
      message: body.message,
      email: body.email || 'Not provided',
      userAgent: body.userAgent || 'Unknown',
      timestamp: body.timestamp || new Date().toISOString(),
    });

    // Here you could integrate with various services:
    // - Send to Slack/Discord webhook
    // - Store in database (Convex, Supabase, etc.)
    // - Send email notification
    // - Send to analytics service
    // - Store in file system for later processing

    return NextResponse.json({
      message: 'Feedback received successfully',
      feedbackId: generateFeedbackId(),
    });
  } catch (error) {
    console.error('Error processing feedback:', error);
    return NextResponse.json({ error: 'Failed to process feedback' }, { status: 500 });
  }
}

function generateFeedbackId(): string {
  return `fb_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
