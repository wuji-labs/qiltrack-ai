# Codex–Claude 协作手册迁移决议 (2025-11-24)

## 背景 / 动机

- 协作主文档命名为 `CODEX_CLAUDE_COLLAB.md` 且位于仓库根目录，常被忽略或难以在 `docs/` 下检索，导致 AI 伙伴“找不到协作文档”。
- 多个入口（AGENTS、速查指南、YC 补充指南、历史报告）引用旧路径，易造成理解偏差或需要额外提示。
- 目标是明确单一“主文档”路径，同时保持旧链接可用，降低入场摩擦。

## 决策

1. 将协作主文档迁移到 `docs/guides/codex-claude-collaboration.md`，内容保持原样，并在文首声明其为主版本。
2. 根目录保留 `CODEX_CLAUDE_COLLAB.md` 作为跳转 stub，指向新路径，确保旧引用不失效。
3. 更新关键入口与历史引用（AGENTS、速查、YC 补充指南、相关报告）到新路径，并注明根目录 stub 以便习惯旧命名的用户。

## 技术约束

- 文档使用 UTF-8 编码，保持现有格式与用语（中文叙述，命令/路径用英文）。
- 不调整正文条款，仅增加位置声明与路径提示。

## 验收标准

- `rg "CODEX_CLAUDE_COLLAB"` 仅在根级 stub、主文档位置声明、已更新引用说明中出现，不再作为主阅读路径出现。
- AGENTS 与 `docs/guides/codex-claude-quickstart.md` 明确指向 `docs/guides/codex-claude-collaboration.md`，并注明根目录 stub。
- 旧文件 `CODEX_CLAUDE_COLLAB.md` 仍存在且能引导读者到新路径。

## 影响

- **正向**：提升可发现性与一致性，新成员默认在 `docs/guides/` 找到主协作规范；旧链接仍可用。
- **风险**：若后续新增文档继续引用旧路径，会重新引入混淆——需在 PR 审查中核对协作规范链接是否指向新路径。
