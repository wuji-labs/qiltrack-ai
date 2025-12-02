import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createServerClient,
  createServiceRoleClient,
  uploadToStorage,
} from "@/lib/supabase/server";

// Mock @supabase/ssr
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  })),
}));

// Mock @supabase/supabase-js
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
    rpc: vi.fn(),
  })),
}));

describe("lib/supabase/server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createServerClient", () => {
    it("should throw if NEXT_PUBLIC_SUPABASE_URL is missing", () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      try {
        createServerClient({
          getAll: () => [],
        });
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect(String(err)).toContain("NEXT_PUBLIC_SUPABASE_URL");
      } finally {
        process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      }
    });

    it("should throw if NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", () => {
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      try {
        createServerClient({
          getAll: () => [],
        });
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect(String(err)).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
      } finally {
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
      }
    });

    it("should create client with valid env vars", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";

      const client = createServerClient({
        getAll: () => [],
      });

      expect(client).toBeDefined();
    });
  });

  describe("createServiceRoleClient", () => {
    it("should throw if NEXT_PUBLIC_SUPABASE_URL is missing", () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      try {
        createServiceRoleClient();
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect(String(err)).toContain("NEXT_PUBLIC_SUPABASE_URL");
      } finally {
        process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      }
    });

    it("should throw if SUPABASE_SERVICE_ROLE_KEY is missing", () => {
      const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      try {
        createServiceRoleClient();
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect(String(err)).toContain("SUPABASE_SERVICE_ROLE_KEY");
      } finally {
        process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
      }
    });

    it("should create client with valid env vars", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

      const client = createServiceRoleClient();

      expect(client).toBeDefined();
    });
  });

  describe("uploadToStorage", () => {
    it("should throw on upload error", async () => {
      const mockClient = {
        storage: {
          from: vi.fn(() => ({
            upload: vi.fn().mockResolvedValue({
              error: { message: "Upload failed" },
            }),
          })),
        },
      };

      try {
        await uploadToStorage(
          mockClient as unknown as ReturnType<typeof createServiceRoleClient>,
          "test-bucket",
          "test/path.md",
          "content"
        );
        expect.fail("Should have thrown");
      } catch (err) {
        expect(String(err)).toContain("Storage upload failed");
      }
    });

    it("should throw if signed URL generation fails", async () => {
      const mockClient = {
        storage: {
          from: vi.fn(() => ({
            upload: vi.fn().mockResolvedValue({ error: null }),
            createSignedUrl: vi.fn().mockResolvedValue({
              error: { message: "Sign failed" },
            }),
          })),
        },
      };

      try {
        await uploadToStorage(
          mockClient as unknown as ReturnType<typeof createServiceRoleClient>,
          "test-bucket",
          "test/path.md",
          "content"
        );
        expect.fail("Should have thrown");
      } catch (err) {
        expect(String(err)).toContain("signed URL");
      }
    });

    it("should return signed URL on success", async () => {
      const mockClient = {
        storage: {
          from: vi.fn(() => ({
            upload: vi.fn().mockResolvedValue({ error: null }),
            createSignedUrl: vi.fn().mockResolvedValue({
              error: null,
              data: { signedUrl: "https://example.com/signed" },
            }),
          })),
        },
      };

      const result = await uploadToStorage(
        mockClient as unknown as ReturnType<typeof createServiceRoleClient>,
        "test-bucket",
        "test/path.md",
        "content"
      );

      expect(result).toBe("https://example.com/signed");
    });
  });
});
