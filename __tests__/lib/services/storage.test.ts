/**
 * Storage Service Tests
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: { path: 'test.json' }, error: null })),
        createSignedUrl: vi.fn(() =>
          Promise.resolve({ data: { signedUrl: 'https://example.com/signed' }, error: null })
        ),
      })),
    },
  })),
}));

describe('StorageService', () => {
  describe('uploadReport', () => {
    it('should upload file to storage', async () => {
      const { uploadReport } = await import('@/lib/services/storage');

      const path = await uploadReport('user-123', 'report-456', '# Report', 'json');

      expect(path).toContain('reports/user-123/report-456');
    });
  });

  describe('getSignedUrl', () => {
    it('should generate signed URL', async () => {
      const { getSignedUrl } = await import('@/lib/services/storage');

      const url = await getSignedUrl('reports/test.json', 3600);

      expect(url).toContain('https://');
    });
  });
});
