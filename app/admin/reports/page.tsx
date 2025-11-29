"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import {
	createAdminReportPost,
	fetchReportPosts,
	updateAdminReportPost,
	uploadAdminAsset,
} from "@/lib/services/api";
import type { ReportPost } from "@/types/report";

type Role = "admin" | "editor" | "user" | null;

const PAGE_SIZE = 10;
const EMPTY_POST: ReportPost = {
	title: "",
	slug: "",
	summary: "",
	body: "",
	cover: "",
	theme: "",
	tags: [],
	lang: "en",
	status: "draft",
	version: 1,
};

export default function AdminReportsPage() {
	const { isAuthenticated, loading, getUserProfile } = useSupabaseAuth();
	const [role, setRole] = useState<Role>(null);
	const [posts, setPosts] = useState<ReportPost[]>([]);
	const [page, setPage] = useState(1);
	const [pages, setPages] = useState(1);
	const [total, setTotal] = useState(0);
	const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
	const [query, setQuery] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);

	const [editorOpen, setEditorOpen] = useState(false);
	const [editing, setEditing] = useState<ReportPost>(EMPTY_POST);
	const [saving, setSaving] = useState(false);
	const [uploadMessage, setUploadMessage] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		const loadProfile = async () => {
			if (!isAuthenticated || loading) return;
			const profile = await getUserProfile();
			if (!cancelled && profile) {
				const userRole = (profile as { role?: Role }).role;
				setRole(userRole ?? null);
			}
		};
		void loadProfile();
		return () => {
			cancelled = true;
		};
	}, [isAuthenticated, loading, getUserProfile]);

	useEffect(() => {
		if (!isAuthenticated || (role !== "admin" && role !== "editor")) return;
		let cancelled = false;
		const loadPosts = async () => {
			setIsLoading(true);
			setError(null);
			try {
				const data = await fetchReportPosts({
					page,
					limit: PAGE_SIZE,
					status: statusFilter === "all" ? undefined : statusFilter,
					query: query.trim() || undefined,
				});
				if (cancelled) return;
				setPosts(data.posts);
				setTotal(data.pagination.total);
				const nextPages = Math.max(1, data.pagination.pages);
				setPages(nextPages);
				if (page > nextPages) {
					setPage(nextPages);
				}
			} catch (err) {
				if (cancelled) return;
				console.error("Failed to load admin report posts", err);
				setError("加载报告列表失败，请稍后重试。");
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		};
		void loadPosts();
		return () => {
			cancelled = true;
		};
	}, [isAuthenticated, role, page, statusFilter, query, refreshKey]);

	const isAllowed = useMemo(() => role === "admin" || role === "editor", [role]);

	const openEditor = (post?: ReportPost) => {
		if (post) {
			setEditing({
				...post,
				tags: post.tags || [],
			});
		} else {
			setEditing(EMPTY_POST);
		}
		setUploadMessage(null);
		setEditorOpen(true);
	};

	const handleSave = async () => {
		if (!editing.title || !editing.slug) {
			setError("标题和 slug 为必填项。");
			return;
		}

		setSaving(true);
		setError(null);
		try {
			const payload = {
				id: editing.id,
				title: editing.title,
				slug: editing.slug,
				summary: editing.summary ?? "",
				body: editing.body ?? "",
				cover: editing.cover ?? "",
				theme: editing.theme ?? "",
				tags: editing.tags ?? [],
				lang: editing.lang ?? "en",
				status: editing.status ?? "draft",
				version: editing.version ?? 1,
			};

			if (editing.id) {
				await updateAdminReportPost(payload);
			} else {
				await createAdminReportPost(payload as Required<typeof payload>);
			}
			setEditorOpen(false);
			// refresh list
			setPage(1);
			setRefreshKey((prev) => prev + 1);
		} catch (err) {
			console.error("保存失败", err);
			setError("保存失败，请稍后重试。");
		} finally {
			setSaving(false);
		}
	};

	const handleUpload = async (file: File) => {
		try {
			setUploadMessage("正在上传…");
			const result = await uploadAdminAsset(file, {
				title: editing.title || file.name,
				status: "approved",
			});
			setUploadMessage("上传成功，已填入存储路径；渲染时将自动签名或走公开路径。");
			setEditing((prev) => ({
				...prev,
				cover: result.upload.file_path,
			}));
		} catch (err) {
			console.error("上传失败", err);
			setUploadMessage("上传失败，请重试。");
		}
	};

	if (loading || (isAuthenticated && role === null)) {
		return (
			<div className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)] flex items-center justify-center">
				<p className="text-sm text-subtle">正在加载权限...</p>
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)] flex items-center justify-center px-4">
				<div className="w-full max-w-md space-y-4 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 p-6 text-center shadow-xl">
					<h1 className="text-2xl font-semibold">需要登录</h1>
					<p className="text-sm text-subtle">请先登录后访问管理后台。</p>
					<Link
						href="/login"
						className="block w-full rounded-xl bg-[var(--accent-emerald)] py-2.5 text-base font-semibold text-slate-950 shadow-[0_12px_28px_rgba(91,224,176,0.28)] transition hover:brightness-105"
					>
						去登录
					</Link>
				</div>
			</div>
		);
	}

	if (!isAllowed) {
		return (
			<div className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)] flex items-center justify-center px-4">
				<div className="w-full max-w-md space-y-4 rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 p-6 text-center shadow-xl">
					<h1 className="text-2xl font-semibold">无权限</h1>
					<p className="text-sm text-subtle">只有管理员或编辑可访问此页面。</p>
					<Link
						href="/"
						className="block w-full rounded-xl border border-[var(--stroke-soft)] py-2.5 text-base text-dim hover:text-[var(--color-foreground)]"
					>
						返回首页
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)]">
			<div className="mx-auto w-full max-w-6xl px-4 py-10 space-y-6">
				<div className="flex items-center justify-between gap-3">
					<div>
						<p className="text-xs uppercase tracking-[0.4em] text-[var(--accent-emerald)]">
							Admin
						</p>
						<h1 className="text-2xl font-semibold">报告管理</h1>
						<p className="text-sm text-subtle">创建/编辑/发布报告，管理封面与版本。</p>
					</div>
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => openEditor()}
							className="rounded-full bg-[var(--accent-emerald)] px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_12px_28px_rgba(91,224,176,0.28)] hover:brightness-105"
						>
							新建报告
						</button>
						<Link
							href="/reports"
							className="rounded-full border border-[var(--stroke-soft)] px-4 py-2 text-sm text-dim hover:text-[var(--color-foreground)]"
						>
							查看前台
						</Link>
					</div>
				</div>

				<div className="rounded-3xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/85 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.35)] space-y-4">
					<div className="flex flex-wrap items-center gap-3 justify-between">
						<div className="flex flex-wrap items-center gap-2">
							<select
								value={statusFilter}
								onChange={(e) => {
									setStatusFilter(e.target.value as typeof statusFilter);
									setPage(1);
								}}
								className="rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-base)]/80 px-3 py-1.5 text-sm text-[var(--color-foreground)] focus:outline-none"
							>
								<option value="all">全部状态</option>
								<option value="draft">草稿</option>
								<option value="published">已发布</option>
							</select>
							<form
								onSubmit={(e) => {
									e.preventDefault();
									setPage(1);
								}}
								className="flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-base)]/70 px-3 py-1.5"
							>
								<input
									type="search"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder="搜索标题/标签"
									className="bg-transparent text-sm focus:outline-none"
								/>
								<button
									type="submit"
									className="rounded-full bg-[var(--accent-emerald)] px-3 py-1 text-xs font-semibold text-slate-950 shadow-[0_10px_20px_rgba(91,224,176,0.25)]"
								>
									搜索
								</button>
							</form>
						</div>
						<div className="text-xs text-subtle">
							总数：{total} / 页 {page}/{pages}
						</div>
					</div>

					{error && <p className="text-sm text-amber-400">{error}</p>}
					{isLoading ? (
						<p className="text-sm text-subtle">加载中...</p>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm">
								<thead className="text-left text-subtle">
									<tr>
										<th className="py-2 pr-4">标题 / Slug</th>
										<th className="py-2 pr-4">状态</th>
										<th className="py-2 pr-4">语言</th>
										<th className="py-2 pr-4">版本</th>
										<th className="py-2 pr-4">更新时间</th>
										<th className="py-2 pr-4">操作</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-[var(--stroke-soft)]">
									{posts.map((post) => (
										<tr key={post.id ?? post.slug}>
											<td className="py-3 pr-4">
												<div className="font-semibold">{post.title}</div>
												<div className="text-xs text-subtle">{post.slug}</div>
											</td>
											<td className="py-3 pr-4">
												<span
													className={`rounded-full border px-3 py-1 text-xs font-semibold ${
														post.status === "published"
															? "text-emerald-300 border-emerald-400/40 bg-emerald-400/5"
															: "text-amber-200 border-amber-300/40 bg-amber-400/5"
													}`}
												>
													{post.status ?? "draft"}
												</span>
											</td>
											<td className="py-3 pr-4 text-subtle">{post.lang ?? "en"}</td>
											<td className="py-3 pr-4 text-subtle">{post.version ?? 1}</td>
											<td className="py-3 pr-4 text-subtle">
												{post.updated_at || post.updatedAt || post.published_at || post.publishedAt
													? new Date(
															(post.updated_at as string) ||
																(post.updatedAt as string) ||
																(post.published_at as string) ||
																(post.publishedAt as string)
														).toLocaleString()
													: "-"}
											</td>
											<td className="py-3 pr-4">
												<div className="flex flex-wrap gap-2">
													<button
														type="button"
														onClick={() => openEditor(post)}
														className="rounded-full border border-[var(--stroke-soft)] px-3 py-1 text-xs text-dim hover:text-[var(--color-foreground)]"
													>
														编辑
													</button>
													<Link
														href={`/reports/${post.slug}`}
														className="rounded-full border border-[var(--stroke-soft)] px-3 py-1 text-xs text-[var(--accent-emerald)] hover:text-[var(--color-foreground)]"
													>
														预览
													</Link>
												</div>
											</td>
										</tr>
									))}
									{posts.length === 0 && (
										<tr>
											<td colSpan={6} className="py-4 text-center text-subtle">
												暂无数据。
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					)}

					<div className="flex items-center justify-between text-xs text-subtle">
						<div />
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
								className="rounded-full border border-[var(--stroke-soft)] px-3 py-1 text-[0.7rem] uppercase tracking-[0.3em] transition-transform duration-200 ease-out hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
								disabled={page === 1}
							>
								上一页
							</button>
							<button
								type="button"
								onClick={() => setPage((prev) => Math.min(prev + 1, pages))}
								className="rounded-full border border-[var(--stroke-soft)] px-3 py-1 text-[0.7rem] uppercase tracking-[0.3em] transition-transform duration-200 ease-out hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
								disabled={page === pages}
							>
								下一页
							</button>
						</div>
					</div>
				</div>
			</div>

			{editorOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
					<div className="w-full max-w-3xl rounded-3xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.55)] space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-xl font-semibold">
									{editing.id ? "编辑报告" : "新建报告"}
								</h2>
								<p className="text-xs text-subtle">保存后立即写入 Supabase。</p>
							</div>
							<button
								type="button"
								onClick={() => setEditorOpen(false)}
								className="text-sm text-subtle hover:text-[var(--color-foreground)]"
							>
								关闭
							</button>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<label className="space-y-1 text-sm">
								<span className="text-subtle">标题 *</span>
								<input
									value={editing.title || ""}
									onChange={(e) => setEditing((prev) => ({ ...prev, title: e.target.value }))}
									className="w-full rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-base)] px-3 py-2 text-[var(--color-foreground)] focus:outline-none focus:border-[var(--stroke-glow)]"
								/>
							</label>
							<label className="space-y-1 text-sm">
								<span className="text-subtle">Slug *</span>
								<input
									value={editing.slug || ""}
									onChange={(e) =>
										setEditing((prev) => ({
											...prev,
											slug: e.target.value,
										}))
									}
									className="w-full rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-base)] px-3 py-2 text-[var(--color-foreground)] focus:outline-none focus:border-[var(--stroke-glow)]"
								/>
							</label>
							<label className="space-y-1 text-sm md:col-span-2">
								<span className="text-subtle">摘要</span>
								<textarea
									value={editing.summary || ""}
									onChange={(e) => setEditing((prev) => ({ ...prev, summary: e.target.value }))}
									rows={3}
									className="w-full rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-base)] px-3 py-2 text-[var(--color-foreground)] focus:outline-none focus:border-[var(--stroke-glow)]"
								/>
							</label>
							<label className="space-y-1 text-sm md:col-span-2">
								<span className="text-subtle">正文</span>
								<textarea
									value={(Array.isArray(editing.body) ? editing.body.join("\n\n") : editing.body) || ""}
									onChange={(e) =>
										setEditing((prev) => ({
											...prev,
											body: e.target.value,
										}))
									}
									rows={6}
									className="w-full rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-base)] px-3 py-2 text-[var(--color-foreground)] focus:outline-none focus:border-[var(--stroke-glow)]"
								/>
							</label>
							<label className="space-y-1 text-sm">
								<span className="text-subtle">封面 URL</span>
								<input
									value={editing.cover || ""}
									onChange={(e) => setEditing((prev) => ({ ...prev, cover: e.target.value }))}
									className="w-full rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-base)] px-3 py-2 text-[var(--color-foreground)] focus:outline-none focus:border-[var(--stroke-glow)]"
									placeholder="可填写外链或上传后自动填入"
								/>
								<input
									type="file"
									accept="image/*,.pdf,.doc,.docx"
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (file) handleUpload(file);
									}}
									className="text-xs text-subtle"
								/>
								{uploadMessage && <p className="text-xs text-subtle">{uploadMessage}</p>}
							</label>
							<label className="space-y-1 text-sm">
								<span className="text-subtle">主题</span>
								<input
									value={editing.theme || ""}
									onChange={(e) => setEditing((prev) => ({ ...prev, theme: e.target.value }))}
									className="w-full rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-base)] px-3 py-2 text-[var(--color-foreground)] focus:outline-none focus:border-[var(--stroke-glow)]"
								/>
							</label>
							<label className="space-y-1 text-sm">
								<span className="text-subtle">标签（逗号分隔）</span>
								<input
									value={(editing.tags || []).join(",")}
									onChange={(e) =>
										setEditing((prev) => ({
											...prev,
											tags: e.target.value
												.split(",")
												.map((tag) => tag.trim())
												.filter(Boolean),
										}))
									}
									className="w-full rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-base)] px-3 py-2 text-[var(--color-foreground)] focus:outline-none focus:border-[var(--stroke-glow)]"
								/>
							</label>
							<label className="space-y-1 text-sm">
								<span className="text-subtle">语言</span>
								<select
									value={editing.lang || "en"}
									onChange={(e) => setEditing((prev) => ({ ...prev, lang: e.target.value }))}
									className="w-full rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-base)] px-3 py-2 text-[var(--color-foreground)] focus:outline-none focus:border-[var(--stroke-glow)]"
								>
									<option value="en">English</option>
									<option value="zh">中文</option>
								</select>
							</label>
							<label className="space-y-1 text-sm">
								<span className="text-subtle">状态</span>
								<select
									value={editing.status || "draft"}
									onChange={(e) =>
										setEditing((prev) => ({
											...prev,
											status: e.target.value as "draft" | "published",
										}))
									}
									className="w-full rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-base)] px-3 py-2 text-[var(--color-foreground)] focus:outline-none focus:border-[var(--stroke-glow)]"
								>
									<option value="draft">草稿</option>
									<option value="published">已发布</option>
								</select>
							</label>
							<label className="space-y-1 text-sm">
								<span className="text-subtle">版本</span>
								<input
									type="number"
									min={1}
									value={editing.version ?? 1}
									onChange={(e) =>
										setEditing((prev) => ({
											...prev,
											version: Number(e.target.value) || 1,
										}))
									}
									className="w-full rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-base)] px-3 py-2 text-[var(--color-foreground)] focus:outline-none focus:border-[var(--stroke-glow)]"
								/>
								<p className="text-xs text-subtle">
									保存时将写入此版本号；如留空则沿用/自增。
								</p>
							</label>
						</div>

						<div className="flex items-center justify-between">
							<div className="text-xs text-subtle">
								{editing.id ? `ID: ${editing.id}` : "创建后自动生成 ID"}
							</div>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => setEditorOpen(false)}
									className="rounded-full border border-[var(--stroke-soft)] px-4 py-2 text-sm text-dim hover:text-[var(--color-foreground)]"
									disabled={saving}
								>
									取消
								</button>
								<button
									type="button"
									onClick={handleSave}
									className="rounded-full bg-[var(--accent-emerald)] px-5 py-2 text-sm font-semibold text-slate-950 shadow-[0_12px_28px_rgba(91,224,176,0.28)] hover:brightness-105 disabled:opacity-60"
									disabled={saving}
								>
									{saving ? "保存中..." : "保存"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
