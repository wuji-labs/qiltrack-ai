import { NextRequest, NextResponse } from 'next/server';
// import { embeddingsQueue } from '@/lib/queue/embeddings.queue';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Queue monitoring API for admins
 *
 * GET /api/admin/queue/stats
 * Returns queue statistics and recent failed jobs
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const responseCookies: Array<{ name: string; value: string; options?: unknown }> = [];
    const supabase = createServerClient(request.cookies, (cookies) => {
      responseCookies.push(...cookies);
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      responseCookies.forEach(({ name, value }) => {
        response.headers.append('Set-Cookie', `${name}=${value}`);
      });
      return response;
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = (profile as { role?: string | null } | null)?.role;
    if (!role || !['admin', 'superadmin', 'super_admin'].includes(role)) {
      const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      responseCookies.forEach(({ name, value }) => {
        response.headers.append('Set-Cookie', `${name}=${value}`);
      });
      return response;
    }

    // Placeholder: Queue functionality temporarily disabled
    const response = NextResponse.json({
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

    responseCookies.forEach(({ name, value }) => {
      response.headers.append('Set-Cookie', `${name}=${value}`);
    });

    return response;
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
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const responseCookies: Array<{ name: string; value: string; options?: unknown }> = [];
    const supabase = createServerClient(request.cookies, (cookies) => {
      responseCookies.push(...cookies);
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      responseCookies.forEach(({ name, value }) => {
        response.headers.append('Set-Cookie', `${name}=${value}`);
      });
      return response;
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role2 = (profile as { role?: string | null } | null)?.role;
    if (!role2 || !['admin', 'superadmin', 'super_admin'].includes(role2)) {
      const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      responseCookies.forEach(({ name, value }) => {
        response.headers.append('Set-Cookie', `${name}=${value}`);
      });
      return response;
    }

    const { jobId } = await request.json();

    if (!jobId) {
      const response = NextResponse.json(
        { error: 'Missing jobId' },
        { status: 400 }
      );
      responseCookies.forEach(({ name, value }) => {
        response.headers.append('Set-Cookie', `${name}=${value}`);
      });
      return response;
    }

    // Placeholder: Queue functionality temporarily disabled
    const response = NextResponse.json({
      success: true,
      data: {
        message: `Job ${jobId} retry queued (placeholder)`,
      },
    });

    responseCookies.forEach(({ name, value }) => {
      response.headers.append('Set-Cookie', `${name}=${value}`);
    });

    return response;
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
