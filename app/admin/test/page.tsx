"use client";

import { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function AdminTestPage() {
  const { user, session, loading: authLoading, supabase } = useSupabaseAuth();
  const [profile, setProfile] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && supabase) {
      checkAuth();
    } else if (!authLoading && !supabase) {
      setError("Supabase 链接未初始化");
      setLoading(false);
    }
  }, [authLoading, supabase, user, session]);

  async function checkAuth() {
    try {
      if (!user || !session) {
        setError("❌ 未登录");
        setLoading(false);
        return;
      }

      if (!supabase) {
        setError("❌ Supabase 未初始化");
        setLoading(false);
        return;
      }

      // 2. 获取当前用户的 profile
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        setError(`❌ 获取用户信息失败: ${profileError.message}`);
      } else {
        setProfile(userProfile);
      }

      // 3. 尝试获取所有用户列表
      const { data: allProfiles, error: listError } = await supabase
        .from("profiles")
        .select("*")
        .limit(10);

      if (listError) {
        setError(`❌ 获取用户列表失败: ${listError.message}`);
      } else {
        setProfiles(allProfiles || []);
      }
    } catch (err: any) {
      setError(`❌ 异常: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">后台数据测试</h1>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">🔍 后台数据诊断</h1>

      {/* 登录状态 */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-4">1. 登录状态</h2>
        {session ? (
          <div className="space-y-2">
            <p>✅ 已登录</p>
            <p className="text-sm text-dim">用户ID: {session.user.id}</p>
            <p className="text-sm text-dim">邮箱: {session.user.email}</p>
          </div>
        ) : (
          <div>
            <p>❌ 未登录</p>
            <p className="text-sm text-dim mt-2">
              请先<a href="/login" className="underline">登录</a>
            </p>
          </div>
        )}
      </div>

      {/* 用户信息 */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-4">2. 当前用户信息</h2>
        {profile ? (
          <div className="space-y-2">
            <p>✅ 成功获取</p>
            <pre className="bg-black/20 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(profile, null, 2)}
            </pre>
            <div className="mt-4">
              <p className="text-sm">
                角色: <span className="font-semibold">{profile.role || "user"}</span>
              </p>
              <p className="text-sm">
                是否管理员: {profile.role === "admin" ? "✅ 是" : "❌ 否"}
              </p>
            </div>
          </div>
        ) : (
          <p>❌ 未获取到用户信息</p>
        )}
      </div>

      {/* 用户列表 */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-4">3. 用户列表 (测试权限)</h2>
        {profiles.length > 0 ? (
          <div className="space-y-2">
            <p>✅ 成功获取 {profiles.length} 条记录</p>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">邮箱</th>
                    <th className="text-left p-2">角色</th>
                    <th className="text-left p-2">套餐</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-2">{p.email}</td>
                      <td className="p-2">{p.role || "user"}</td>
                      <td className="p-2">{p.plan || "free"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p>❌ 无法获取用户列表（可能权限不足）</p>
        )}
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="glass-card p-6 border-2 border-red-500">
          <h2 className="text-xl font-semibold mb-4 text-red-500">错误信息</h2>
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* 诊断建议 */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-4">💡 诊断建议</h2>
        <div className="space-y-2 text-sm">
          {!session && <p>• 需要先登录系统</p>}
          {session && profile?.role !== "admin" && (
            <p>• 当前用户不是管理员，无法访问后台数据</p>
          )}
          {session && profile?.role === "admin" && profiles.length === 0 && (
            <p>• 管理员账户正常，但可能 RLS 策略配置有问题</p>
          )}
          {session && profile?.role === "admin" && profiles.length > 0 && (
            <p className="text-green-400">✅ 一切正常！后台数据可以正常获取</p>
          )}
        </div>
      </div>
    </div>
  );
}
