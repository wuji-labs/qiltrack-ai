"use client";

import { Target, Castle, Rocket, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Grid } from "@/components/layout/Grid";
import type { ReportTone } from "@/types/report";

type ModeOption = {
  id: ReportTone;
  emoji: string;
  title: string;
  badge: string;
  description: string;
  credits: number;
};

type ModelSelectorNewProps = {
  options: ModeOption[];
  selected: ReportTone;
  onSelect: (tone: ReportTone) => void;
  heading: string;
};

const iconMap = {
  baseline: Target,
  buffett: Castle,
  musk: Rocket,
  muddy: Shield,
};

export function ModelSelectorNew({
  options,
  selected,
  onSelect,
  heading,
}: ModelSelectorNewProps) {
  return (
    <Section id="models" spacing="default" className="bg-gray-50">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            {heading}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Four research perspectives
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Look at the same company from different worldviews while keeping Qiltrack AI's structure.
          </p>
        </div>

        {/* Model Cards Grid */}
        <Grid cols={{ default: 1, sm: 2, lg: 4 }} gap={6}>
          {options.map((option) => {
            const Icon = iconMap[option.id as keyof typeof iconMap] || Target;
            const isSelected = option.id === selected;

            return (
              <Card
                key={option.id}
                className={`group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                  isSelected
                    ? "ring-2 ring-gray-900 shadow-md"
                    : "hover:ring-1 hover:ring-gray-300"
                }`}
                onClick={() => onSelect(option.id)}
              >
                <CardContent className="pt-6">
                  {/* Icon */}
                  <div className="mb-4 text-gray-700">
                    <Icon className="w-8 h-8" />
                  </div>

                  {/* Title & Emoji */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {option.title}
                    </h3>
                    <span className="text-xl">{option.emoji}</span>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {option.badge}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {option.credits} credits
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {option.description}
                  </p>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-900">
                        ✓ Selected
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Grid>

        {/* Selected Mode Summary */}
        {selected && (
          <div className="mt-8 p-4 rounded-lg bg-gray-100 border border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              <span className="font-medium text-gray-900">Current mode:</span>{" "}
              {options.find((opt) => opt.id === selected)?.title || selected}
            </p>
          </div>
        )}
      </Container>
    </Section>
  );
}
