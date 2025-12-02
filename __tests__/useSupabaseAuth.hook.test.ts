import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

const { createClientComponentClientMock } = vi.hoisted(() => ({
  createClientComponentClientMock: vi.fn(),
}));

vi.mock("@supabase/auth-helpers-nextjs", () => ({
  createClientComponentClient: (...args: unknown[]) => createClientComponentClientMock(...args),
}));

function createMockFrom() {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  chain.select.mockImplementation(() => chain);
  chain.eq.mockImplementation(() => chain);
  return chain;
}

describe("useSupabaseAuth", () => {
  let signInWithOtp: ReturnType<typeof vi.fn>;
  let signInWithOAuth: ReturnType<typeof vi.fn>;
  type MockSupabase = ReturnType<typeof buildMockSupabase>;
  let mockSupabase: MockSupabase;

  function buildMockSupabase() {
    const fromChain = createMockFrom();
    signInWithOtp = vi.fn().mockResolvedValue({ error: null });
    signInWithOAuth = vi.fn().mockResolvedValue({ error: null });

    return {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
        signInWithOtp,
        signInWithOAuth,
        signOut: vi.fn().mockResolvedValue({ error: null }),
        refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      },
      from: vi.fn().mockReturnValue(fromChain),
    };
  }

  beforeEach(() => {
    mockSupabase = buildMockSupabase();
    createClientComponentClientMock.mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns cooldown code on 429", async () => {
    signInWithOtp.mockResolvedValueOnce({
      error: { message: "rate limited", status: 429 },
    });
    const { result } = renderHook(() => useSupabaseAuth());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let response: any;
    await act(async () => {
      response = await result.current.signInWithEmail("user@example.com");
    });
    expect(response.success).toBe(false);
    expect(response.code).toBe("cooldown");
  });

  it("blocks invalid email before calling supabase", async () => {
    const { result } = renderHook(() => useSupabaseAuth());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let response: any;
    await act(async () => {
      response = await result.current.signInWithEmail("not-an-email");
    });
    expect(response.success).toBe(false);
    expect(response.code).toBe("invalid_email");
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it("signs in with email when valid", async () => {
    const { result } = renderHook(() => useSupabaseAuth());
    await act(async () => {
      await result.current.signInWithEmail("valid@example.com");
    });
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "valid@example.com",
      options: { emailRedirectTo: expect.stringContaining("/api/auth/callback") },
    });
  });

  it("signs in with google provider", async () => {
    const { result } = renderHook(() => useSupabaseAuth());
    await act(async () => {
      await result.current.signInWithProvider("google");
    });
    expect(signInWithOAuth).toHaveBeenCalledWith({
      options: { redirectTo: expect.stringContaining("/api/auth/callback") },
      provider: "google",
    });
  });
});
