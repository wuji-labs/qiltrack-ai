import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';

/**
 * DEBUG: 检查邀请系统数据
 * GET /api/debug/referrals?email=xxx@xxx.com
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  try {
    // 先检查用户是否在 auth.users 表中
    const { data: authUsers } = (await supabase.auth.admin.listUsers()) as any;
    const authUser = authUsers?.users?.find((u: any) => u.email === email);

    // 查询用户信息
    const { data: profile, error: profileError } = (await supabase
      .from('profiles' as any)
      .select('id, email, referral_code, referred_by, created_at')
      .eq('email', email || '')
      .single()) as any;

    // 如果 profile 不存在，但 auth user 存在
    if (profileError && authUser) {
      return NextResponse.json({
        status: 'auth_user_exists_but_no_profile',
        authUser: {
          id: authUser.id,
          email: authUser.email,
          created_at: authUser.created_at,
          confirmed_at: authUser.confirmed_at,
        },
        profile: null,
        asReferred: [],
        asReferrer: [],
        events: [],
        error: 'Profile not created for this auth user',
      });
    }

    // 如果 profile 也不存在
    if (profileError) {
      return NextResponse.json({
        status: 'user_not_found',
        authUser: authUser ? {
          id: authUser.id,
          email: authUser.email,
          created_at: authUser.created_at,
        } : null,
        error: 'User not found in profiles table',
        details: profileError,
      });
    }

    // 查询作为被邀请人的记录
    const { data: asReferredRecords } = (await supabase
      .from('referrals' as any)
      .select('*')
      .eq('referred_id', profile.id)) as any;

    // 查询作为邀请人的记录
    const { data: asReferrerRecords } = (await supabase
      .from('referrals' as any)
      .select('*')
      .eq('referrer_id', profile.id)) as any;

    // 查询邀请事件
    const { data: events } = (await supabase
      .from('referral_events' as any)
      .select('*')
      .or(`user_id.eq.${profile.id},referrer_id.eq.${profile.id}`)) as any;

    return NextResponse.json({
      status: 'success',
      authUser: authUser ? {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
      } : null,
      profile,
      asReferred: asReferredRecords || [],
      asReferrer: asReferrerRecords || [],
      events: events || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
