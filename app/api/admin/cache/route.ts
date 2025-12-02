import { NextRequest, NextResponse } from 'next/server';
import { cacheMetrics } from '@/lib/cache/redis';
import { createClient } from '@/lib/supabase/server';

/**
 * Admin Cache Monitoring API
 *
 * GET /api/admin/cache - Get cache statistics
 * POST /api/admin/cache/reset - Reset cache metrics
 */

/**
 * Get cache statistics
 */
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

    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // 3. Get cache stats
    const stats = await cacheMetrics.getAllStats();

    return NextResponse.json({
      success: true,
      data: {
        marketData: {
          hits: stats.marketData.hits,
          misses: stats.marketData.misses,
          hitRate: stats.marketData.hitRate,
          total: stats.marketData.hits + stats.marketData.misses,
        },
        report: {
          hits: stats.report.hits,
          misses: stats.report.misses,
          hitRate: stats.report.hitRate,
          total: stats.report.hits + stats.report.misses,
        },
        overall: {
          hitRate:
            ((stats.marketData.hits + stats.report.hits) /
              (stats.marketData.hits +
                stats.marketData.misses +
                stats.report.hits +
                stats.report.misses)) *
              100 || 0,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Admin Cache API] Error:', error);
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

/**
 * Reset cache statistics
 */
export async function DELETE(request: NextRequest) {
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

    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // 3. Reset stats
    await cacheMetrics.resetStats();

    return NextResponse.json({
      success: true,
      message: 'Cache statistics reset successfully',
    });
  } catch (error) {
    console.error('[Admin Cache API] Error:', error);
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
