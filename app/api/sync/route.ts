import { NextResponse } from 'next/server';
import { syncSubscriptions, processSyncQueue } from '../../../lib/db';
import { syncSettings } from '../../../lib/settings';

export async function POST() {
  try {
    // Perform all sync operations
    await Promise.all([syncSubscriptions(), syncSettings(), processSyncQueue()]);

    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
    });
  } catch (error) {
    console.error('Sync failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // This could return sync status information
    return NextResponse.json({
      status: 'ready',
      message: 'Sync endpoint is available',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: String(error),
      },
      { status: 500 }
    );
  }
}
