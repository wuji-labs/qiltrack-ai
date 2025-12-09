import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';

/**
 * POST /api/referrals/generate
 * 生成用户的专属邀请链接
 */
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  // 认证检查
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 调用数据库函数生成邀请码
    const { data: referralCode, error } = await supabase.rpc(
      'fn_generate_referral_code' as any,
      {
        p_user_id: user.id,
      }
    );

    if (error) {
      console.error('[REFERRAL_GENERATE_ERROR]', error);
      throw error;
    }

    // 动态获取当前请求的完整 URL（支持任何端口和域名）
    const protocol = req.headers.get('x-forwarded-proto') ||
                     (process.env.NODE_ENV === 'production' ? 'https' : 'http');
    const host = req.headers.get('host') || 'localhost:3000';
    const siteUrl = `${protocol}://${host}`;
    const referralLink = `${siteUrl}/ref/${referralCode}`;

    console.info('[REFERRAL_GENERATED]', {
      user_id: user.id,
      referral_code: referralCode,
    });

    return NextResponse.json({
      success: true,
      referral_code: referralCode,
      referral_link: referralLink,
    });
  } catch (error: any) {
    console.error('[REFERRAL_GENERATE_ERROR]', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate referral code',
      },
      { status: 500 }
    );
  }
}
