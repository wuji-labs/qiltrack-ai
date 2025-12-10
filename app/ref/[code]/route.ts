import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
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
    return NextResponse.redirect(new URL('/', request.url));
  }

  console.info('[REFERRAL_LINK_CLICKED]', {
    code,
    referrer_id: referrer.id,
  });

  // 使用 NextResponse.redirect 并显式设置 cookie
  const referrerName = encodeURIComponent(referrer.display_name || '好友');
  const redirectUrl = new URL(`/?ref=${code}&referrer=${referrerName}`, request.url);
  const response = NextResponse.redirect(redirectUrl);

  // 在响应上设置 cookie（7天有效）
  response.cookies.set('referral_code', code, {
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return response;
}
