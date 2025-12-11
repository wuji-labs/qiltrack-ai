"use client";

import { Zap, TrendingUp, FileText, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Grid } from "@/components/layout/Grid";

type FeatureItem = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

type FeaturesNewProps = {
  t: (key: string) => string;
};

export function FeaturesNew({ t }: FeaturesNewProps) {
  const features: FeatureItem[] = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "AI-Powered Analysis",
      description: "Advanced AI models analyze financial data, reports, and market trends to generate comprehensive insights.",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "3-Minute Reports",
      description: "Get a complete company analysis in just 3 minutes. From ticker to insights, faster than ever.",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Multiple Perspectives",
      description: "Choose from 4 research modes—Baseline, Buffett, Musk, or Muddy Waters—for diverse viewpoints.",
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Structured Output",
      description: "Consistent, well-organized reports with clear sections: Overview, Financials, Risks, and Opportunities.",
    },
  ];

  return (
    <Section id="overview" spacing="default">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Qiltrack AI?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform complex financial data into actionable insights with the power of AI.
          </p>
        </div>

        {/* Features Grid */}
        <Grid cols={{ default: 1, md: 2, lg: 4 }} gap={6}>
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="mb-4 text-gray-700">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </Grid>
      </Container>
    </Section>
  );
}
