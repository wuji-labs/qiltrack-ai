-- ============================================
-- 邀请系统数据库迁移
-- 创建日期: 2025-12-09
-- 功能: 完整的邀请拉新系统
-- ============================================

-- 1. 扩展 profiles 表，添加邀请相关字段
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS referral_completed_at TIMESTAMP;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

-- 2. 创建邀请记录表
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 邀请人
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- 被邀请人
  referred_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- 邀请码
  referral_code VARCHAR(20) NOT NULL,

  -- 状态: pending(待注册), completed(已注册), converted_pro(已付费Pro), converted_ultra(已付费Ultra)
  status VARCHAR(20) DEFAULT 'pending',

  -- 奖励发放记录
  signup_reward_given BOOLEAN DEFAULT FALSE,
  pro_reward_given BOOLEAN DEFAULT FALSE,
  ultra_reward_given BOOLEAN DEFAULT FALSE,

  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  converted_at TIMESTAMP,

  -- 元数据
  metadata JSONB DEFAULT '{}'::jsonb,

  -- 唯一约束
  CONSTRAINT unique_referral UNIQUE(referrer_id, referred_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- 3. 创建里程碑表
CREATE TABLE IF NOT EXISTS referral_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- 里程碑类型: invite_10, invite_30, invite_88
  milestone_type VARCHAR(50) NOT NULL,

  -- 达成状态
  achieved BOOLEAN DEFAULT FALSE,
  achieved_at TIMESTAMP,

  -- 奖励内容
  reward_credits INTEGER,
  reward_plan VARCHAR(20),
  reward_duration INTEGER,

  -- 领取状态
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_user_milestone UNIQUE(user_id, milestone_type)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_milestones_user ON referral_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_achieved ON referral_milestones(achieved);
CREATE INDEX IF NOT EXISTS idx_milestones_claimed ON referral_milestones(claimed);

-- 4. 创建邀请事件表（用于审计和统计）
CREATE TABLE IF NOT EXISTS referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- 事件类型: signup, pro_upgrade, ultra_upgrade, milestone_achieved, milestone_claimed
  event_type VARCHAR(50) NOT NULL,

  -- 奖励详情
  credits_rewarded INTEGER,
  plan_rewarded VARCHAR(20),
  duration_rewarded INTEGER,

  -- 元数据
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_referral_events_user ON referral_events(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_events_type ON referral_events(event_type);
CREATE INDEX IF NOT EXISTS idx_referral_events_created ON referral_events(created_at DESC);

-- ============================================
-- 数据库函数
-- ============================================

-- 函数1: 生成邀请码
CREATE OR REPLACE FUNCTION fn_generate_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code TEXT;
  v_existing_code TEXT;
  v_attempts INT := 0;
BEGIN
  -- 检查是否已有邀请码
  SELECT referral_code INTO v_existing_code
  FROM profiles
  WHERE id = p_user_id;

  IF v_existing_code IS NOT NULL THEN
    RETURN v_existing_code;
  END IF;

  -- 生成新邀请码（8位随机字符）
  LOOP
    v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || p_user_id::TEXT) FROM 1 FOR 8));

    -- 检查唯一性
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = v_code) THEN
      UPDATE profiles
      SET referral_code = v_code, updated_at = NOW()
      WHERE id = p_user_id;

      RETURN v_code;
    END IF;

    v_attempts := v_attempts + 1;
    IF v_attempts >= 10 THEN
      RAISE EXCEPTION 'Failed to generate unique referral code';
    END IF;
  END LOOP;
END;
$$;

-- 函数2: 处理邀请注册奖励
CREATE OR REPLACE FUNCTION fn_claim_referral_signup(
  p_referred_user_id UUID,
  p_referral_code TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  referrer_id UUID,
  credits_given INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_id UUID;
  v_signup_reward INT := 30;  -- 注册奖励30积分
  v_referrer_balance INT;
  v_referred_balance INT;
BEGIN
  -- 1. 查找邀请人
  SELECT id INTO v_referrer_id
  FROM profiles
  WHERE referral_code = p_referral_code;

  IF v_referrer_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Invalid referral code'::TEXT, NULL::UUID, 0;
    RETURN;
  END IF;

  -- 2. 不能邀请自己
  IF v_referrer_id = p_referred_user_id THEN
    RETURN QUERY SELECT FALSE, 'Cannot refer yourself'::TEXT, NULL::UUID, 0;
    RETURN;
  END IF;

  -- 3. 检查是否已使用过邀请码
  IF EXISTS (
    SELECT 1 FROM profiles WHERE id = p_referred_user_id AND referred_by IS NOT NULL
  ) THEN
    RETURN QUERY SELECT FALSE, 'Already used a referral code'::TEXT, NULL::UUID, 0;
    RETURN;
  END IF;

  -- 4. 更新被邀请人的 referred_by
  UPDATE profiles
  SET referred_by = v_referrer_id, referral_completed_at = NOW()
  WHERE id = p_referred_user_id;

  -- 5. 创建邀请记录
  INSERT INTO referrals (
    referrer_id, referred_id, referral_code, status, signup_reward_given, completed_at
  )
  VALUES (
    v_referrer_id, p_referred_user_id, p_referral_code, 'completed', TRUE, NOW()
  )
  RETURNING id INTO v_referral_id;

  -- 6. 发放积分给邀请人
  INSERT INTO report_credits (user_id, credits_available)
  VALUES (v_referrer_id, v_signup_reward)
  ON CONFLICT (user_id) DO UPDATE
  SET credits_available = report_credits.credits_available + v_signup_reward, updated_at = NOW()
  RETURNING credits_available INTO v_referrer_balance;

  -- 7. 发放积分给被邀请人
  INSERT INTO report_credits (user_id, credits_available)
  VALUES (p_referred_user_id, v_signup_reward)
  ON CONFLICT (user_id) DO UPDATE
  SET credits_available = report_credits.credits_available + v_signup_reward, updated_at = NOW()
  RETURNING credits_available INTO v_referred_balance;

  -- 8. 记录积分事件（邀请人）
  INSERT INTO report_credit_events (user_id, event_type, delta, balance_after, reason, metadata)
  VALUES (
    v_referrer_id, 'referral_reward', v_signup_reward, v_referrer_balance,
    'Referral signup bonus',
    jsonb_build_object('referred_user_id', p_referred_user_id, 'referral_id', v_referral_id)
  );

  -- 9. 记录积分事件（被邀请人）
  INSERT INTO report_credit_events (user_id, event_type, delta, balance_after, reason, metadata)
  VALUES (
    p_referred_user_id, 'referral_reward', v_signup_reward, v_referred_balance,
    'Signup via referral',
    jsonb_build_object('referrer_id', v_referrer_id, 'referral_id', v_referral_id)
  );

  -- 10. 记录邀请事件
  INSERT INTO referral_events (referral_id, user_id, event_type, credits_rewarded)
  VALUES
    (v_referral_id, v_referrer_id, 'signup', v_signup_reward),
    (v_referral_id, p_referred_user_id, 'signup', v_signup_reward);

  -- 11. 发送通知
  INSERT INTO notifications (user_id, type, title, message)
  VALUES
    (
      v_referrer_id, 'referral_success', '好友注册成功！',
      format('恭喜！你邀请的好友已注册，你获得了 %s 积分', v_signup_reward)
    ),
    (
      p_referred_user_id, 'welcome_referral', '欢迎加入！',
      format('通过好友邀请注册，你已获得 %s 积分奖励', v_signup_reward)
    );

  -- 12. 检查里程碑
  PERFORM fn_check_milestones(v_referrer_id);

  RETURN QUERY SELECT TRUE, 'Success'::TEXT, v_referrer_id, v_signup_reward;
END;
$$;

-- 函数3: 处理付费转化奖励
CREATE OR REPLACE FUNCTION fn_grant_conversion_reward(
  p_user_id UUID,
  p_plan VARCHAR(20)  -- 'pro' or 'ultra'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_id UUID;
  v_reward_amount INT;
  v_new_balance INT;
BEGIN
  -- 1. 查找邀请人
  SELECT referred_by INTO v_referrer_id
  FROM profiles
  WHERE id = p_user_id;

  IF v_referrer_id IS NULL THEN
    RETURN FALSE;  -- 没有邀请人，跳过
  END IF;

  -- 2. 查找邀请记录
  SELECT id INTO v_referral_id
  FROM referrals
  WHERE referrer_id = v_referrer_id AND referred_id = p_user_id;

  IF v_referral_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 3. 处理Pro付费奖励：双方各150积分
  IF p_plan = 'pro' THEN
    -- 检查是否已发放
    IF EXISTS (SELECT 1 FROM referrals WHERE id = v_referral_id AND pro_reward_given = TRUE) THEN
      RETURN FALSE;
    END IF;

    v_reward_amount := 150;  -- Pro奖励150积分

    -- 更新状态
    UPDATE referrals
    SET status = 'converted_pro', pro_reward_given = TRUE, converted_at = NOW()
    WHERE id = v_referral_id;

    -- 发放积分给邀请人
    INSERT INTO report_credits (user_id, credits_available)
    VALUES (v_referrer_id, v_reward_amount)
    ON CONFLICT (user_id) DO UPDATE
    SET credits_available = report_credits.credits_available + v_reward_amount, updated_at = NOW()
    RETURNING credits_available INTO v_new_balance;

    INSERT INTO report_credit_events (user_id, event_type, delta, balance_after, reason, metadata)
    VALUES (
      v_referrer_id, 'referral_reward', v_reward_amount, v_new_balance,
      'Referral Pro upgrade bonus',
      jsonb_build_object('referred_user_id', p_user_id, 'referral_id', v_referral_id, 'plan', p_plan)
    );

    -- 发放积分给付费人
    INSERT INTO report_credits (user_id, credits_available)
    VALUES (p_user_id, v_reward_amount)
    ON CONFLICT (user_id) DO UPDATE
    SET credits_available = report_credits.credits_available + v_reward_amount, updated_at = NOW()
    RETURNING credits_available INTO v_new_balance;

    INSERT INTO report_credit_events (user_id, event_type, delta, balance_after, reason, metadata)
    VALUES (
      p_user_id, 'referral_reward', v_reward_amount, v_new_balance,
      'Referral Pro upgrade bonus',
      jsonb_build_object('referrer_id', v_referrer_id, 'referral_id', v_referral_id, 'plan', p_plan)
    );

    -- 记录事件
    INSERT INTO referral_events (referral_id, user_id, event_type, credits_rewarded, metadata)
    VALUES
      (v_referral_id, v_referrer_id, 'pro_upgrade', v_reward_amount, jsonb_build_object('referred_user_id', p_user_id, 'plan', p_plan)),
      (v_referral_id, p_user_id, 'pro_upgrade', v_reward_amount, jsonb_build_object('referrer_id', v_referrer_id, 'plan', p_plan));

    -- 发送通知
    INSERT INTO notifications (user_id, type, title, message)
    VALUES
      (v_referrer_id, 'referral_conversion', '好友升级了！', format('你邀请的好友升级了 Pro 计划，你获得了 %s 积分奖励！', v_reward_amount)),
      (p_user_id, 'upgrade_bonus', '升级奖励', format('感谢升级 Pro！你获得了 %s 积分奖励', v_reward_amount));

  -- 4. 处理Ultra付费奖励：付费人900积分，邀请人1个月Pro会员
  ELSIF p_plan = 'ultra' THEN
    IF EXISTS (SELECT 1 FROM referrals WHERE id = v_referral_id AND ultra_reward_given = TRUE) THEN
      RETURN FALSE;
    END IF;

    v_reward_amount := 900;  -- Ultra奖励900积分（给付费人）

    UPDATE referrals
    SET status = 'converted_ultra', ultra_reward_given = TRUE, converted_at = NOW()
    WHERE id = v_referral_id;

    -- 发放积分给付费人
    INSERT INTO report_credits (user_id, credits_available)
    VALUES (p_user_id, v_reward_amount)
    ON CONFLICT (user_id) DO UPDATE
    SET credits_available = report_credits.credits_available + v_reward_amount, updated_at = NOW()
    RETURNING credits_available INTO v_new_balance;

    INSERT INTO report_credit_events (user_id, event_type, delta, balance_after, reason, metadata)
    VALUES (
      p_user_id, 'referral_reward', v_reward_amount, v_new_balance,
      'Referral Ultra upgrade bonus',
      jsonb_build_object('referrer_id', v_referrer_id, 'referral_id', v_referral_id, 'plan', p_plan)
    );

    -- 邀请人获得1个月Pro会员（创建里程碑记录，需手动激活）
    INSERT INTO referral_milestones (
      user_id, milestone_type, achieved, achieved_at, reward_plan, reward_duration, claimed
    )
    VALUES (
      v_referrer_id, 'ultra_conversion_bonus', TRUE, NOW(), 'pro', 1, FALSE
    )
    ON CONFLICT (user_id, milestone_type) DO NOTHING;

    -- 记录事件
    INSERT INTO referral_events (referral_id, user_id, event_type, credits_rewarded, plan_rewarded, duration_rewarded, metadata)
    VALUES
      (v_referral_id, p_user_id, 'ultra_upgrade', v_reward_amount, NULL, NULL, jsonb_build_object('referrer_id', v_referrer_id, 'plan', p_plan)),
      (v_referral_id, v_referrer_id, 'ultra_upgrade', NULL, 'pro', 1, jsonb_build_object('referred_user_id', p_user_id, 'plan', p_plan));

    -- 发送通知
    INSERT INTO notifications (user_id, type, title, message)
    VALUES
      (p_user_id, 'upgrade_bonus', '升级奖励', format('感谢升级 Ultra！你获得了 %s 积分奖励', v_reward_amount)),
      (v_referrer_id, 'referral_conversion', '好友升级Ultra！', '你邀请的好友升级了 Ultra 计划，你获得了 1 个月 Pro 会员奖励！请前往邀请页面领取。');

  ELSE
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

-- 函数4: 检查并更新里程碑
CREATE OR REPLACE FUNCTION fn_check_milestones(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_completed_count INT;
BEGIN
  -- 统计已完成的邀请数
  SELECT COUNT(*) INTO v_completed_count
  FROM referrals
  WHERE referrer_id = p_user_id AND status IN ('completed', 'converted_pro', 'converted_ultra');

  -- 里程碑: 10人 → 120积分
  IF v_completed_count >= 10 THEN
    INSERT INTO referral_milestones (
      user_id, milestone_type, achieved, achieved_at, reward_credits
    )
    VALUES (p_user_id, 'invite_10', TRUE, NOW(), 120)
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;

  -- 里程碑: 30人 → Pro会员1个月
  IF v_completed_count >= 30 THEN
    INSERT INTO referral_milestones (
      user_id, milestone_type, achieved, achieved_at, reward_plan, reward_duration
    )
    VALUES (p_user_id, 'invite_30', TRUE, NOW(), 'pro', 1)
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;

  -- 里程碑: 88人 → Ultra会员1个月
  IF v_completed_count >= 88 THEN
    INSERT INTO referral_milestones (
      user_id, milestone_type, achieved, achieved_at, reward_plan, reward_duration
    )
    VALUES (p_user_id, 'invite_88', TRUE, NOW(), 'ultra', 1)
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;
END;
$$;

-- 函数5: 领取里程碑奖励
CREATE OR REPLACE FUNCTION fn_claim_milestone_reward(
  p_user_id UUID,
  p_milestone_type VARCHAR(50)
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  credits_rewarded INTEGER,
  plan_rewarded VARCHAR(20),
  duration_rewarded INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_milestone RECORD;
  v_new_balance INT;
BEGIN
  -- 1. 查询里程碑
  SELECT * INTO v_milestone
  FROM referral_milestones
  WHERE user_id = p_user_id AND milestone_type = p_milestone_type;

  IF v_milestone IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Milestone not found'::TEXT, 0, NULL::VARCHAR, 0;
    RETURN;
  END IF;

  IF NOT v_milestone.achieved THEN
    RETURN QUERY SELECT FALSE, 'Milestone not achieved yet'::TEXT, 0, NULL::VARCHAR, 0;
    RETURN;
  END IF;

  IF v_milestone.claimed THEN
    RETURN QUERY SELECT FALSE, 'Milestone already claimed'::TEXT, 0, NULL::VARCHAR, 0;
    RETURN;
  END IF;

  -- 2. 发放奖励
  IF v_milestone.reward_credits IS NOT NULL THEN
    -- 积分奖励
    INSERT INTO report_credits (user_id, credits_available)
    VALUES (p_user_id, v_milestone.reward_credits)
    ON CONFLICT (user_id) DO UPDATE
    SET credits_available = report_credits.credits_available + v_milestone.reward_credits, updated_at = NOW()
    RETURNING credits_available INTO v_new_balance;

    INSERT INTO report_credit_events (user_id, event_type, delta, balance_after, reason, metadata)
    VALUES (
      p_user_id, 'milestone_reward', v_milestone.reward_credits, v_new_balance,
      format('Milestone reward: %s', p_milestone_type),
      jsonb_build_object('milestone_type', p_milestone_type)
    );
  END IF;

  -- 3. 标记为已领取
  UPDATE referral_milestones
  SET claimed = TRUE, claimed_at = NOW()
  WHERE user_id = p_user_id AND milestone_type = p_milestone_type;

  -- 4. 记录事件
  INSERT INTO referral_events (user_id, event_type, credits_rewarded, plan_rewarded, duration_rewarded, metadata)
  VALUES (
    p_user_id, 'milestone_claimed',
    v_milestone.reward_credits, v_milestone.reward_plan, v_milestone.reward_duration,
    jsonb_build_object('milestone_type', p_milestone_type)
  );

  -- 5. 发送通知
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    p_user_id, 'milestone_claimed', '里程碑奖励已领取！',
    format('恭喜！你已成功领取 %s 里程碑奖励', p_milestone_type)
  );

  RETURN QUERY SELECT
    TRUE,
    'Milestone reward claimed successfully'::TEXT,
    v_milestone.reward_credits,
    v_milestone.reward_plan,
    v_milestone.reward_duration;
END;
$$;

-- ============================================
-- 修改现有的 fn_initialize_profile 函数
-- ============================================

CREATE OR REPLACE FUNCTION public.fn_initialize_profile(
  p_user_id uuid,
  p_email text,
  p_display_name text DEFAULT NULL,
  p_referral_code text DEFAULT NULL  -- 新增参数
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_initial_credits INT := 30;
  v_user_referral_code TEXT;
BEGIN
  -- 生成用户自己的邀请码
  v_user_referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || p_user_id::TEXT) FROM 1 FOR 8));

  -- 创建profile
  INSERT INTO public.profiles (id, email, display_name, plan, role, subscription_status, referral_code)
  VALUES (
    p_user_id,
    p_email,
    COALESCE(p_display_name, SPLIT_PART(p_email, '@', 1)),
    'free',
    'user',
    'inactive',
    v_user_referral_code
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    referral_code = COALESCE(profiles.referral_code, EXCLUDED.referral_code),
    updated_at = NOW();

  -- 创建积分记录
  INSERT INTO public.report_credits (user_id, credits_available, credits_used)
  VALUES (p_user_id, v_initial_credits, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- 记录初始积分事件
  INSERT INTO public.report_credit_events (user_id, event_type, delta, balance_after, reason)
  VALUES (p_user_id, 'granted', v_initial_credits, v_initial_credits, 'Initial signup bonus');

  -- 处理邀请奖励
  IF p_referral_code IS NOT NULL AND p_referral_code != '' THEN
    PERFORM fn_claim_referral_signup(p_user_id, p_referral_code);
  END IF;

  -- 发送欢迎通知
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    p_user_id, 'welcome', 'Welcome to Qiltrack AI!',
    'You have received ' || v_initial_credits || ' credits to get started.'
  );
END;
$function$;

-- ============================================
-- 注释和说明
-- ============================================

COMMENT ON TABLE referrals IS '邀请记录表：存储所有邀请关系和奖励发放状态';
COMMENT ON TABLE referral_milestones IS '里程碑表：记录用户达成的里程碑和待领取奖励';
COMMENT ON TABLE referral_events IS '邀请事件表：审计所有邀请相关的操作和奖励发放';

COMMENT ON FUNCTION fn_generate_referral_code IS '生成用户的专属邀请码';
COMMENT ON FUNCTION fn_claim_referral_signup IS '处理注册奖励：双方各得30积分';
COMMENT ON FUNCTION fn_grant_conversion_reward IS '处理付费奖励：Pro双方各150积分，Ultra付费人900积分+邀请人Pro会员';
COMMENT ON FUNCTION fn_check_milestones IS '检查并更新里程碑状态：10人/30人/88人';
COMMENT ON FUNCTION fn_claim_milestone_reward IS '领取里程碑奖励';
