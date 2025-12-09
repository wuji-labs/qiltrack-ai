import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';

/**
 * POST /api/referrals/claim-milestone
 * 领取里程碑奖励
 */
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { milestone_type } = body;

    if (!milestone_type) {
      return NextResponse.json(
        { error: 'milestone_type is required' },
        { status: 400 }
      );
    }

    // 调用数据库函数领取奖励
    const { data, error } = await supabase.rpc('fn_claim_milestone_reward', {
      p_user_id: user.id,
      p_milestone_type: milestone_type,
    });

    if (error) {
      console.error('[CLAIM_MILESTONE_ERROR]', error);
      throw error;
    }

    const result = data[0];

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.message,
        },
        { status: 400 }
      );
    }

    console.info('[MILESTONE_CLAIMED]', {
      user_id: user.id,
      milestone_type,
      credits: result.credits_rewarded,
      plan: result.plan_rewarded,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      reward: {
        credits: result.credits_rewarded,
        plan: result.plan_rewarded,
        duration: result.duration_rewarded,
      },
    });
  } catch (error: any) {
    console.error('[CLAIM_MILESTONE_ERROR]', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to claim milestone reward',
      },
      { status: 500 }
    );
  }
}
