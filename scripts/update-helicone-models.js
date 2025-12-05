#!/usr/bin/env node
/**
 * Fetches the Helicone public model registry and stores both the raw payload
 * and a simplified snapshot that the app can consume.
 */
const https = require("https");
const fs = require("fs");
const path = require("path");

const REGISTRY_URL =
  process.env.HELICONE_MODEL_REGISTRY_URL ||
  "https://api.helicone.ai/v1/public/model-registry/models";
const ROOT = path.resolve(__dirname, "..");
const RAW_OUTPUT = path.join(ROOT, "helicone-model-registry.json");
const SNAPSHOT_OUTPUT = path.join(ROOT, "helicone-models.json");

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "qiltrack-ai-model-sync",
          },
        },
        (res) => {
          const { statusCode, headers } = res;
          if (statusCode && statusCode >= 300 && headers.location) {
            res.resume();
            return fetchJson(headers.location).then(resolve).catch(reject);
          }
          if (statusCode && statusCode >= 400) {
            res.resume();
            return reject(
              new Error(`Failed to fetch registry: ${statusCode} ${res.statusMessage}`)
            );
          }

          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            try {
              const body = Buffer.concat(chunks).toString("utf-8");
              resolve(JSON.parse(body));
            } catch (err) {
              reject(new Error(`Unable to parse registry payload: ${err}`));
            }
          });
        }
      )
      .on("error", (err) => reject(err));
  });
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function simplifyModels(models) {
  return models
    .map((model) => ({
      id: model.id,
      name: model.name,
      provider: model.author,
      contextLength: typeof model.contextLength === "number" ? model.contextLength : null,
      inputModalities: toArray(model.inputModalities),
      outputModalities: toArray(model.outputModalities),
      tags: toArray(model.tags),
    }))
    .filter((model) => Boolean(model.id))
    .sort((a, b) => {
      const providerCmp = (a.provider || "").localeCompare(b.provider || "", "en");
      if (providerCmp !== 0) return providerCmp;
      return a.id.localeCompare(b.id, "en");
    });
}

async function main() {
  try {
    console.info("[helicone] Fetching model registry…");
    const registry = await fetchJson(REGISTRY_URL);
    const models = registry?.data?.models || [];
    console.info(`[helicone] Received ${models.length} models`);

    const simplified = simplifyModels(models);
    const snapshot = {
      object: "list",
      fetchedAt: new Date().toISOString(),
      source: REGISTRY_URL,
      total: simplified.length,
      data: simplified,
    };

    fs.writeFileSync(RAW_OUTPUT, JSON.stringify(registry, null, 2));
    fs.writeFileSync(SNAPSHOT_OUTPUT, JSON.stringify(snapshot, null, 2));
    console.info(
      `[helicone] Saved raw registry to ${path.relative(
        ROOT,
        RAW_OUTPUT
      )} and snapshot to ${path.relative(ROOT, SNAPSHOT_OUTPUT)}`
    );
  } catch (err) {
    console.error("[helicone] Failed to sync registry:", err);
    process.exitCode = 1;
  }
}

main();
