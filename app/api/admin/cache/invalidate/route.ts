import { NextRequest, NextResponse } from 'next/server';
import { marketDataCache, reportCache } from '@/lib/cache/redis';
import { requireAdmin, isAuthError } from '@/lib/auth/admin';

/**
 * Admin Cache Invalidation API
 *
 * POST /api/admin/cache/invalidate - Invalidate specific cache entries
 */

interface InvalidateRequest {
  type: 'market-data' | 'report' | 'all';
  symbol?: string;
  reportParams?: {
    symbol: string;
    language: string;
    tone: string;
  };
}

export async function POST(request: NextRequest) {
  // 认证检查
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  try {
    // Parse request body
    const body: InvalidateRequest = await request.json();

    // 4. Validate request
    if (!body.type) {
      return NextResponse.json(
        { success: false, error: 'Missing type field' },
        { status: 400 }
      );
    }

    // 5. Invalidate cache
    let message = '';

    switch (body.type) {
      case 'market-data':
        if (!body.symbol) {
          return NextResponse.json(
            { success: false, error: 'Missing symbol for market-data invalidation' },
            { status: 400 }
          );
        }
        await marketDataCache.invalidate(body.symbol);
        message = `Market data cache invalidated for ${body.symbol}`;
        break;

      case 'report':
        if (body.reportParams) {
          // Invalidate specific report
          await reportCache.invalidate(body.reportParams);
          message = `Report cache invalidated for ${body.reportParams.symbol} (${body.reportParams.language}/${body.reportParams.tone})`;
        } else if (body.symbol) {
          // Invalidate all reports for symbol
          await reportCache.invalidateSymbol(body.symbol);
          message = `All report caches invalidated for ${body.symbol}`;
        } else {
          return NextResponse.json(
            { success: false, error: 'Missing symbol or reportParams for report invalidation' },
            { status: 400 }
          );
        }
        break;

      case 'all':
        if (!body.symbol) {
          return NextResponse.json(
            { success: false, error: 'Missing symbol for all invalidation' },
            { status: 400 }
          );
        }
        // Invalidate both market data and all reports
        await Promise.all([
          marketDataCache.invalidate(body.symbol),
          reportCache.invalidateSymbol(body.symbol),
        ]);
        message = `All caches invalidated for ${body.symbol}`;
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('[Admin Cache Invalidate API] Error:', error);
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
