/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServiceRoleClient } from "../supabase/server";
import { ExternalServiceError } from "../core/errors";

/**
 * Upload result
 */
export interface UploadResult {
  path: string;
  publicUrl: string;
}

/**
 * Storage Service handles all interactions with Supabase Storage
 */
export class StorageService {
  private bucket: string;

  constructor(bucket: string = "report-outputs") {
    this.bucket = bucket;
  }

  /**
   * Upload file to storage
   *
   * @param path - File path in storage (e.g. "reports/123.json")
   * @param content - File content (string or Buffer)
   * @param contentType - MIME type
   * @returns Upload result with public URL
   */
  async uploadFile(
    path: string,
    content: string | Buffer,
    contentType: string = "application/json"
  ): Promise<UploadResult> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase.storage
      .from(this.bucket)
      .upload(path, content, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new ExternalServiceError(
        `Failed to upload file: ${error.message}`,
        { path, error: error.message }
      );
    }

    if (!data) {
      throw new ExternalServiceError("Upload failed: No data returned", {
        path,
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(path);

    return {
      path: data.path,
      publicUrl: urlData.publicUrl,
    };
  }

  /**
   * Upload report JSON
   *
   * @param reportId - Report ID
   * @param content - Report content
   * @returns Upload result
   */
  async uploadReportJson(
    reportId: string,
    content: any
  ): Promise<UploadResult> {
    const path = `reports/${reportId}.json`;
    const json = JSON.stringify(content, null, 2);

    return await this.uploadFile(path, json, "application/json");
  }

  /**
   * Upload report cover image
   *
   * @param reportId - Report ID
   * @param imageData - Image data (Buffer or base64 string)
   * @param format - Image format (png, jpg, etc.)
   * @returns Upload result
   */
  async uploadReportCover(
    reportId: string,
    imageData: Buffer | string,
    format: string = "png"
  ): Promise<UploadResult> {
    const path = `covers/${reportId}.${format}`;
    const contentType = `image/${format}`;

    // Convert base64 to buffer if needed
    let buffer: Buffer;
    if (typeof imageData === "string") {
      // Remove data URL prefix if present
      const base64Data = imageData.replace(
        /^data:image\/\w+;base64,/,
        ""
      );
      buffer = Buffer.from(base64Data, "base64");
    } else {
      buffer = imageData;
    }

    return await this.uploadFile(path, buffer, contentType);
  }

  /**
   * Delete file from storage
   *
   * @param path - File path to delete
   */
  async deleteFile(path: string): Promise<void> {
    const supabase = createServiceRoleClient();

    const { error } = await supabase.storage
      .from(this.bucket)
      .remove([path]);

    if (error) {
      throw new ExternalServiceError(
        `Failed to delete file: ${error.message}`,
        { path, error: error.message }
      );
    }
  }

  /**
   * Get public URL for a file
   *
   * @param path - File path
   * @returns Public URL
   */
  getPublicUrl(path: string): string {
    const supabase = createServiceRoleClient();

    const { data } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Check if file exists
   *
   * @param path - File path to check
   * @returns True if file exists
   */
  async fileExists(path: string): Promise<boolean> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase.storage
      .from(this.bucket)
      .list(path.split("/").slice(0, -1).join("/"), {
        search: path.split("/").pop(),
      });

    if (error) {
      return false;
    }

    return data && data.length > 0;
  }
}
