# Codex–Claude Collaboration Guide

This playbook explains how the Codex architect agent and the Claude implementation agent coordinate on the investor-ai project. It defines responsibilities, shared rituals, and the artifacts needed to keep work aligned with the repository guidelines in `AGENTS.md`.

## 1. Purpose & Scope
- Guarantee every feature/change starts with an explicit architecture intent (Codex) and ends with reviewed, tested code (Claude).
- Maintain end-to-end traceability from product goals → design notes → PRs → release notes.
- Keep turnaround fast by operating asynchronously yet predictably.

## 2. Roles & Responsibilities
### Codex (Architect + Reviewer)
- Intake product/user asks, restate requirements, and highlight constraints (.env, API limits, tailwind themes, etc.).
- Produce lightweight architecture notes, interface contracts, test expectations, and sequencing of tasks.
- During implementation, answer design questions, unblock Claude, and adjust scope as repo context evolves.
- Perform code reviews focused on correctness, architectural integrity, and adherence to lint/test strategy; call out missing tests or risk areas.

### Claude (Programmer + Executor)
- Break Codex's plan into actionable subtasks, estimating effort and dependencies.
- Implement features/tests following repo standards (Next.js App Router, Tailwind v4, Vitest coverage) and keep worktree changes scoped.
- Surface uncertainties early (API assumptions, schema ambiguity, env gaps) with proposed resolutions.
- Provide rich status updates: what changed, verification (lint/test/manual), and outstanding risks to feed back into Codex's review cycle.

## 3. Shared Principles
- **Single source of truth**: requirements live in Codex-authored notes and are mirrored in README/PLAN updates when scope shifts.
- **Incremental delivery**: prefer vertical slices per section (Hero/Modes/etc.) with feature flags/mock data when APIs are unstable.
- **Test-first mindset**: Codex defines success metrics; Claude encodes them in Vitest or integration harnesses.
- **Traceable communication**: decisions captured in `docs/` or issue comments; avoid relying on transient chat logs.

## 4. Collaboration Workflow
1. **Context Sync**
   - Codex: consolidate latest repo state, AGENTS rules, and user brief → publish "Architecture Snapshot" (why, scope, constraints, risks).
   - Claude: acknowledge snapshot, list clarifying questions, and confirm dependencies (env vars, mock data, API fixtures).
2. **Design & Task Breakdown**
   - Codex: provide component tree, data-flow diagrams, API contracts, and testing matrix; identify reusable hooks/services.
   - Claude: create implementation checklist (files to touch, new components/hooks, test files) referencing Codex's numbering for easy review.
3. **Implementation Loop**
   - Claude develops in short branches, running `npm run lint`/`npm test`. Each chunk ends with a change note (summary, files, verification, follow-ups).
   - Codex is on-call for feedback, approves design adjustments, and ensures global architecture docs stay current.
4. **Review & Validation**
   - Codex reviews diffs for behavior, resilience, and style; flags blocking issues, high-risk decisions, and doc/test gaps.
   - Claude addresses feedback, tags tests/manual checks performed, and records any residual debt.
5. **Knowledge Capture**
   - Codex updates strategy/plan docs with final architecture patterns.
   - Claude updates README snippets, env instructions, or adds regression tests per review outcomes.

## 5. Communication Protocols
- **Status Updates (Claude → Codex)**: `Context → Actions → Verification → Risks/Needs` (CAVR). Keep logs in PR descriptions or `PLAN.md` blocks.
- **Design Decisions (Codex → Claude)**: `Decision → Rationale → Alternatives → Impact`. Store in `docs/decisions/<date>-<topic>.md`.
- **Question Handling**: Claude batches clarifications unless blocking; Codex responds with either authoritative answer or directs to experiment/test.
- **Urgent Escalations**: Use #blocking label (literal text) in messages so Codex prioritizes response.
- **Language Constraint**: All Codex → Claude updates delivered to the user must be written in Chinese; when referencing code/commands keep them in English but surround narrative with 中文说明。
- **Handoff Prompt**: 每当 Codex 发布 Architecture Snapshot 后，用户可直接复制粘贴指令给 Claude，替换文件路径即可，确保交接流程短且固定。`@Claude 请按照 docs/decisions/<date>-<topic>.md 中 Architecture Snapshot 执行，完成后以 CAVR（Context / Actions / Verification / Risks）汇报，并附上 npm run lint / npm test 结果。若 scope 变动 >20%，请触发 mini design review。`

## 6. Required Artifacts per Work Item
| Stage | Owner | Artifact | Notes |
| --- | --- | --- | --- |
| Kickoff | Codex | Architecture Snapshot | Problem, scope, acceptance tests, dependencies |
| Planning | Claude | Implementation Checklist | File list, ordered subtasks, env/test needs |
| Dev | Claude | Change Notes | After each chunk; include lint/test output summary |
| Review | Codex | Review Log | Findings ordered by severity, referencing file paths |
| Closeout | Both | Knowledge Capture | Updates to README/PLAN/tests + TODO debt list |

## 7. Quality Gates & Checklists
- Lint + tests green locally before Codex review.
- Tailwind tokens updated via `@theme inline` when adding new colors/spacings; document defaults.
- API interactions mocked under `lib/services/api` tests when possible; real-call scripts live in `test-api.js`.
- Accessibility: run through keyboard nav + minimum color contrast for any UI-affecting change.
- Deployment readiness: confirm `.env.local.example` updates whenever new env vars appear.

## 8. Escalation & Decision Logging
- If implementation diverges from plan (>20% scope change), Claude pings Codex for a "mini design review". No deviation proceeds without recorded approval.
- Critical bugs or production regressions trigger an incident note (timestamp, impact, fix plan) maintained by Codex; Claude attaches remediation tasks.
- Disagreements resolved via ADR (architecture decision record) stored alongside docs; Codex owns final call but documents rationale.

## 9. Quick-Start Checklist
1. Codex posts latest snapshot before handing new work to Claude.
2. Claude replies with checklist + clarification questions.
3. Both confirm tooling/commands (`npm run dev`, `npm run lint`, `npm test`) run locally.
4. Claude builds feature in slices, logging CAVR updates.
5. Codex reviews with severity-ranked findings; iterate until clean.
6. Update docs/tests/env samples; archive decision log entry.

By following this guide, Codex and Claude can operate as a tight architect–engineer duo, keeping architecture intent and shipped code perfectly aligned across the investor-ai codebase.
