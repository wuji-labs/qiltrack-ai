'use client';

import { useState, useEffect } from 'react';
import { Copy, Mail, Share2, Users, Award, ExternalLink, Gift, Trophy, Zap, Star } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { handleClientError, ErrorHandlers } from '@/lib/client/error-handler';
import { toast } from 'sonner';

interface ReferralStats {
  total: number;
  completed: number;
  converted: number;
  total_credits_earned: number;
}

interface Milestone {
  milestone_type: string;
  achieved: boolean;
  claimed: boolean;
  reward_credits?: number;
  reward_plan?: string;
  reward_duration?: number;
}

const MILESTONE_CONFIG = {
  invite_10: { label: '邀请 10 人', reward: '120 积分', icon: '🎯' },
  invite_30: { label: '邀请 30 人', reward: 'Pro 月卡', icon: '💎' },
  invite_88: { label: '邀请 88 人', reward: 'Ultra 月卡', icon: '🏆' },
  ultra_conversion_bonus: {
    label: 'Ultra 转化奖励',
    reward: 'Pro 月卡',
    icon: '🎁',
  },
};

export default function ReferralPanel() {
  const { t } = useLanguage();
  const [referralLink, setReferralLink] = useState('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 生成邀请链接
      const genRes = await fetch('/api/referrals/generate', {
        method: 'POST',
        credentials: 'include' // 确保发送 cookies
      });

      console.log('[REFERRAL_PANEL] Generate response status:', genRes.status);
      const genData = await genRes.json();
      console.log('[REFERRAL_PANEL] Generate response data:', genData);

      if (genData.success) {
        setReferralLink(genData.referral_link);
        console.log('[REFERRAL_PANEL] Referral link set:', genData.referral_link);
      } else {
        console.error('[REFERRAL_PANEL] Generate link failed:', genData);
        handleClientError(genData, {
          message: genData.error || t('referral.toast.generateFailed'),
          severity: 'error',
          log: false,
        });
      }

      // 获取统计
      const statsRes = await fetch('/api/referrals/stats', {
        credentials: 'include' // 确保发送 cookies
      });
      const statsData = await statsRes.json();

      if (statsData.success) {
        setStats(statsData.stats);
        setMilestones(statsData.milestones || []);
      } else {
        console.error('[REFERRAL_PANEL] Stats failed:', statsData);
        handleClientError(statsData, {
          message: statsData.error || t('referral.toast.loadStatsFailed'),
          severity: 'error',
          log: false,
        });
      }
    } catch (error) {
      ErrorHandlers.network(error, t('referral.toast.loadDataFailed'));
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!referralLink) {
      handleClientError(new Error('Link not generated'), {
        message: t('referral.toast.linkNotGenerated'),
        severity: 'warning',
        log: false,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success(t('referral.toast.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      handleClientError(error, {
        message: t('referral.toast.copyFailed'),
        severity: 'error',
        log: false,
      });
    }
  };

  const copyShareText = () => {
    if (!referralLink) {
      handleClientError(new Error('Link generating'), {
        message: t('referral.toast.linkGenerating'),
        severity: 'warning',
        log: false,
      });
      return;
    }
    // 随机选择20套话术中的一套
    const variantNumber = Math.floor(Math.random() * 20) + 1;
    const text = t(`referral.share.twitter.text.${variantNumber}`, { link: referralLink });

    navigator.clipboard.writeText(text).then(() => {
      toast.success(t('referral.toast.shareTextCopied'));
    }).catch((error) => {
      handleClientError(error, {
        message: t('referral.toast.copyFailed'),
        severity: 'error',
        log: false,
      });
    });
  };

  const shareOnTwitter = () => {
    if (!referralLink) {
      handleClientError(new Error('Link generating'), {
        message: t('referral.toast.linkGenerating'),
        severity: 'warning',
        log: false,
      });
      return;
    }
    // 随机选择20套话术中的一套，避免算法降权
    const variantNumber = Math.floor(Math.random() * 20) + 1;
    const text = encodeURIComponent(
      t(`referral.share.twitter.text.${variantNumber}`, { link: referralLink })
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const shareOnWeChat = () => {
    if (!referralLink) {
      handleClientError(new Error('Link generating'), {
        message: t('referral.toast.linkGenerating'),
        severity: 'warning',
        log: false,
      });
      return;
    }
    const wechatText = t('referral.share.wechat.text', { link: referralLink });

    navigator.clipboard.writeText(wechatText).then(() => {
      toast.success(t('referral.toast.wechatCopied'), { duration: 4000 });
    }).catch((error) => {
      handleClientError(error, {
        message: t('referral.toast.copyFailed'),
        severity: 'error',
        log: false,
      });
    });
  };

  const shareOnLinkedIn = () => {
    if (!referralLink) {
      toast.error(t('referral.toast.linkGenerating'));
      return;
    }
    const url = encodeURIComponent(referralLink);
    const title = encodeURIComponent(t('referral.share.linkedin.title'));
    const summary = encodeURIComponent(t('referral.share.linkedin.summary'));
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`, '_blank');
  };

  const claimMilestone = async (milestoneType: string) => {
    setClaiming(milestoneType);
    try {
      const res = await fetch('/api/referrals/claim-milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestone_type: milestoneType }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(t('referral.toast.milestoneClaimed'));
        loadData(); // 刷新数据
      } else {
        toast.error(data.error || t('referral.toast.claimFailed'));
      }
    } catch (error) {
      toast.error(t('referral.toast.claimFailed'));
    } finally {
      setClaiming(null);
    }
  };

  const getNextMilestone = () => {
    const completed = stats?.completed || 0;
    if (completed < 10) return { target: 10, current: completed };
    if (completed < 30) return { target: 30, current: completed };
    if (completed < 88) return { target: 88, current: completed };
    return { target: 88, current: 88 };
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse bg-[var(--bg-layer)]/50 rounded-xl h-96"></div>
      </div>
    );
  }

  const nextMilestone = getNextMilestone();
  const progress = (nextMilestone.current / nextMilestone.target) * 100;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* 标题区 */}
      <div className="text-center space-y-4 py-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--bg-layer)] border border-[var(--stroke-soft)] rounded-full">
          <Zap className="w-4 h-4 text-blue-400" />
          <span className="text-[var(--color-foreground)] font-medium text-sm">{t('referral.title.badge')}</span>
        </div>
        <h1 className="text-3xl font-bold text-[var(--color-foreground)]">
          {t('referral.title.main')}
        </h1>
        <p className="text-base text-[var(--color-foreground)]/70 max-w-3xl mx-auto">
          {(() => {
            const desc = t('referral.title.description');
            const parts = desc.split(/(<signup>|<\/signup>|<pro>|<\/pro>|<ultra>|<\/ultra>)/);
            let currentColor = '';
            return parts.map((part, i) => {
              if (part === '<signup>') { currentColor = 'green'; return null; }
              if (part === '</signup>') { currentColor = ''; return null; }
              if (part === '<pro>') { currentColor = 'amber'; return null; }
              if (part === '</pro>') { currentColor = ''; return null; }
              if (part === '<ultra>') { currentColor = 'purple'; return null; }
              if (part === '</ultra>') { currentColor = ''; return null; }
              if (currentColor === 'green') return <span key={i} className="text-green-400 font-medium">{part}</span>;
              if (currentColor === 'amber') return <span key={i} className="text-amber-400 font-medium">{part}</span>;
              if (currentColor === 'purple') return <span key={i} className="text-purple-400 font-medium">{part}</span>;
              return <span key={i}>{part}</span>;
            });
          })()}
        </p>
      </div>

      {/* 📱 分享邀请链接 */}
      <div className="bg-[var(--bg-layer)] border border-[var(--stroke-soft)] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <Share2 className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{t('referral.shareLink.title')}</h3>
        </div>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={referralLink || t('referral.shareLink.generating')}
            readOnly
            className="flex-1 px-4 py-3 border border-[var(--stroke-soft)] rounded-lg bg-[var(--bg-base)] text-base font-mono text-[var(--color-foreground)] focus:outline-none focus:border-blue-500/40"
          />
          <button
            onClick={copyLink}
            disabled={!referralLink}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 text-base ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            <Copy className="w-4 h-4" />
            {copied ? t('referral.shareLink.copied') : t('referral.shareLink.copyButton')}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={copyShareText}
            disabled={!referralLink}
            className="py-3 border border-[var(--stroke-soft)] text-[var(--color-foreground)] rounded-lg font-medium hover:bg-[var(--bg-base)] transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50"
          >
            <Copy className="w-4 h-4" />
            {t('referral.shareLink.copyShareText')}
          </button>
          <button
            onClick={shareOnTwitter}
            disabled={!referralLink}
            className="py-3 border border-[var(--stroke-soft)] text-[var(--color-foreground)] rounded-lg font-medium hover:bg-[var(--bg-base)] transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50"
          >
            <ExternalLink className="w-4 h-4" />
            {t('referral.shareLink.shareTwitter')}
          </button>
        </div>
      </div>

      {/* 核心奖励卡片 */}
      <div className="grid md:grid-cols-3 gap-5">
        {/* 注册奖励 */}
        <div className="relative bg-[var(--bg-layer)] border border-[var(--stroke-soft)] rounded-xl p-6 hover:border-green-500/30 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="text-3xl">🎁</div>
            <div className="bg-green-500/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full border border-green-500/30">
              {t('referral.reward.basic.badge')}
            </div>
          </div>
          <div className="text-3xl font-bold text-green-400 mb-3">+30 {t('pricing.comparison.category.credits')}</div>
          <div className="text-base font-semibold text-[var(--color-foreground)] mb-2">{t('referral.reward.basic.title')}</div>
          <div className="text-base text-[var(--color-foreground)]/70" dangerouslySetInnerHTML={{
            __html: t('referral.reward.basic.description')
              .replace('<credits>', '<span class="text-green-400 font-medium">')
              .replace('</credits>', '</span>')
              .replace('<report>', '<span class="text-green-400 font-medium">')
              .replace('</report>', '</span>')
          }} />
        </div>

        {/* Pro 升级奖励 */}
        <div className="relative bg-[var(--bg-layer)] border border-[var(--stroke-soft)] rounded-xl p-6 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="text-3xl">💎</div>
            <div className="bg-amber-500/20 text-amber-400 text-xs font-semibold px-3 py-1 rounded-full border border-amber-500/30">
              {t('referral.reward.pro.badge')}
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-400 mb-3">+150 {t('pricing.comparison.category.credits')}</div>
          <div className="text-base font-semibold text-[var(--color-foreground)] mb-2">{t('referral.reward.pro.title')}</div>
          <div className="text-base text-[var(--color-foreground)]/70" dangerouslySetInnerHTML={{
            __html: t('referral.reward.pro.description')
              .replace('<credits>', '<span class="text-amber-400 font-medium">')
              .replace('</credits>', '</span>')
              .replace('<report>', '<span class="text-amber-400 font-medium">')
              .replace('</report>', '</span>')
          }} />
        </div>

        {/* Ultra 升级奖励 */}
        <div className="relative bg-[var(--bg-layer)] border border-[var(--stroke-soft)] rounded-xl p-6 hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="text-3xl">🏆</div>
            <div className="bg-purple-500/20 text-purple-400 text-xs font-semibold px-3 py-1 rounded-full border border-purple-500/30">
              {t('referral.reward.ultra.badge')}
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-400 mb-3">{t('referral.milestone.invite30.reward')}</div>
          <div className="text-base font-semibold text-[var(--color-foreground)] mb-2">{t('referral.reward.ultra.title')}</div>
          <div className="text-base text-[var(--color-foreground)]/70" dangerouslySetInnerHTML={{
            __html: t('referral.reward.ultra.description')
              .replace('<credits>', '<span class="text-purple-400 font-medium">')
              .replace('</credits>', '</span>')
              .replace('<membership>', '<span class="text-purple-400 font-medium">')
              .replace('</membership>', '</span>')
          }} />
        </div>
      </div>

      {/* 收益统计 */}
      <div className="bg-[var(--bg-layer)] border border-[var(--stroke-soft)] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Trophy className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{t('referral.stats.title')}</h3>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {stats?.total_credits_earned || 0}
            </div>
            <div className="text-sm text-[var(--color-foreground)]/60">{t('referral.stats.totalCredits')}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {stats?.completed || 0}
            </div>
            <div className="text-sm text-[var(--color-foreground)]/60">{t('referral.stats.successfulInvites')}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {stats?.converted || 0}
            </div>
            <div className="text-sm text-[var(--color-foreground)]/60">{t('referral.stats.paidConversions')}</div>
          </div>
        </div>
      </div>

      {/* 里程碑大奖 */}
      <div className="bg-[var(--bg-layer)] border border-[var(--stroke-soft)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{t('referral.milestone.title')}</h3>
          </div>
          <div className="text-right">
            <div className="text-xs text-[var(--color-foreground)]/50">{t('referral.milestone.currentProgress')}</div>
            <div className="text-base font-semibold text-purple-400">
              {nextMilestone.current} / {nextMilestone.target}
            </div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mb-6">
          <div className="relative w-full h-3 bg-[var(--bg-base)] rounded-full border border-[var(--stroke-soft)] overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-purple-500 transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              {progress > 20 && (
                <span className="text-xs font-medium text-white">
                  {Math.round(progress)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 里程碑列表 */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className={`relative rounded-lg p-5 border transition-all ${
            nextMilestone.current >= 10
              ? 'bg-green-500/5 border-green-500/30'
              : 'bg-[var(--bg-base)] border-[var(--stroke-soft)]'
          }`}>
            <div className="text-center">
              <div className="text-4xl mb-2">🎯</div>
              <div className="text-base font-semibold text-[var(--color-foreground)] mb-1">
                {t('referral.milestone.invite10.title')}
              </div>
              <div className="text-xl font-bold text-green-400 mb-3">{t('referral.milestone.invite10.reward')}</div>
              {nextMilestone.current >= 10 ? (
                <button
                  onClick={() => claimMilestone('invite_10')}
                  className="w-full py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all text-base"
                >
                  {t('referral.milestone.claimNow')}
                </button>
              ) : (
                <div className="text-base text-[var(--color-foreground)]/50">
                  {t('referral.milestone.remaining', { count: String(10 - nextMilestone.current) })}
                </div>
              )}
            </div>
          </div>

          <div className={`relative rounded-lg p-5 border transition-all ${
            nextMilestone.current >= 30
              ? 'bg-amber-500/5 border-amber-500/30'
              : 'bg-[var(--bg-base)] border-[var(--stroke-soft)]'
          }`}>
            <div className="text-center">
              <div className="text-4xl mb-2">💎</div>
              <div className="text-base font-semibold text-[var(--color-foreground)] mb-1">
                {t('referral.milestone.invite30.title')}
              </div>
              <div className="text-xl font-bold text-amber-400 mb-3">{t('referral.milestone.invite30.reward')}</div>
              {nextMilestone.current >= 30 ? (
                <button
                  onClick={() => claimMilestone('invite_30')}
                  className="w-full py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-all text-base"
                >
                  {t('referral.milestone.claimNow')}
                </button>
              ) : (
                <div className="text-base text-[var(--color-foreground)]/50">
                  {t('referral.milestone.remaining', { count: String(30 - nextMilestone.current) })}
                </div>
              )}
            </div>
          </div>

          <div className={`relative rounded-lg p-5 border transition-all ${
            nextMilestone.current >= 88
              ? 'bg-purple-500/5 border-purple-500/30'
              : 'bg-[var(--bg-base)] border-[var(--stroke-soft)]'
          }`}>
            <div className="text-center">
              <div className="text-4xl mb-2">🏆</div>
              <div className="text-base font-semibold text-[var(--color-foreground)] mb-1">
                {t('referral.milestone.invite88.title')}
              </div>
              <div className="text-xl font-bold text-purple-400 mb-3">{t('referral.milestone.invite88.reward')}</div>
              {nextMilestone.current >= 88 ? (
                <button
                  onClick={() => claimMilestone('invite_88')}
                  className="w-full py-2.5 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-all text-base"
                >
                  {t('referral.milestone.claimNow')}
                </button>
              ) : (
                <div className="text-base text-[var(--color-foreground)]/50">
                  {t('referral.milestone.remaining', { count: String(88 - nextMilestone.current) })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
