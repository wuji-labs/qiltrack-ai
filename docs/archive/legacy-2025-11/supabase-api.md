# Supabase API 文档（项目：inmtounwqcjwsxkfnsfd，生成时间：2025-12-02）

> 备份自 Supabase Dashboard「API」页面的 REST OpenAPI 文档，包含当前表结构与 RPC 定义。仅供内部使用，严禁在客户端暴露 service role key。

## 基础信息

- Base URL：`https://inmtounwqcjwsxkfnsfd.supabase.co`
- REST 入口：`/rest/v1`
- anon key（客户端公开）：`sb_publishable_hT6o-oVeTgfmMeWbP7fwaA_ZtBQEeGV`
- service role key（仅服务器/脚本）：`sb_secret_icUWGnicz6KtLXUS2sjSXg_onZWKkzP`
- 默认 schema：`public`，使用 PostgREST，遵循标准过滤/排序语法。

## 鉴权与请求头

- 所有请求需带 `apikey: <anon|service key>`，推荐同时带 `Authorization: Bearer <同一 key>`。
- 写操作（POST/PATCH/DELETE/RPC）建议添加 `Prefer: return=representation` 以返回写入后的记录。
- JSON 请求需 `Content-Type: application/json`。
- service role key 拥有绕过 RLS 的权限，只能在后端环境使用。

## 快速示例

```bash
# 查询单个 profile
curl -X GET \
  'https://inmtounwqcjwsxkfnsfd.supabase.co/rest/v1/profiles?id=eq.<uuid>' \
  -H 'apikey: sb_publishable_hT6o-oVeTgfmMeWbP7fwaA_ZtBQEeGV' \
  -H 'Authorization: Bearer sb_publishable_hT6o-oVeTgfmMeWbP7fwaA_ZtBQEeGV'

# 创建 report_run（返回写入值）
curl -X POST \
  'https://inmtounwqcjwsxkfnsfd.supabase.co/rest/v1/report_runs' \
  -H 'apikey: sb_secret_icUWGnicz6KtLXUS2sjSXg_onZWKkzP' \
  -H 'Authorization: Bearer sb_secret_icUWGnicz6KtLXUS2sjSXg_onZWKkzP' \
  -H 'Content-Type: application/json' \
  -H 'Prefer: return=representation' \
  -d '{\"user_id\":\"<uuid>\",\"template_id\":\"<uuid>\",\"symbol\":\"AAPL\"}'

# RPC 调用（示例：消费积分）
curl -X POST \
  'https://inmtounwqcjwsxkfnsfd.supabase.co/rest/v1/rpc/fn_consume_report_credit' \
  -H 'apikey: sb_secret_icUWGnicz6KtLXUS2sjSXg_onZWKkzP' \
  -H 'Authorization: Bearer sb_secret_icUWGnicz6KtLXUS2sjSXg_onZWKkzP' \
  -H 'Content-Type: application/json' \
  -d '{\"p_user_id\":\"<uuid>\",\"p_symbol\":\"AAPL\",\"p_metadata\":{}}'
```

## 查询语法速查（PostgREST）

- 过滤：`column=eq.value`、`column=in.(a,b)`、`column=like.*text*`
- 投影：`select=col1,col2,child(*)`
- 排序：`order=created_at.desc,nullsfirst`
- 分页：`range=0-19` 或使用 `Range-Unit` 头
- 模糊检索：`fts`, `plfts`, `phfts` 等 PostgreSQL 全文索引操作符

## OpenAPI 规范

- 文件：`docs/supabase-api-openapi.json`（从 `/rest/v1/` 以 `Accept: application/openapi+json` 抓取）
- 校验：`node -e "require('./docs/supabase-api-openapi.json'); console.log('ok')"`
- 该规范覆盖下述表与 RPC；更新 schema 后可按上述方式重新抓取替换。

## 数据表（public）

### billing_subscriptions
- id (uuid; default extensions.uuid_generate_v4(); PK)
- user_id (uuid)
- stripe_customer_id (text)
- stripe_subscription_id (text)
- plan_id (text)
- status (text)
- current_period_start (timestamp with time zone)
- current_period_end (timestamp with time zone)
- created_at (timestamp with time zone; default CURRENT_TIMESTAMP)
- updated_at (timestamp with time zone; default CURRENT_TIMESTAMP)

### copy_modules
- id (uuid; default extensions.uuid_generate_v4(); PK)
- module_key (text)
- module_value (jsonb)
- language (text; default en)
- created_at (timestamp with time zone; default CURRENT_TIMESTAMP)
- updated_at (timestamp with time zone; default CURRENT_TIMESTAMP)

### publications
- id (uuid; default extensions.uuid_generate_v4(); PK)
- title (text)
- description (text)
- url (text)
- published_date (date)
- category (text)
- created_at (timestamp with time zone; default CURRENT_TIMESTAMP)
- updated_at (timestamp with time zone; default CURRENT_TIMESTAMP)

### profiles
- id (uuid; default extensions.uuid_generate_v4(); PK)
- name (text)
- email (text)
- created_at (timestamp with time zone; default CURRENT_TIMESTAMP)
- display_name (text)
- avatar_url (text)
- plan (text; default free)
- stripe_customer_id (text)
- stripe_subscription_id (text)
- last_report_at (timestamp with time zone)
- updated_at (timestamp with time zone; default CURRENT_TIMESTAMP)
- role (text; default user)

### report_templates
- id (uuid; default extensions.uuid_generate_v4(); PK)
- name (text)
- description (text)
- category (text)
- slug (text)
- summary (text)
- tags (text[])
- hero_image_url (text)
- sections (jsonb)
- pills (text[])
- published_at (timestamp with time zone)
- language (text; default en)
- created_at (timestamp with time zone; default CURRENT_TIMESTAMP)
- updated_at (timestamp with time zone; default CURRENT_TIMESTAMP)

### report_runs
- id (uuid; default gen_random_uuid(); PK)
- mode (text; default production)
- user_id (uuid)
- template_id (uuid)
- symbol (text)
- tone (text)
- language (text; default en)
- status (text; default processing)
- model (text)
- company_snapshot (jsonb)
- duration_ms (integer)
- error (text)
- markdown_path (text)
- docx_path (text)
- created_at (timestamp with time zone; default CURRENT_TIMESTAMP)
- updated_at (timestamp with time zone; default CURRENT_TIMESTAMP)
- hash (text)
- reused_from_run_id (uuid)
- is_featured (boolean)
- lang (text; default en)
- pdf_path (text)
- content_md (text)
- content_html (text)
- meta (jsonb)

### research_topics
- id (uuid; default extensions.uuid_generate_v4(); PK)
- title (text)
- description (text)
- content (text)
- category (text)
- created_at (timestamp with time zone; default CURRENT_TIMESTAMP)
- updated_at (timestamp with time zone; default CURRENT_TIMESTAMP)

### pricing_plans
- id (uuid; default extensions.uuid_generate_v4(); PK)
- name (text)
- slug (text)
- description (text)
- price (numeric)
- currency (text; default USD)
- quota_limit (integer)
- features (jsonb)
- call_to_action (text)
- language (text; default en)
- published (boolean; default true)
- created_at (timestamp with time zone; default CURRENT_TIMESTAMP)
- updated_at (timestamp with time zone; default CURRENT_TIMESTAMP)

### report_credit_events
- id (uuid; default extensions.uuid_generate_v4(); PK)
- user_id (uuid)
- event_type (text)
- credits_amount (integer)
- reason (text)
- created_at (timestamp with time zone; default CURRENT_TIMESTAMP)
- metadata (jsonb)
- delta (integer)

### report_documents_backup
- id (uuid)
- report_run_id (uuid)
- document_type (text)
- storage_path (text)

### report_credits
- id (uuid; default extensions.uuid_generate_v4(); PK)
- user_id (uuid)
- credits_available (integer; default 5)
- credits_used (integer)
- last_reset (timestamp with time zone; default CURRENT_TIMESTAMP)
- created_at (timestamp with time zone; default CURRENT_TIMESTAMP)
- updated_at (timestamp with time zone; default CURRENT_TIMESTAMP)

### reports_embeddings
- id (uuid; default extensions.uuid_generate_v4(); PK)
- report_run_id (uuid)
- chunk_index (integer)
- embedding (public.vector(1536))
- lang (text)
- tone (text)
- created_at (timestamp with time zone; default CURRENT_TIMESTAMP)

### faq_entries
- id (uuid; default extensions.uuid_generate_v4(); PK)
- question (text)
- answer (text)
- category (text)
- language (text; default en)
- order_index (integer)
- created_at (timestamp with time zone; default CURRENT_TIMESTAMP)
- updated_at (timestamp with time zone; default CURRENT_TIMESTAMP)

### report_documents
- id (uuid; default gen_random_uuid(); PK)
- report_run_id (uuid)
- document_type (text; default markdown)
- storage_path (text)
- created_at (timestamp with time zone; default CURRENT_TIMESTAMP)

### audit_logs
- id (uuid; default extensions.uuid_generate_v4(); PK)
- user_id (uuid)
- action (text)
- resource_type (text)
- resource_id (text)
- details (jsonb)
- created_at (timestamp with time zone; default CURRENT_TIMESTAMP)

## RPC（/rest/v1/rpc）

### fn_record_report_run
- p_report_data (jsonb)
- p_storage_path (text)
- p_template_id (uuid)
- p_user_id (uuid)

### fn_get_popular_symbols
- p_limit (integer)
- p_range_days (integer)

### fn_compute_report_hash
- p_lang (text)
- p_mode (text)
- p_symbol (text)

### fn_consume_report_credit
- p_metadata (jsonb)
- p_symbol (text)
- p_user_id (uuid)

### match_reports_embeddings
- p_lang (text)
- p_match_count (integer)
- p_query_run_id (uuid)
- p_tone (text)
- p_user_id (uuid)

### fn_find_reusable_report
- p_lang (text)
- p_mode (text)
- p_symbol (text)

### fn_initialize_profile
- p_email (text)
- p_user_id (uuid)

## 重新生成

1) 设置 key：`$service='sb_secret_icUWGnicz6KtLXUS2sjSXg_onZWKkzP'`
2) 拉取规范：`curl -H \"Accept: application/openapi+json\" -H \"apikey: $service\" -H \"Authorization: Bearer $service\" -A \"supabase-cli/1.0\" https://inmtounwqcjwsxkfnsfd.supabase.co/rest/v1/ -o docs/supabase-api-openapi.json`
3) 更新本文件：将上方表/RPC 列表按新规范替换。
