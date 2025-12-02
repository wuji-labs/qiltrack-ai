import { NextResponse } from 'next/server';
import { embeddingsQueue } from '@/lib/queue/embeddings.queue';
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

    // Get queue statistics
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      embeddingsQueue.getWaitingCount(),
      embeddingsQueue.getActiveCount(),
      embeddingsQueue.getCompletedCount(),
      embeddingsQueue.getFailedCount(),
      embeddingsQueue.getDelayedCount(),
    ]);

    // Get recent failed jobs
    const failedJobs = await embeddingsQueue.getFailed(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          waiting,
          active,
          completed,
          failed,
          delayed,
          total: waiting + active + completed + failed + delayed,
        },
        failedJobs: failedJobs.map((job) => ({
          id: job.id,
          reportRunId: job.data.reportRunId,
          language: job.data.language,
          tone: job.data.tone,
          failedReason: job.failedReason,
          attemptsMade: job.attemptsMade,
          timestamp: job.timestamp,
          stacktrace: job.stacktrace,
        })),
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

    // Retry the job
    const job = await embeddingsQueue.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    await job.retry();

    return NextResponse.json({
      success: true,
      data: {
        message: `Job ${jobId} has been retried`,
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
