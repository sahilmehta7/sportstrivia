"use client";

import { useState, useMemo } from "react";
import { ShowcaseTopicCarousel } from "@/components/quiz/ShowcaseTopicCarousel";
import { ShowcaseTopicCard } from "@/components/quiz/ShowcaseTopicCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface TopicItem {
  id: string;
  title: string;
  description?: string | null;
  href: string;
  accentDark: string;
  accentLight: string;
  quizCount?: number;
}

interface TopicsBrowseProps {
  featured: TopicItem[];
  topics: TopicItem[];
}

export default function TopicsBrowse({ featured, topics }: TopicsBrowseProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return topics;
    return topics.filter(topic => 
      topic.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, topics]);
  
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-amber-500 px-4 py-12 sm:px-6 lg:py-16">
      {/* Animated blur circles */}
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-emerald-400/40 blur-[120px]" />
        <div className="absolute right-12 top-12 h-64 w-64 rounded-full bg-pink-500/40 blur-[100px]" />
        <div className="absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-blue-500/30 blur-[90px]" />
      </div>

      <div className="relative w-full max-w-6xl">
        {/* Hero Section */}
        <section className="mb-8 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight text-white drop-shadow-[0_16px_32px_rgba(32,32,48,0.35)] sm:text-5xl lg:text-6xl mb-4">
            Explore Quiz <span className="text-emerald-300">Topics</span>
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-white/75 mb-4">
            Discover your favorite quiz categories and test your knowledge across different subjects
          </p>
        </section>
        
        {/* Featured Carousel */}
        {featured.length > 0 && (
          <section className="mb-8">
            <div className="relative w-full max-w-5xl mx-auto rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-black/70 via-slate-900/60 to-indigo-900/80 p-6 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-8">
              <h2 className="text-2xl font-semibold text-white mb-6 text-center">
                Featured Topics
              </h2>
              <ShowcaseTopicCarousel items={featured} variant="dark" />
            </div>
          </section>
        )}
        
        {/* Search Bar */}
        <section className="mb-8">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-5 w-5" />
              <Input 
                placeholder="Search topics..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 backdrop-blur-xl"
              />
            </div>
          </div>
        </section>
        
        {/* All Topics Grid */}
        <section className="pb-12">
          <div className="relative w-full max-w-5xl mx-auto rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-black/70 via-slate-900/60 to-indigo-900/80 p-6 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-6 text-center">
              All Topics ({filteredTopics.length})
            </h2>
            
            {filteredTopics.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/60 text-lg">
                  No topics found matching "{searchQuery}"
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTopics.map((topic) => (
                  <ShowcaseTopicCard 
                    key={topic.id} 
                    href={topic.href}
                    title={topic.title}
                    description={topic.description}
                    accentDark={topic.accentDark}
                    accentLight={topic.accentLight}
                    variant="dark"
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
