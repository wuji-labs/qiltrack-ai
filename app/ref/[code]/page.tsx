import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

/**
 * 邀请链接跳转页
 * 路由: /ref/[code]
 *
 * 功能:
 * 1. 验证邀请码有效性
 * 2. 在Cookie中存储邀请码（7天有效）
 * 3. 跳转到注册页面
 */
export default async function ReferralPage({
  params,
}: {
  params: { code: string };
}) {
  const { code } = params;
  const supabase = createServerClient();

  // 验证邀请码
  const { data: referrer, error } = await supabase
    .from('profiles')
    .select('id, display_name, referral_code')
    .eq('referral_code', code)
    .single();

  if (error || !referrer) {
    // 无效邀请码，跳转首页
    console.warn('[INVALID_REFERRAL_CODE]', { code });
    redirect('/');
  }

  // 在Cookie中存储邀请码（7天有效）
  cookies().set('referral_code', code, {
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  console.info('[REFERRAL_LINK_CLICKED]', {
    code,
    referrer_id: referrer.id,
  });

  // 跳转到注册页
  const referrerName = encodeURIComponent(referrer.display_name || '好友');
  redirect(`/signup?ref=${code}&referrer=${referrerName}`);
}
