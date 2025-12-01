import { DataProvider } from "@refinedev/core";
import { createClient } from "@/lib/supabase/client";

/**
 * Supabase Data Provider for Refine
 *
 * Provides CRUD operations for Refine Admin panel using Supabase
 */
export const supabaseDataProvider: DataProvider = {
  /**
   * Get list of resources with filtering, sorting, and pagination
   */
  getList: async ({ resource, pagination, sorters, filters }) => {
    const supabase = createClient();
    let query = supabase.from(resource).select("*", { count: "exact" });

    // Apply pagination
    if (pagination) {
      const { current = 1, pageSize = 10 } = pagination;
      const start = (current - 1) * pageSize;
      const end = start + pageSize - 1;
      query = query.range(start, end);
    }

    // Apply sorting
    if (sorters && sorters.length > 0) {
      const sorter = sorters[0];
      query = query.order(sorter.field, {
        ascending: sorter.order === "asc",
      });
    }

    // Apply filters
    if (filters) {
      filters.forEach((filter) => {
        if ("field" in filter) {
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
              query = query.in(filter.field, filter.value);
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
   * Get a single resource by ID
   */
  getOne: async ({ resource, id }) => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from(resource)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    return { data };
  },

  /**
   * Create a new resource
   */
  create: async ({ resource, variables }) => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from(resource)
      .insert(variables)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data };
  },

  /**
   * Update an existing resource
   */
  update: async ({ resource, id, variables }) => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from(resource)
      .update(variables)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data };
  },

  /**
   * Delete a resource
   */
  deleteOne: async ({ resource, id }) => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from(resource)
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data };
  },

  /**
   * Get API URL (not used with Supabase)
   */
  getApiUrl: () => {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  },

  /**
   * Custom method - not required but useful
   */
  custom: async ({ url, method, payload }) => {
    // Can be used for custom RPC calls
    throw new Error("Custom method not implemented");
  },
};
