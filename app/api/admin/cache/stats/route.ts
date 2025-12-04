/**
 * Admin API: Cache Statistics
 *
 * Provides cache hit/miss statistics for monitoring performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { cacheMetrics } from '@/lib/cache/redis';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/cache/stats
 *
 * Returns cache statistics including hit rates for:
 * - Market data cache
 * - Report cache
 *
 * @requires Admin role
 */
export async function GET(request: NextRequest) {
  try {
    const responseCookies: Array<{ name: string; value: string; options?: unknown }> = [];

    // 1. Authenticate and check admin role
    const supabase = createServerClient(request.cookies, (cookies) => {
      responseCookies.push(...cookies);
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const response = NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
      responseCookies.forEach(({ name, value, options }) => {
        response.headers.append('Set-Cookie', `${name}=${value}`);
      });
      return response;
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.role || !['admin', 'superadmin'].includes(profile.role)) {
      const response = NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
      responseCookies.forEach(({ name, value, options }) => {
        response.headers.append('Set-Cookie', `${name}=${value}`);
      });
      return response;
    }

    // 2. Fetch cache statistics
    const stats = await cacheMetrics.getAllStats();

    // 3. Calculate overall metrics
    const totalHits = stats.marketData.hits + stats.report.hits;
    const totalMisses = stats.marketData.misses + stats.report.misses;
    const totalRequests = totalHits + totalMisses;
    const overallHitRate =
      totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;

    const response = NextResponse.json({
      success: true,
      data: {
        marketData: stats.marketData,
        report: stats.report,
        overall: {
          hits: totalHits,
          misses: totalMisses,
          requests: totalRequests,
          hitRate: Math.round(overallHitRate * 100) / 100,
        },
        timestamp: new Date().toISOString(),
      },
    });

    responseCookies.forEach(({ name, value, options }) => {
      response.headers.append('Set-Cookie', `${name}=${value}`);
    });

    return response;
  } catch (error) {
    console.error('[Admin] Cache stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch cache statistics',
        details: String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/cache/stats
 *
 * Resets cache statistics
 *
 * @requires Admin role
 */
export async function DELETE(request: NextRequest) {
  try {
    const responseCookies: Array<{ name: string; value: string; options?: unknown }> = [];

    // 1. Authenticate and check admin role
    const supabase = createServerClient(request.cookies, (cookies) => {
      responseCookies.push(...cookies);
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const response = NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
      responseCookies.forEach(({ name, value, options }) => {
        response.headers.append('Set-Cookie', `${name}=${value}`);
      });
      return response;
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.role || !['admin', 'superadmin'].includes(profile.role)) {
      const response = NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
      responseCookies.forEach(({ name, value, options }) => {
        response.headers.append('Set-Cookie', `${name}=${value}`);
      });
      return response;
    }

    // 2. Reset statistics
    await cacheMetrics.resetStats();

    const response = NextResponse.json({
      success: true,
      message: 'Cache statistics reset successfully',
    });

    responseCookies.forEach(({ name, value, options }) => {
      response.headers.append('Set-Cookie', `${name}=${value}`);
    });

    return response;
  } catch (error) {
    console.error('[Admin] Cache stats reset error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset cache statistics',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
