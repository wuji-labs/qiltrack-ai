"use client";

import { HeroNew } from "@/app/sections/HeroNew";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HeroPOCPage() {
  const handleCta = () => {
    console.log("CTA clicked");
  };

  const t = (key: string) => {
    // Simple translation function for POC
    const translations: Record<string, string> = {
      "hero.title": "Understand companies in 3 minutes",
      "hero.description": "Transform complex data into clear analysis.",
      "hero.cta.primary": "Generate your first report",
    };
    return translations[key] || key;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with comparison link */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Hero POC - New Design (Stage 1)
            </h2>
            <Link href="/">
              <Button variant="outline" size="sm">
                View Old Design
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* New Hero Design */}
      <HeroNew onPrimaryCta={handleCta} isAuthenticated={false} t={t} />

      {/* Design Notes */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Design Changes (Old → New)
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• <strong>Color:</strong> Emerald/Cyan → Gray Scale (Slate)</li>
            <li>• <strong>Background:</strong> Glass effect (frosted, mesh) → Solid white</li>
            <li>• <strong>Shadows:</strong> Heavy colored glows → Subtle gray shadows</li>
            <li>• <strong>Border:</strong> Rounded corners with glow → Clean simple design</li>
            <li>• <strong>Typography:</strong> Complex hierarchy → Clear, bold hierarchy</li>
            <li>• <strong>Spacing:</strong> Compact → Generous (breathing room)</li>
            <li>• <strong>Components:</strong> Custom CSS → shadcn/ui primitives</li>
            <li>• <strong>Layout:</strong> Custom → Container + Section system</li>
          </ul>
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-6 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Design System (Stage 1 Infrastructure)
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>✅ Design Token System (颜色、排版、间距、阴影)</li>
            <li>✅ shadcn/ui Components (15+ components)</li>
            <li>✅ Layout System (Container, Section, Grid)</li>
            <li>✅ Hero POC (This page)</li>
          </ul>
        </div>

        <div className="mt-8 bg-green-50 rounded-lg p-6 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Next Steps (Stage 2)
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>📋 Complete homepage redesign (all sections)</li>
            <li>📋 Navigation bar redesign</li>
            <li>📋 Model selector cards redesign</li>
            <li>📋 Report generator redesign</li>
            <li>📋 Footer redesign</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
