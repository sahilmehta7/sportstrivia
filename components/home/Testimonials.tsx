"use client";

import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getGlassCard, getTextColor } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

export function Testimonials() {
  // Theme styling via CSS

  const testimonials = [
    {
      name: "Sarah Johnson",
      title: "Cricket Enthusiast",
      quote: "This platform has completely changed how I test my cricket knowledge. The questions are challenging and the competition keeps me coming back daily.",
      rating: 5,
    },
    {
      name: "Mike Chen",
      title: "Basketball Fan",
      quote: "The real-time leaderboards are amazing! I love competing with friends and seeing my ranking improve as I learn more about basketball.",
      rating: 5,
    },
    {
      name: "Emma Rodriguez",
      title: "Sports Blogger",
      quote: "As someone who writes about sports, this platform helps me stay sharp on facts and trivia. The variety of topics is impressive.",
      rating: 5,
    },
  ];

  return (
    <section className="px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <div className={cn(
          "relative w-full max-w-5xl mx-auto rounded-[1.75rem] border p-6 sm:p-8 backdrop-blur-xl mb-8",
          getGlassCard()
        )}>
          <div className="text-center">
            <h2 className={cn(
              "text-2xl sm:text-3xl font-bold mb-4",
              getTextColor("primary")
            )}>
              What Our Players Say
            </h2>
            <p className={cn(
              "text-base sm:text-lg",
              getTextColor("secondary")
            )}>
              Join thousands of satisfied sports fans
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={cn(
                "rounded-xl sm:rounded-2xl p-6 sm:p-8 backdrop-blur-sm transition-all duration-200 hover:scale-105",
                getGlassCard()
              )}
            >
              {/* Stars */}
              <div className="flex justify-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4 sm:h-5 sm:w-5",
                      "text-yellow-500",
                      "dark:text-yellow-400"
                    )}
                    fill="currentColor"
                  />
                ))}
              </div>

              {/* Quote */}
              <blockquote
                className={cn(
                  "text-center mb-4 sm:mb-6 italic text-sm sm:text-base",
                  getTextColor("secondary")
                )}
              >
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="text-center">
                <div className={cn(
                  "font-bold text-sm sm:text-base",
                  getTextColor("primary")
                )}>
                  {testimonial.name}
                </div>
                <div className={cn(
                  "text-xs sm:text-sm",
                  getTextColor("muted")
                )}>
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
