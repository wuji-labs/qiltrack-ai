import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "@/app/(auth)/login/page";
import { LanguageProvider } from "@/lib/i18n";

const mockSignInWithProvider = vi.fn();
const mockSignInWithEmail = vi.fn();
const mockReplace = vi.fn();

let searchParams: URLSearchParams;
const createLocalStorage = () => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
	};
};

vi.mock("@/hooks/useSupabaseAuth", () => ({
	useSupabaseAuth: () => ({
		signInWithProvider: mockSignInWithProvider,
		signInWithEmail: mockSignInWithEmail,
		signInWithPassword: vi.fn().mockResolvedValue({ success: true }),
		signUpWithPassword: vi.fn().mockResolvedValue({ success: true }),
		resetPassword: vi.fn().mockResolvedValue({ success: true }),
		loading: false,
		isAuthenticated: false,
		session: null,
		user: null,
	}),
}));

vi.mock("next/navigation", () => ({
	useSearchParams: () => searchParams,
	useRouter: () => ({
		replace: mockReplace,
	}),
}));

function renderLogin() {
	return render(
		<LanguageProvider>
			<LoginPage />
		</LanguageProvider>
	);
}

describe("LoginPage", () => {
	beforeEach(() => {
		searchParams = new URLSearchParams();
		process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
		mockSignInWithProvider.mockResolvedValue({ success: true });
		mockSignInWithEmail.mockResolvedValue({ success: true });
		Object.defineProperty(window, "localStorage", {
			value: createLocalStorage(),
			writable: true,
		});
	});

	it("shows Google CTA and email form", () => {
		renderLogin();
		expect(screen.getByRole("button", { name: /Continue with Google/i })).toBeInTheDocument();
		expect(screen.getByPlaceholderText("name@example.com")).toBeInTheDocument();
	});

	it("handles google sign-in flow", async () => {
		renderLogin();
		const googleButton = screen.getByRole("button", { name: /Continue with Google/i });
		await userEvent.click(googleButton);
		await waitFor(() => expect(mockSignInWithProvider).toHaveBeenCalledTimes(1));
	});

	it("renders request error from query param", () => {
		searchParams = new URLSearchParams("error=1");
		renderLogin();
		expect(screen.getByText("Login is temporarily unavailable. Please try again later.")).toBeInTheDocument();
	});
});
