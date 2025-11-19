"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n";

export function AppProviders({ children }: { children: ReactNode }) {
	return (
		<SessionProvider>
			<LanguageProvider>{children}</LanguageProvider>
		</SessionProvider>
	);
}
