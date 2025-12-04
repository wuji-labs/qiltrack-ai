/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreditManager } from "./manager";
import { InsufficientCreditsError, UnauthorizedError } from "../errors";

// Mock the Supabase server module
const mockSupabase = {
  rpc: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  raw: vi.fn((sql: string) => sql),
};

// Setup mock chaining
mockSupabase.from.mockReturnValue(mockSupabase);
mockSupabase.select.mockReturnValue(mockSupabase);
mockSupabase.insert.mockReturnValue(mockSupabase);
mockSupabase.update.mockReturnValue(mockSupabase);
mockSupabase.eq.mockReturnValue(mockSupabase);
mockSupabase.order.mockReturnValue(mockSupabase);
mockSupabase.limit.mockReturnValue(mockSupabase);

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("CreditManager", () => {
  let manager: CreditManager;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.rpc.mockReset();
    mockSupabase.from.mockReset();
    mockSupabase.select.mockReset();
    mockSupabase.insert.mockReset();
    mockSupabase.update.mockReset();
    mockSupabase.eq.mockReset();
    mockSupabase.single.mockReset();
    mockSupabase.order.mockReset();
    mockSupabase.limit.mockReset();
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.insert.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.order.mockReturnValue(mockSupabase);
    mockSupabase.limit.mockReturnValue(mockSupabase);
    mockSupabase.single.mockResolvedValue({ data: null, error: null });
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
    mockSupabase.limit.mockResolvedValue({ data: [], error: null });
    mockSupabase.insert.mockResolvedValue({ error: null });
    manager = new CreditManager();
  });

  describe("checkAndConsume", () => {
    it("should consume 1 credit when balance is sufficient", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [{ success: true, remaining_credits: 24 }],
        error: null,
      });

      const result = await manager.checkAndConsume("user-123", 1, "AAPL");

      expect(mockSupabase.rpc).toHaveBeenCalledWith("fn_consume_report_credit", {
        p_user_id: "user-123",
        p_symbol: "AAPL",
        p_metadata: null,
      });
      expect(result.success).toBe(true);
      expect(result.remaining_credits).toBe(24);
    });

    it("should throw InsufficientCreditsError when balance is 0", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [{ success: false, remaining_credits: 0 }],
        error: null,
      });

      await expect(
        manager.checkAndConsume("user-123", 1)
      ).rejects.toThrow(InsufficientCreditsError);
    });

    it("should throw Error when RPC fails", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      await expect(
        manager.checkAndConsume("user-123", 1)
      ).rejects.toThrow("Failed to consume credit: Database error");
    });

    it("should consume multiple credits with p_cost parameter", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [{ success: true, remaining_credits: 20 }],
        error: null,
      });

      const result = await manager.checkAndConsume("user-123", 5);

      expect(mockSupabase.rpc).toHaveBeenCalledWith("fn_consume_report_credit", {
        p_user_id: "user-123",
        p_cost: 5,
      });
      expect(result.remaining_credits).toBe(20);
    });

    it("should pass metadata when provided", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [{ success: true, remaining_credits: 24 }],
        error: null,
      });

      await manager.checkAndConsume("user-123", 1, "AAPL", { test: "data" });

      expect(mockSupabase.rpc).toHaveBeenCalledWith("fn_consume_report_credit", {
        p_user_id: "user-123",
        p_symbol: "AAPL",
        p_metadata: { test: "data" },
      });
    });
  });

  describe("getBalance", () => {
    it("should return credit balance for user", async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          credits_available: 25,
          credits_used: 5,
          updated_at: "2025-12-02T00:00:00Z",
        },
        error: null,
      });

      const balance = await manager.getBalance("user-123");

      expect(mockSupabase.from).toHaveBeenCalledWith("report_credits");
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user-123");
      expect(balance.credits_available).toBe(25);
      expect(balance.credits_used).toBe(5);
      expect(balance.last_updated).toBe("2025-12-02T00:00:00Z");
    });

    it("should return default balance when no record exists", async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null,
      });

      const balance = await manager.getBalance("user-123");

      expect(balance.credits_available).toBe(0);
      expect(balance.credits_used).toBe(0);
    });

    it("should throw Error when query fails", async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      await expect(
        manager.getBalance("user-123")
      ).rejects.toThrow("Failed to get credit balance: Database error");
    });
  });

  describe("claimDailyReward", () => {
    it("should grant daily reward successfully", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [{
          success: true,
          remaining_credits: 35,
          message: "成功领取每日奖励 10 积分",
        }],
        error: null,
      });

      const result = await manager.claimDailyReward("user-123");

      expect(mockSupabase.rpc).toHaveBeenCalledWith("fn_claim_daily_reward", {
        p_user_id: "user-123",
      });
      expect(result.success).toBe(true);
      expect(result.remaining_credits).toBe(35);
    });

    it("should throw error when already claimed today", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [{
          success: false,
          remaining_credits: 25,
          message: "今日已领取",
        }],
        error: null,
      });

      const result = await manager.claimDailyReward("user-123");

      expect(result.success).toBe(false);
    });

    it("should throw Error when RPC fails", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "RPC error" },
      });

      await expect(
        manager.claimDailyReward("user-123")
      ).rejects.toThrow("Failed to claim daily reward: RPC error");
    });
  });

  describe("grantCredits", () => {
    it("should grant credits when user is admin", async () => {
      // Mock admin check
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { role: "admin" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            credits_available: 35,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { credits_available: 35 },
          error: null,
        });

      mockSupabase.insert.mockResolvedValue({
        error: null,
      });

      const result = await manager.grantCredits(
        "admin-123",
        "user-456",
        10,
        "Bonus"
      );

      expect(result.success).toBe(true);
      expect(result.remaining_credits).toBe(35);
      expect(result.message).toContain("成功授予 10 积分");
    });

    it("should throw UnauthorizedError when user is not admin", async () => {
      mockSupabase.single.mockResolvedValue({
        data: { role: "user" },
        error: null,
      });

      await expect(
        manager.grantCredits("user-123", "user-456", 10, "Bonus")
      ).rejects.toThrow(UnauthorizedError);
    });

    it("should throw Error when update fails", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { role: "admin" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: "Update failed" },
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: "Update failed" },
        });

      await expect(
        manager.grantCredits("admin-123", "user-456", 10, "Bonus")
      ).rejects.toThrow("Failed to grant credits: Update failed");
    });
  });

  describe("getTransactionHistory", () => {
    it("should return transaction history for user", async () => {
      const mockHistory = [
        {
          id: "tx-1",
          user_id: "user-123",
          event_type: "consumed",
          credits_amount: 1,
          delta: -1,
          created_at: "2025-12-02T10:00:00Z",
        },
        {
          id: "tx-2",
          user_id: "user-123",
          event_type: "granted",
          credits_amount: 10,
          delta: 10,
          created_at: "2025-12-01T10:00:00Z",
        },
      ];

      mockSupabase.limit.mockResolvedValue({
        data: mockHistory,
        error: null,
      });

      const history = await manager.getTransactionHistory("user-123", 50);

      expect(mockSupabase.from).toHaveBeenCalledWith("report_credit_events");
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user-123");
      expect(mockSupabase.limit).toHaveBeenCalledWith(50);
      expect(history).toHaveLength(2);
      expect(history[0].event_type).toBe("consumed");
    });

    it("should return empty array when no history exists", async () => {
      mockSupabase.limit.mockResolvedValue({
        data: null,
        error: null,
      });

      const history = await manager.getTransactionHistory("user-123");

      expect(history).toEqual([]);
    });

    it("should throw Error when query fails", async () => {
      mockSupabase.limit.mockResolvedValue({
        data: null,
        error: { message: "Query error" },
      });

      await expect(
        manager.getTransactionHistory("user-123")
      ).rejects.toThrow("Failed to get transaction history: Query error");
    });
  });

  describe("initializeCredits", () => {
    it("should initialize credits for new user", async () => {
      mockSupabase.insert
        .mockResolvedValueOnce({
          error: null,
        })
        .mockResolvedValueOnce({
          error: null,
        });

      await manager.initializeCredits("user-123", 30);

      expect(mockSupabase.from).toHaveBeenCalledWith("report_credits");
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: "user-123",
        credits_available: 30,
        credits_used: 0,
      });
    });

    it("should ignore unique constraint violation", async () => {
      mockSupabase.insert
        .mockResolvedValueOnce({
          error: { code: "23505", message: "Duplicate key" },
        })
        .mockResolvedValueOnce({
          error: null,
        });

      // Should not throw
      await expect(
        manager.initializeCredits("user-123", 30)
      ).resolves.toBeUndefined();
    });

    it("should throw Error for other database errors", async () => {
      mockSupabase.insert.mockResolvedValue({
        error: { code: "OTHER", message: "Some error" },
      });

      await expect(
        manager.initializeCredits("user-123", 30)
      ).rejects.toThrow("Failed to initialize credits: Some error");
    });
  });
});
