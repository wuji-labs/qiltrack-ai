"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Separator } from "@/components/ui/separator";

type FooterProps = {
  t: (key: string) => string;
  disclaimer?: string;
  dataSource?: string;
};

export function Footer({ t, disclaimer, dataSource }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white">
      <Container>
        <div className="py-12">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand Column */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
                <Search className="w-5 h-5 text-gray-900" />
                <span className="font-semibold text-gray-900">Qiltrack AI</span>
              </Link>
              <p className="text-sm text-gray-600 leading-relaxed">
                AI-powered research platform for understanding companies in minutes.
              </p>
            </div>

            {/* Product Column */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/#generator" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    Generator
                  </Link>
                </li>
                <li>
                  <Link href="/reports" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    Sample Reports
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    {t("nav.pricing")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="mailto:support@qiltrack.com"
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <Link href="/#faq" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/legal/terms" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    {t("footer.terms")}
                  </Link>
                </li>
                <li>
                  <Link href="/legal/privacy" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    {t("footer.privacy")}
                  </Link>
                </li>
                <li>
                  <Link href="/legal/refund" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    Refund Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Bottom Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-gray-500">
              © {currentYear} Qiltrack AI. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                aria-label="Twitter"
              >
                Twitter
              </a>
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                aria-label="GitHub"
              >
                GitHub
              </a>
            </div>
          </div>

          {/* Disclaimer */}
          {(disclaimer || dataSource) && (
            <>
              <Separator className="my-8" />
              <div className="text-xs text-gray-500 leading-relaxed">
                {disclaimer}
                {disclaimer && dataSource && " "}
                {dataSource}
              </div>
            </>
          )}
        </div>
      </Container>
    </footer>
  );
}
