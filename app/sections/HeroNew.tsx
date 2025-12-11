"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";

type HeroNewProps = {
  onPrimaryCta: () => void;
  isAuthenticated: boolean;
  t: (key: string) => string;
};

export function HeroNew({ onPrimaryCta, isAuthenticated, t }: HeroNewProps) {
  const tagline = t("hero.tagline") || "AI-Powered Research";
  const title = t("hero.title") || "Understand companies in 3 minutes";
  const description = t("hero.description") || "Transform complex data and reports into clear, structured analysis. Understanding is the foundation of investing.";
  const primaryCtaText = isAuthenticated
    ? (t("hero.cta.primary") || "Generate Report")
    : (t("cta.preview") || "Try it now");
  const secondaryCtaText = t("hero.cta.secondary") || "View sample report";

  return (
    <Section spacing="loose" className="text-center bg-white">
      <Container size="narrow">
        {/* Badge */}
        {tagline && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6
                          text-sm rounded-full bg-gray-100 text-gray-700
                          transition-colors hover:bg-gray-200">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">{tagline}</span>
          </div>
        )}

        {/* Hero Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold
                       text-gray-900 mb-6 tracking-tight leading-tight">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-600 mb-12
                      leading-relaxed max-w-2xl mx-auto">
          {description}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={onPrimaryCta}
            className="shadow-sm hover:shadow-md transition-shadow bg-gray-900 hover:bg-gray-800"
          >
            {primaryCtaText}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="hover:bg-gray-50"
          >
            <Link href="/reports">
              {secondaryCtaText}
            </Link>
          </Button>
        </div>

        {/* Brand line */}
        {t("hero.brandline") && (
          <div className="mt-8 text-base font-medium text-gray-700">
            {t("hero.brandline")}
          </div>
        )}
      </Container>
    </Section>
  );
}
