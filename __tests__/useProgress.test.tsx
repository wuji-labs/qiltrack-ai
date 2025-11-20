import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useProgress } from "@/hooks/useProgress";

describe("useProgress", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("advances progress and completes", () => {
		const { result } = renderHook(() => useProgress());
		act(() => result.current.start("init"));
		expect(result.current.progress).toBeGreaterThan(0);

		act(() => {
			vi.advanceTimersByTime(3000);
		});
		expect(result.current.progress).toBeGreaterThanOrEqual(7);

		act(() => result.current.complete("done"));
		expect(result.current.status).toBe("done");
		expect(result.current.progress).toBe(100);

		act(() => {
			vi.advanceTimersByTime(900);
		});
		expect(result.current.status).toBe("idle");
		expect(result.current.progress).toBe(0);
	});

	it("fail stops timers without completing", () => {
		const { result } = renderHook(() => useProgress());
		act(() => result.current.start());
		act(() => result.current.fail("error"));
		expect(result.current.status).toBe("idle");
		expect(result.current.text).toBe("error");
	});
});
