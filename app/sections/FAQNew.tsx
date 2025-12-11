"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";

type FAQItem = {
  question: string;
  answer: string;
};

type FAQNewProps = {
  items: FAQItem[];
};

export function FAQNew({ items }: FAQNewProps) {
  return (
    <Section id="faq" spacing="default" className="bg-gray-50">
      <Container size="narrow">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600">
            Everything you need to know about Qiltrack AI
          </p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="space-y-4">
          {items.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-white rounded-lg border border-gray-200 px-6"
            >
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold text-gray-900">
                  {item.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* CTA Below FAQ */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Still have questions?
          </p>
          <a
            href="mailto:support@qiltrack.com"
            className="text-gray-900 font-medium hover:underline"
          >
            Contact our support team →
          </a>
        </div>
      </Container>
    </Section>
  );
}
