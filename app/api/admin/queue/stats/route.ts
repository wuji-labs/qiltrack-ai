import { NextResponse } from 'next/server';
// import { embeddingsQueue } from '@/lib/queue/embeddings.queue';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Queue monitoring API for admins
 *
 * GET /api/admin/queue/stats
 * Returns queue statistics and recent failed jobs
 */
export async function GET() {
  try {
    // Auth check
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Placeholder: Queue functionality temporarily disabled
    return NextResponse.json({
      success: true,
      data: {
        stats: {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          total: 0,
        },
        failedJobs: [],
      },
    });
  } catch (error) {
    console.error('[Queue Stats API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'QUEUE_STATS_ERROR',
          message: String(error),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Retry failed job
 *
 * POST /api/admin/queue/stats
 * Body: { jobId: string }
 */
export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId' },
        { status: 400 }
      );
    }

    // Placeholder: Queue functionality temporarily disabled
    return NextResponse.json({
      success: true,
      data: {
        message: `Job ${jobId} retry queued (placeholder)`,
      },
    });
  } catch (error) {
    console.error('[Queue Retry API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'QUEUE_RETRY_ERROR',
          message: String(error),
        },
      },
      { status: 500 }
    );
  }
}
