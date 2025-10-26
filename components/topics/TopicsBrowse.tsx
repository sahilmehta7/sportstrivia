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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="px-4 py-8 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Explore Quiz Topics
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Discover your favorite quiz categories and test your knowledge across different subjects
        </p>
      </section>
      
      {/* Featured Carousel */}
      {featured.length > 0 && (
        <section className="px-4 py-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6 text-center">
              Featured Topics
            </h2>
            <ShowcaseTopicCarousel items={featured} variant="light" />
          </div>
        </section>
      )}
      
      {/* Search Bar */}
      <section className="px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input 
              placeholder="Search topics..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/80 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
            />
          </div>
        </div>
      </section>
      
      {/* All Topics Grid */}
      <section className="px-4 py-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6 text-center">
            All Topics ({filteredTopics.length})
          </h2>
          
          {filteredTopics.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-lg">
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
                  variant="light"
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
