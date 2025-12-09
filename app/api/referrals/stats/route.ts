import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/referrals/stats
 * 获取用户的邀请统计数据
 */
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. 查询邀请记录
    const { data: referrals, error: refError } = (await supabase
      .from('referrals' as any)
      .select(
        `
        id,
        referred_id,
        status,
        created_at,
        completed_at,
        profiles:referred_id (display_name, email)
      `
      )
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })) as any;

    if (refError) {
      console.error('[REFERRAL_STATS_ERROR]', refError);
      throw refError;
    }

    // 2. 统计数据
    const stats = {
      total: referrals?.length || 0,
      pending: referrals?.filter((r: any) => r.status === 'pending').length || 0,
      completed: referrals?.filter((r: any) => r.status === 'completed').length || 0,
      converted:
        referrals?.filter((r: any) => r.status?.startsWith('converted')).length || 0,
    };

    // 3. 查询总获得积分
    const { data: events, error: eventsError } = (await supabase
      .from('referral_events' as any)
      .select('credits_rewarded')
      .eq('user_id', user.id)
      .not('credits_rewarded', 'is', null)) as any;

    if (eventsError) {
      console.error('[REFERRAL_EVENTS_ERROR]', eventsError);
    }

    const total_credits_earned =
      events?.reduce((sum: number, e: any) => sum + (e.credits_rewarded || 0), 0) || 0;

    // 4. 查询里程碑
    const { data: milestones, error: milestoneError } = (await supabase
      .from('referral_milestones' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('milestone_type')) as any;

    if (milestoneError) {
      console.error('[REFERRAL_MILESTONES_ERROR]', milestoneError);
    }

    console.info('[REFERRAL_STATS]', {
      user_id: user.id,
      stats,
      milestones_count: milestones?.length || 0,
    });

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        total_credits_earned,
      },
      milestones: milestones || [],
      referrals: referrals || [],
    });
  } catch (error: any) {
    console.error('[REFERRAL_STATS_ERROR]', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch referral stats',
      },
      { status: 500 }
    );
  }
}
