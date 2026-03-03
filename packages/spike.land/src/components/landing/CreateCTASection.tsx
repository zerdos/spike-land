"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { ArrowRight } from "lucide-react";

export function CreateCTASection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Start Building Today
          </h2>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            Describe what you want and Spike builds it. Deploy your app in seconds, no infrastructure knowledge required.
          </p>
          <Button asChild size="lg" className="px-8 h-12 text-base font-semibold">
            <Link href="/create" className="flex items-center gap-2">
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
