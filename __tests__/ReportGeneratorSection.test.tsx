import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReportGeneratorSection } from "@/app/sections/ReportGeneratorSection";
import * as apiModule from "@/lib/services/api";

// Mock the API module
vi.mock("@/lib/services/api", () => ({
	generateReport: vi.fn(),
	searchSymbols: vi.fn(),
	fetchCredits: vi.fn(),
}));

// Mock translation function
const mockTranslate = (key: string, vars?: Record<string, string>) => {
	const translations: Record<string, string> = {
		"generator.alert.unregistered": "Please sign up to use the free quota",
		"generator.alert.quota": "You've reached your quota limit",
		"quota.action.login": "Log in",
		"quota.action.retry": "Retry",
		"quota.action.refresh": "Refresh quota",
		"quota.action.upgrade": "Upgrade",
		"quota.badge.exhausted": "Exhausted",
		"quota.error.unauthorized": "Please sign in to generate reports",
		"error.submit.empty": "Please enter a US ticker",
		"error.submit.format": "That doesn't look like a standard ticker",
		"error.submit.notFound": "No valid company found",
		"report.quota.remaining": "Remaining quota:",
		"alert.error.title": "Error",
		"generator.input.label": "Enter Symbol",
		"generator.account.status": "Remaining: {{count}}",
		"generator.account.cta": "Sign in",
		"hero.quota": "Quota",
		"quota.card.heading": "Quota · {{plan}}",
		"quota.card.email": "{{email}}",
		"quota.card.count": "{{count}} reports left",
		"quota.card.note": "Regenerate to sync quota",
		"quota.card.refreshCta": "Regenerate",
		"quota.card.exampleCta": "Example",
		"quota.banner.title": "Try it free",
		"quota.banner.description": "3 free reports",
		"quota.banner.hint.register": "Sign up to unlock",
		"hero.title": "Investor AI",
		"report.tip.title": "Report tip",
		"report.tip.body": "Enter a ticker...",
		"report.tip.action": "Follow steps",
		"nav.product": "Solution",
		"generator.progress.init": "Initializing",
		"generator.progress.done": "Done",
		"generator.progress.preparing": "Preparing",
		"generator.progress.stage1": "Stage 1",
		"generator.progress.stage2": "Stage 2",
		"generator.progress.stage3": "Stage 3",
		"generator.progress.stage4": "Stage 4",
		"generator.progress.stage5": "Stage 5",
		"generator.progress.stage6": "Stage 6",
		"generator.progress.stage7": "Stage 7",
		"generator.progress.stage8": "Stage 8",
		"generator.progress.fetching": "Fetching",
		"generator.progress.ready": "Ready",
		"generator.searching": "Searching...",
		"generator.searching.wait": "Please wait",
		"generator.search.empty": "No results",
		"generator.submit": "Generate",
		"generator.loading": "Loading",
		"report.keyInsights.subtitle": "Key Insights",
		"report.meta": "Report for {{symbol}}",
		"report.disclaimerNotice": "For education only",
		"alert.copy.missing": "No content to copy",
		"alert.copy.success": "Copied!",
		"alert.copy.fallback": "Copied (fallback)",
		"alert.copy.error": "Copy failed",
		"alert.export.missing": "No report to export",
		"alert.export.success": "Exported!",
		"alert.export.error": "Export failed",
		"report.action.copy": "Copy",
		"report.action.export": "Export",
		"report.action.exporting": "Exporting...",
		"report.debug": "Debug",
		"auth.session.fallback": "Unknown",
	};

	let result = translations[key] || key;
	if (vars) {
		Object.entries(vars).forEach(([k, v]) => {
			result = result.replace(`{{${k}}}`, v);
		});
	}
	return result;
};

const defaultAuth = {
	isAuthenticated: true,
	remainingQuota: 10,
	planLabel: "Pro",
	userEmail: "user@example.com",
	refreshSession: vi.fn(),
	refreshQuota: vi.fn(),
};

const defaultProgress = {
	progress: 0,
	currentStep: 0,
	text: null,
	start: vi.fn(),
	complete: vi.fn(),
	fail: vi.fn(),
	reset: vi.fn(),
	forceComplete: vi.fn(),
};

describe("ReportGeneratorSection", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should display unregistered error when user is not authenticated and tries to submit", async () => {
		const user = userEvent.setup();
		const onRequireLogin = vi.fn();

		const mockSearchSymbols = vi.spyOn(apiModule, "searchSymbols");
		mockSearchSymbols.mockResolvedValueOnce([
			{
				symbol: "AAPL",
				description: "Apple Inc",
				displaySymbol: "AAPL",
				type: "equity",
			},
		]);

		render(
			<ReportGeneratorSection
				selectedTone="baseline"
				toneOptions={[
					{
						id: "baseline",
						emoji: "📊",
						title: "Baseline",
						badge: "balanced",
						description: "Balanced analysis",
					},
				]}
				language="en"
				highlightFallback={["Highlight 1", "Highlight 2", "Highlight 3"]}
				heroHighlights={[]}
				auth={{ ...defaultAuth, isAuthenticated: false }}
				progress={defaultProgress}
				onRequireLogin={onRequireLogin}
				t={mockTranslate}
			/>
		);

		// Find and type in the input
		const input = screen.getByRole("textbox", { name: /enter symbol/i });
		await user.type(input, "AAPL");

		// Wait for the search result and click it
		await waitFor(() => {
			expect(screen.getByText("Apple Inc")).toBeInTheDocument();
		});

		const appleButton = screen.getByRole("button", { name: /Apple Inc/i });
		await user.click(appleButton);

		// Submit the form
		const submitButton = screen.getByRole("button", { name: /generate/i });
		await user.click(submitButton);

		// Verify onRequireLogin was called
		await waitFor(() => {
			expect(onRequireLogin).toHaveBeenCalled();
		});

		// Verify error message is displayed
		expect(screen.getByText(/Please sign up to use the free quota/i)).toBeInTheDocument();
	});

	it("should display quota exceeded error when 429 is returned from API", async () => {
		const user = userEvent.setup();
		const onRequireLogin = vi.fn();

		const mockSearchSymbols = vi.spyOn(apiModule, "searchSymbols");
		mockSearchSymbols.mockResolvedValueOnce([
			{
				symbol: "AAPL",
				description: "Apple Inc",
				displaySymbol: "AAPL",
				type: "equity",
			},
		]);

		const mockGenerateReport = vi.spyOn(apiModule, "generateReport");
		mockGenerateReport.mockRejectedValueOnce(new Error("Quota exceeded"));

		render(
			<ReportGeneratorSection
				selectedTone="baseline"
				toneOptions={[
					{
						id: "baseline",
						emoji: "📊",
						title: "Baseline",
						badge: "balanced",
						description: "Balanced analysis",
					},
				]}
				language="en"
				highlightFallback={["Highlight 1", "Highlight 2", "Highlight 3"]}
				heroHighlights={[]}
				auth={defaultAuth}
				progress={defaultProgress}
				onRequireLogin={onRequireLogin}
				t={mockTranslate}
			/>
		);

		const input = screen.getByRole("textbox", { name: /enter symbol/i });
		await user.type(input, "AAPL");

		await waitFor(() => {
			expect(screen.getByText("Apple Inc")).toBeInTheDocument();
		});

		const appleButton = screen.getByRole("button", { name: /Apple Inc/i });
		await user.click(appleButton);

		const submitButton = screen.getByRole("button", { name: /generate/i });
		await user.click(submitButton);

		// Verify quota error is displayed
		await waitFor(() => {
			expect(screen.getByText(/You've reached your quota limit/i)).toBeInTheDocument();
		});

		// Verify action buttons are present
		expect(screen.getByRole("button", { name: /Refresh quota/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Upgrade/i })).toBeInTheDocument();
	});

	it("should call refreshQuota when 'Refresh quota' button is clicked", async () => {
		const user = userEvent.setup();
		const onRequireLogin = vi.fn();
		const refreshQuota = vi.fn();

		const mockSearchSymbols = vi.spyOn(apiModule, "searchSymbols");
		mockSearchSymbols.mockResolvedValueOnce([
			{
				symbol: "AAPL",
				description: "Apple Inc",
				displaySymbol: "AAPL",
				type: "equity",
			},
		]);

		const mockGenerateReport = vi.spyOn(apiModule, "generateReport");
		mockGenerateReport.mockRejectedValueOnce(new Error("Quota exceeded"));

		render(
			<ReportGeneratorSection
				selectedTone="baseline"
				toneOptions={[
					{
						id: "baseline",
						emoji: "📊",
						title: "Baseline",
						badge: "balanced",
						description: "Balanced analysis",
					},
				]}
				language="en"
				highlightFallback={["Highlight 1", "Highlight 2", "Highlight 3"]}
				heroHighlights={[]}
				auth={{ ...defaultAuth, refreshQuota }}
				progress={defaultProgress}
				onRequireLogin={onRequireLogin}
				t={mockTranslate}
			/>
		);

		const input = screen.getByRole("textbox", { name: /enter symbol/i });
		await user.type(input, "AAPL");

		await waitFor(() => {
			expect(screen.getByText("Apple Inc")).toBeInTheDocument();
		});

		const appleButton = screen.getByRole("button", { name: /Apple Inc/i });
		await user.click(appleButton);

		const submitButton = screen.getByRole("button", { name: /generate/i });
		await user.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText(/You've reached your quota limit/i)).toBeInTheDocument();
		});

		const refreshButton = screen.getByRole("button", { name: /Refresh quota/i });
		await user.click(refreshButton);

		expect(refreshQuota).toHaveBeenCalled();
	});

	it("should allow retry after error is cleared", async () => {
		const user = userEvent.setup();
		const onRequireLogin = vi.fn();

		const mockSearchSymbols = vi.spyOn(apiModule, "searchSymbols");
		mockSearchSymbols.mockResolvedValueOnce([
			{
				symbol: "AAPL",
				description: "Apple Inc",
				displaySymbol: "AAPL",
				type: "equity",
			},
		]);

		const mockGenerateReport = vi.spyOn(apiModule, "generateReport");
		mockGenerateReport.mockRejectedValueOnce(new Error("Quota exceeded"));

		render(
			<ReportGeneratorSection
				selectedTone="baseline"
				toneOptions={[
					{
						id: "baseline",
						emoji: "📊",
						title: "Baseline",
						badge: "balanced",
						description: "Balanced analysis",
					},
				]}
				language="en"
				highlightFallback={["Highlight 1", "Highlight 2", "Highlight 3"]}
				heroHighlights={[]}
				auth={defaultAuth}
				progress={defaultProgress}
				onRequireLogin={onRequireLogin}
				t={mockTranslate}
			/>
		);

		const input = screen.getByRole("textbox", { name: /enter symbol/i });
		await user.type(input, "AAPL");

		await waitFor(() => {
			expect(screen.getByText("Apple Inc")).toBeInTheDocument();
		});

		const appleButton = screen.getByRole("button", { name: /Apple Inc/i });
		await user.click(appleButton);

		const submitButton = screen.getByRole("button", { name: /generate/i });
		await user.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText(/You've reached your quota limit/i)).toBeInTheDocument();
		});

		const retryButton = screen.getAllByRole("button", { name: /retry/i })[0];
		await user.click(retryButton);

		// Error should be cleared
		await waitFor(() => {
			expect(screen.queryByText(/You've reached your quota limit/i)).not.toBeInTheDocument();
		});
	});

	it("should block submission when quota is exhausted (remainingQuota <= 0 AND quotaLoaded=true)", async () => {
		const user = userEvent.setup();
		const onRequireLogin = vi.fn();

		const mockSearchSymbols = vi.spyOn(apiModule, "searchSymbols");
		mockSearchSymbols.mockResolvedValueOnce([
			{
				symbol: "AAPL",
				description: "Apple Inc",
				displaySymbol: "AAPL",
				type: "equity",
			},
		]);

		render(
			<ReportGeneratorSection
				selectedTone="baseline"
				toneOptions={[
					{
						id: "baseline",
						emoji: "📊",
						title: "Baseline",
						badge: "balanced",
						description: "Balanced analysis",
					},
				]}
				language="en"
				highlightFallback={["Highlight 1", "Highlight 2", "Highlight 3"]}
				heroHighlights={[]}
				auth={{ ...defaultAuth, remainingQuota: 0, quotaLoaded: true }}
				progress={defaultProgress}
				onRequireLogin={onRequireLogin}
				t={mockTranslate}
			/>
		);

		const input = screen.getByRole("textbox", { name: /enter symbol/i });
		await user.type(input, "AAPL");

		await waitFor(() => {
			expect(screen.getByText("Apple Inc")).toBeInTheDocument();
		});

		const appleButton = screen.getByRole("button", { name: /Apple Inc/i });
		await user.click(appleButton);

		const submitButton = screen.getByRole("button", { name: /generate/i });
		await user.click(submitButton);

		// Should display quota error without calling API
		await waitFor(() => {
			expect(screen.getByText(/You've reached your quota limit/i)).toBeInTheDocument();
		});
	});

	it("should NOT block submission when quota is 0 but quotaLoaded=false (initial load state)", async () => {
		const user = userEvent.setup();
		const onRequireLogin = vi.fn();
		const refreshSession = vi.fn();

		const mockSearchSymbols = vi.spyOn(apiModule, "searchSymbols");
		mockSearchSymbols.mockResolvedValueOnce([
			{
				symbol: "AAPL",
				description: "Apple Inc",
				displaySymbol: "AAPL",
				type: "equity",
			},
		]);

		const mockGenerateReport = vi.spyOn(apiModule, "generateReport");
		mockGenerateReport.mockResolvedValueOnce({
			symbol: "AAPL",
			report: "# Test Report\nContent",
			companyData: { profile: { name: "Apple" } },
		} as unknown as Awaited<ReturnType<typeof apiModule.generateReport>>);

		render(
			<ReportGeneratorSection
				selectedTone="baseline"
				toneOptions={[
					{
						id: "baseline",
						emoji: "📊",
						title: "Baseline",
						badge: "balanced",
						description: "Balanced analysis",
					},
				]}
				language="en"
				highlightFallback={["Highlight 1", "Highlight 2", "Highlight 3"]}
				heroHighlights={[]}
				// quotaLoaded is false/undefined, so remainingQuota=0 should NOT block
				auth={{
					isAuthenticated: true,
					remainingQuota: 0,
					planLabel: "Pro",
					userEmail: "user@example.com",
					refreshSession,
					refreshQuota: vi.fn(),
					quotaLoaded: false, // Not loaded yet - should allow submission
				}}
				progress={defaultProgress}
				onRequireLogin={onRequireLogin}
				t={mockTranslate}
			/>
		);

		const input = screen.getByRole("textbox", { name: /enter symbol/i });
		await user.type(input, "AAPL");

		await waitFor(() => {
			expect(screen.getByText("Apple Inc")).toBeInTheDocument();
		});

		const appleButton = screen.getByRole("button", { name: /Apple Inc/i });
		await user.click(appleButton);

		const submitButton = screen.getByRole("button", { name: /generate/i });
		await user.click(submitButton);

		// Should attempt to call API (not show quota error pre-emptively)
		await waitFor(() => {
			expect(mockGenerateReport).toHaveBeenCalled();
		});

		mockSearchSymbols.mockRestore();
		mockGenerateReport.mockRestore();
	});
});
