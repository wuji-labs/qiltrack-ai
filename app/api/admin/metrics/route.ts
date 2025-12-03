import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Business Metrics API
 *
 * GET /api/admin/metrics - Get business metrics
 */

interface MetricsData {
  reports: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    byTone: Record<string, number>;
    byLanguage: Record<string, number>;
    avgGenerationTime: number;
  };
  users: {
    total: number;
    active: number;
    new: number;
  };
  credits: {
    totalConsumed: number;
    totalGranted: number;
    avgBalance: number;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.role || !['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // 3. Fetch metrics
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Report metrics
    const [
      totalReports,
      todayReports,
      weekReports,
      monthReports,
      toneStats,
      langStats,
      avgTime,
    ] = await Promise.all([
      // Total reports
      supabase.from('report_runs').select('id', { count: 'exact', head: true }),

      // Today's reports
      supabase
        .from('report_runs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString()),

      // This week's reports
      supabase
        .from('report_runs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekStart.toISOString()),

      // This month's reports
      supabase
        .from('report_runs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString()),

      // By tone
      supabase.from('report_runs').select('tone'),

      // By language
      supabase.from('report_runs').select('language'),

      // Avg generation time
      supabase
        .from('report_runs')
        .select('duration_ms')
        .not('duration_ms', 'is', null)
        .gte('created_at', weekStart.toISOString()),
    ]);

    // Process tone stats
    const byTone: Record<string, number> = {};
    toneStats.data?.forEach((r) => {
      byTone[r.tone || 'unknown'] = (byTone[r.tone || 'unknown'] || 0) + 1;
    });

    // Process language stats
    const byLanguage: Record<string, number> = {};
    langStats.data?.forEach((r) => {
      byLanguage[r.language || 'unknown'] =
        (byLanguage[r.language || 'unknown'] || 0) + 1;
    });

    // Avg generation time
    const avgGenerationTime =
      avgTime.data && avgTime.data.length > 0
        ? avgTime.data.reduce((sum, r) => sum + (r.duration_ms || 0), 0) /
          avgTime.data.length
        : 0;

    // User metrics
    const totalUsersPromise = supabase.from('profiles').select('id', { count: 'exact', head: true });

    // Active users (generated report in last 7 days) - with error handling
    let activeUsersCount = 0;
    try {
      const result = await supabase.rpc('get_active_users_count', { days: 7 });
      activeUsersCount = result.data || 0;
    } catch {
      activeUsersCount = 0;
    }

    const newUsersPromise = supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekStart.toISOString());

    const [totalUsers, newUsers] = await Promise.all([totalUsersPromise, newUsersPromise]);

    // Credit metrics
    const [creditEvents, creditBalances] = await Promise.all([
      supabase.from('report_credit_events').select('event_type, credits_amount'),

      supabase.from('report_credits').select('credits_available'),
    ]);

    const totalConsumed =
      creditEvents.data?.filter((e) => e.event_type === 'consumed').length || 0;
    const totalGranted =
      creditEvents.data
        ?.filter((e) => e.event_type === 'granted')
        .reduce((sum, e) => sum + e.credits_amount, 0) || 0;
    const avgBalance =
      creditBalances.data && creditBalances.data.length > 0
        ? creditBalances.data.reduce(
            (sum, c) => sum + (c.credits_available || 0),
            0
          ) / creditBalances.data.length
        : 0;

    // Performance metrics (placeholder - would integrate with cache/monitoring)
    const performance = {
      avgResponseTime: 0, // Would come from logs
      errorRate: 0, // Would come from Sentry
      cacheHitRate: 0, // Would come from cache stats API
    };

    // Try to fetch cache hit rate
    try {
      const cacheStats = await fetch(
        `${request.nextUrl.origin}/api/admin/cache`
      ).then((r) => r.json());
      if (cacheStats.success) {
        performance.cacheHitRate = cacheStats.data.overall.hitRate;
      }
    } catch (e) {
      // Ignore cache stats error
    }

    const metrics: MetricsData = {
      reports: {
        total: totalReports.count || 0,
        today: todayReports.count || 0,
        thisWeek: weekReports.count || 0,
        thisMonth: monthReports.count || 0,
        byTone,
        byLanguage,
        avgGenerationTime: Math.round(avgGenerationTime),
      },
      users: {
        total: totalUsers.count || 0,
        active: activeUsersCount,
        new: newUsers.count || 0,
      },
      credits: {
        totalConsumed,
        totalGranted,
        avgBalance: Math.round(avgBalance * 10) / 10,
      },
      performance,
    };

    return NextResponse.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Admin Metrics API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
