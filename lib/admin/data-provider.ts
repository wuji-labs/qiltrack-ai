import { DataProvider } from "@refinedev/core";
import { createClient } from "@/lib/supabase/client";

/**
 * 增强版 Supabase 数据提供者
 *
 * 支持功能:
 * - 完整的 CRUD 操作
 * - 批量操作 (批量删除、批量更新)
 * - 高级过滤和排序
 * - 关联数据查询
 * - 自定义 RPC 调用
 */
export const supabaseDataProvider: any = {
  /**
   * 获取资源列表 - 支持分页、排序、过滤
   */
  getList: async ({ resource, pagination, sorters, filters, meta }: any) => {
    const supabase = createClient();
    let query: any = supabase.from(resource).select(meta?.select || "*", { count: "exact" });

    // 应用分页
    if (pagination) {
      const { current = 1, pageSize = 10 } = pagination;
      const start = (current - 1) * pageSize;
      const end = start + pageSize - 1;
      query = query.range(start, end);
    }

    // 应用排序
    if (sorters && sorters.length > 0) {
      sorters.forEach((sorter: any) => {
        query = query.order(sorter.field, {
          ascending: sorter.order === "asc",
        });
      });
    }

    // 应用过滤器
    if (filters) {
      filters.forEach((filter: any) => {
        if (
          "field" in filter &&
          filter.value !== undefined &&
          filter.value !== null &&
          filter.value !== ""
        ) {
          switch (filter.operator) {
            case "eq":
              query = query.eq(filter.field, filter.value);
              break;
            case "ne":
              query = query.neq(filter.field, filter.value);
              break;
            case "lt":
              query = query.lt(filter.field, filter.value);
              break;
            case "lte":
              query = query.lte(filter.field, filter.value);
              break;
            case "gt":
              query = query.gt(filter.field, filter.value);
              break;
            case "gte":
              query = query.gte(filter.field, filter.value);
              break;
            case "contains":
              query = query.ilike(filter.field, `%${filter.value}%`);
              break;
            case "in":
              query = query.in(
                filter.field,
                Array.isArray(filter.value) ? filter.value : [filter.value]
              );
              break;
            case "nin":
              query = query.not(
                filter.field,
                "in",
                `(${Array.isArray(filter.value) ? filter.value.join(",") : filter.value})`
              );
              break;
            case "null":
              query = query.is(filter.field, null);
              break;
            case "nnull":
              query = query.not(filter.field, "is", null);
              break;
          }
        }
      });
    }

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    return {
      data: data || [],
      total: count || 0,
    };
  },

  /**
   * 获取单个资源
   */
  getOne: async ({ resource, id, meta }: any) => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from(resource)
      .select(meta?.select || "*")
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    return { data };
  },

  /**
   * 获取多个资源
   */
  getMany: async ({ resource, ids, meta }: any) => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from(resource)
      .select(meta?.select || "*")
      .in("id", ids);

    if (error) {
      throw error;
    }

    return { data: data || [] };
  },

  /**
   * 创建资源
   */
  create: async ({ resource, variables, meta }: any) => {
    const supabase = createClient();

    const { data, error } = await supabase.from(resource).insert(variables).select().single();

    if (error) {
      throw error;
    }

    return { data };
  },

  /**
   * 批量创建资源
   */
  createMany: async ({ resource, variables }: any) => {
    const supabase = createClient();

    const { data, error } = await supabase.from(resource).insert(variables).select();

    if (error) {
      throw error;
    }

    return { data: data || [] };
  },

  /**
   * 更新资源
   */
  update: async ({ resource, id, variables, meta }: any) => {
    const supabase = createClient();

    // 自动添加 updated_at 字段
    const updateData = {
      ...variables,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(resource)
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data };
  },

  /**
   * 批量更新资源
   */
  updateMany: async ({ resource, ids, variables }: any) => {
    const supabase = createClient();

    const updateData = {
      ...variables,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from(resource).update(updateData).in("id", ids).select();

    if (error) {
      throw error;
    }

    return { data: data || [] };
  },

  /**
   * 删除资源
   */
  deleteOne: async ({ resource, id }: any) => {
    const supabase = createClient();

    const { data, error } = await supabase.from(resource).delete().eq("id", id).select().single();

    if (error) {
      throw error;
    }

    return { data };
  },

  /**
   * 批量删除资源
   */
  deleteMany: async ({ resource, ids }: any) => {
    const supabase = createClient();

    const { data, error } = await supabase.from(resource).delete().in("id", ids).select();

    if (error) {
      throw error;
    }

    return { data: data || [] };
  },

  /**
   * 获取 API URL
   */
  getApiUrl: () => {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  },

  /**
   * 自定义操作 - 支持 RPC 调用和复杂操作
   */
  custom: async ({ url, method, payload, query, headers }: any) => {
    const supabase = createClient();

    // 支持 Supabase RPC 调用
    if (method === "rpc") {
      const { data, error } = await supabase.rpc(url, payload);

      if (error) {
        throw error;
      }

      return { data };
    }

    // 支持自定义查询
    if (method === "query") {
      // 可以在这里添加更复杂的自定义查询逻辑
      throw new Error("Custom query not implemented");
    }

    throw new Error(`Custom method ${method} not supported`);
  },
};

/**
 * 辅助函数:批量授予积分
 */
export async function batchGrantCredits(userIds: string[], amount: number, reason: string) {
  const supabase = createClient();

  const events = userIds.map((userId) => ({
    user_id: userId,
    event_type: "admin_grant",
    credits_amount: amount,
    delta: amount,
    reason,
    metadata: {
      granted_at: new Date().toISOString(),
    },
  }));

  const { error } = await supabase.from("report_credit_events").insert(events);

  if (error) {
    throw error;
  }

  // 更新用户积分余额
  for (const userId of userIds) {
    const { data: currentCredits } = await supabase
      .from("report_credits")
      .select("credits_available")
      .eq("user_id", userId)
      .single();

    if (currentCredits) {
      await supabase
        .from("report_credits")
        .update({
          credits_available: (currentCredits.credits_available || 0) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }
  }

  return { success: true };
}

/**
 * 辅助函数:批量扣除积分
 */
export async function batchRevokeCredits(userIds: string[], amount: number, reason: string) {
  const supabase = createClient();

  const events = userIds.map((userId) => ({
    user_id: userId,
    event_type: "admin_revoke",
    credits_amount: amount,
    delta: -amount,
    reason,
    metadata: {
      revoked_at: new Date().toISOString(),
    },
  }));

  const { error } = await supabase.from("report_credit_events").insert(events);

  if (error) {
    throw error;
  }

  // 更新用户积分余额
  for (const userId of userIds) {
    const { data: currentCredits } = await supabase
      .from("report_credits")
      .select("credits_available")
      .eq("user_id", userId)
      .single();

    if (currentCredits) {
      const newBalance = Math.max(0, (currentCredits.credits_available || 0) - amount);
      await supabase
        .from("report_credits")
        .update({
          credits_available: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }
  }

  return { success: true };
}

/**
 * 辅助函数:获取用户统计数据
 */
export async function getUserStats(userId: string) {
  const supabase = createClient();

  const [profile, credits, reportRuns, creditEvents] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("report_credits").select("*").eq("user_id", userId).single(),
    supabase.from("report_runs").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("report_credit_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    profile: profile.data,
    credits: credits.data,
    totalReports: reportRuns.count || 0,
    recentCreditEvents: creditEvents.data || [],
  };
}
