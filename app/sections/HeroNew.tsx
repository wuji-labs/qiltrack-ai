"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";

type HeroNewProps = {
  onPrimaryCta: () => void;
  t: (key: string) => string;
};

export function HeroNew({ onPrimaryCta, t }: HeroNewProps) {
  return (
    <Section spacing="loose" className="text-center bg-white">
      <Container size="narrow">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6
                        text-sm rounded-full bg-gray-100 text-gray-700
                        transition-colors hover:bg-gray-200">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium">AI-Powered Research</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold
                       text-gray-900 mb-6 tracking-tight leading-tight">
          Understand companies in{' '}
          <span className="text-gray-600">3 minutes</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-600 mb-12
                      leading-relaxed max-w-2xl mx-auto">
          Transform complex data and reports into clear, structured analysis.
          Understanding is the foundation of investing.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={onPrimaryCta}
            className="shadow-sm hover:shadow-md transition-shadow bg-gray-900 hover:bg-gray-800"
          >
            Generate your first report
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="hover:bg-gray-50"
          >
            <Link href="/reports">
              View sample report
            </Link>
          </Button>
        </div>

        {/* Social Proof */}
        <div className="mt-12 text-sm text-gray-500">
          Trusted by 1,000+ investors worldwide
        </div>
      </Container>
    </Section>
  );
}
