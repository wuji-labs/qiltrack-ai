import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  // 验证邀请码
  const { data: referrer, error } = (await supabase
    .from('profiles' as any)
    .select('id, display_name, referral_code')
    .eq('referral_code', code)
    .single()) as any;

  if (error || !referrer) {
    console.warn('[INVALID_REFERRAL_CODE]', { code });
    redirect('/');
  }

  // 在Cookie中存储邀请码（7天有效）
  cookieStore.set('referral_code', code, {
    maxAge: 7 * 24 * 60 * 60,
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
  redirect(`/?ref=${code}&referrer=${referrerName}`);
}
