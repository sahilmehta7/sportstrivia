"use client";

import { getGlassCard, getTextColor, getGradientText } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { Star, Quote } from "lucide-react";

export function Testimonials() {
  const testimonials = [
    {
      name: "SARAH JOHNSON",
      title: "CRICKET ELITE",
      quote: "The arena where knowledge meets competition. The daily drills keep me sharp and the climb to the top is exhilarating.",
      rating: 5,
      accent: "text-primary shadow-neon-cyan/20",
    },
    {
      name: "MIKE CHEN",
      title: "HOOP SCHOLAR",
      quote: "Real-time rankings are a game changer. Every correct answer feels like a three-pointer at the buzzer.",
      rating: 5,
      accent: "text-secondary shadow-neon-magenta/20",
    },
    {
      name: "EMMA RODRIGUEZ",
      title: "PRO ANALYST",
      quote: "Unmatched variety and depth. It's the ultimate destination for anyone serious about showing off their sports IQ.",
      rating: 5,
      accent: "text-accent shadow-neon-lime/20",
    },
  ];

  return (
    <section className="px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20">
          <h2 className={cn("text-4xl font-black tracking-tighter sm:text-6xl mb-4", getGradientText("neon"))}>
            VOICES FROM THE ARENA
          </h2>
          <p className="max-w-2xl text-lg text-muted-foreground font-medium">
            Hear from the champions who have conquered our leagues.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 sm:gap-10">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={cn(
                "relative group rounded-[2.5rem] p-10 glass border-white/5 transition-all duration-500",
                "hover:border-white/10 hover:bg-white/5 hover:-translate-y-2",
                testimonial.accent
              )}
            >
              <Quote className="absolute top-8 right-8 h-8 w-8 text-white/5" />

              <div className="flex gap-1 mb-8">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 text-accent drop-shadow-[0_0_8px_hsl(var(--neon-lime)/0.5)]"
                    fill="currentColor"
                  />
                ))}
              </div>

              <blockquote className="mb-10 text-lg leading-relaxed font-medium text-foreground italic">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              <div className="border-l-2 border-primary/30 pl-4 py-1">
                <div className="font-black text-sm tracking-widest uppercase">
                  {testimonial.name}
                </div>
                <div className="text-[10px] font-black tracking-[0.25em] text-muted-foreground uppercase mt-1">
                  {testimonial.title}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
