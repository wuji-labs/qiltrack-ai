"use client";

import { useState } from "react";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { HeroNew } from "@/app/sections/HeroNew";
import { ModelSelectorNew } from "@/app/sections/ModelSelectorNew";
import { FeaturesNew } from "@/app/sections/FeaturesNew";
import { FAQNew } from "@/app/sections/FAQNew";
import type { ReportTone } from "@/types/report";
import type { Language } from "@/lib/i18n-config";

export default function NewHomePage() {
  const [language, setLanguage] = useState<Language>("en");
  const [selectedTone, setSelectedTone] = useState<ReportTone>("baseline");

  // Mock translation function
  const t = (key: string) => {
    const translations: Record<string, string> = {
      "nav.product": "Product",
      "nav.generator": "Generator",
      "nav.templates": "Templates",
      "nav.pricing": "Pricing",
      "nav.faq": "FAQ",
      "footer.terms": "Terms of Service",
      "footer.privacy": "Privacy Policy",
      "referral.menu.title": "Refer & Earn",
      "pricing.title": "Pricing",
      "account.menu.settings": "Settings",
      "auth.account.signout": "Sign Out",
      "generator.sectionTitle": "Choose Research Mode",
    };
    return translations[key] || key;
  };

  const navItems = [
    { label: "Product", href: "#overview" },
    { label: "Models", href: "#models" },
    { label: "Generator", href: "#generator" },
    { label: "Pricing", href: "/pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  const toneOptions = [
    {
      id: "baseline" as ReportTone,
      emoji: "🧭",
      title: "Baseline Mode",
      badge: "NEUTRAL",
      description: "See it clearly for what it is. Objective analysis without bias.",
      credits: 30,
    },
    {
      id: "buffett" as ReportTone,
      emoji: "🏰",
      title: "Buffett Mode",
      badge: "VALUE",
      description: "Focus on moats, competitive advantages, and long-term value.",
      credits: 40,
    },
    {
      id: "musk" as ReportTone,
      emoji: "🚀",
      title: "Musk Mode",
      badge: "INNOVATION",
      description: "Emphasize disruption, technology, and exponential growth potential.",
      credits: 40,
    },
    {
      id: "muddy" as ReportTone,
      emoji: "🛡️",
      title: "Muddy Waters",
      badge: "SKEPTICAL",
      description: "Critical examination of risks, red flags, and potential fraud.",
      credits: 50,
    },
  ];

  const faqItems = [
    {
      question: "How does Qiltrack AI generate reports?",
      answer: "We use advanced AI models to analyze financial data, SEC filings, earnings calls, and market trends. Our system processes this information through different research modes to provide comprehensive insights.",
    },
    {
      question: "What are the different research modes?",
      answer: "We offer 4 research perspectives: Baseline (neutral), Buffett (value investing), Musk (innovation-focused), and Muddy Waters (skeptical analysis). Each mode analyzes the same company data through a different lens.",
    },
    {
      question: "How long does it take to generate a report?",
      answer: "Most reports are generated in 2-3 minutes. The exact time depends on the complexity of the company and the selected research mode.",
    },
    {
      question: "What companies can I analyze?",
      answer: "You can analyze any publicly traded company on major US stock exchanges (NYSE, NASDAQ). Simply enter the company ticker symbol.",
    },
    {
      question: "How often is the data updated?",
      answer: "We continuously monitor financial data sources and update our database daily. Market data and stock prices are updated in real-time.",
    },
    {
      question: "Can I export or share reports?",
      answer: "Yes! All reports can be exported as PDF and shared via a unique link. Premium users can also download raw data in CSV format.",
    },
  ];

  const handlePrimaryCta = () => {
    const element = document.querySelector("#generator");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleNavClick = (href: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navigation
        navItems={navItems}
        language={language}
        setLanguage={setLanguage}
        userEmail={null}
        userName={null}
        planLabel="Free Plan"
        isAuthenticated={false}
        onSignOut={() => {}}
        t={t}
        onNavClick={handleNavClick}
      />

      {/* Main Content */}
      <main>
        {/* Hero */}
        <HeroNew onPrimaryCta={handlePrimaryCta} t={t} />

        {/* Features */}
        <FeaturesNew t={t} />

        {/* Model Selector */}
        <ModelSelectorNew
          options={toneOptions}
          selected={selectedTone}
          onSelect={setSelectedTone}
          heading={t("generator.sectionTitle")}
        />

        {/* Report Generator Placeholder */}
        <section id="generator" className="py-16 lg:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Report Generator
              </h3>
              <p className="text-gray-600 mb-6">
                The actual report generator component will be integrated here.
                <br />
                This is a placeholder for Stage 2 demonstration.
              </p>
              <div className="inline-block px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium">
                Coming in full integration
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FAQNew items={faqItems} />
      </main>

      {/* Footer */}
      <Footer t={t} />

      {/* Back to Old Home Link */}
      <div className="fixed bottom-4 right-4 z-40">
        <a
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-full shadow-lg hover:bg-gray-800 transition-colors"
        >
          ← View Old Design
        </a>
      </div>
    </div>
  );
}
