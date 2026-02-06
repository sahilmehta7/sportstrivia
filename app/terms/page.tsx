import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Usage | Sports Trivia",
    description: "Terms and conditions for using the Sports Trivia platform.",
};

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-24 max-w-4xl">
            <div className="space-y-8">
                <div className="space-y-2 border-b border-white/10 pb-8">
                    <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white font-[family-name:var(--font-barlow)]">
                        Terms of <span className="text-accent">Usage</span>
                    </h1>
                    <p className="text-lg text-white/60 font-medium uppercase tracking-widest max-w-2xl">
                        Rules of the arena. Fair play required at all times.
                    </p>
                </div>

                <div className="prose prose-invert prose-lg max-w-none">
                    <div className="space-y-6 text-white/80 font-light loading-relaxed">
                        <p>
                            These Terms of Usage constitute a legally binding agreement made between you, whether personally or on behalf of an entity (“you”) and Sports Trivia (“we,” “us” or “our”), concerning your access to and use of the sportstrivia.in website.
                        </p>

                        <h3 className="text-2xl font-bold text-white uppercase tracking-tight mt-12 mb-4 font-[family-name:var(--font-barlow)]">
                            1. Agreement to Terms
                        </h3>
                        <p>
                            By accessing the Site, you agree that you have read, understood, and agreed to be bound by all of these Terms of Usage. If you do not agree with all of these Terms of Usage, then you are expressly prohibited from using the Site and you must discontinue use immediately.
                        </p>

                        <h3 className="text-2xl font-bold text-white uppercase tracking-tight mt-12 mb-4 font-[family-name:var(--font-barlow)]">
                            2. Intellectual Property Rights
                        </h3>
                        <p>
                            Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the “Content”) and the trademarks, service marks, and logos contained therein (the “Marks”) are owned or controlled by us or licensed to us.
                        </p>

                        <h3 className="text-2xl font-bold text-white uppercase tracking-tight mt-12 mb-4 font-[family-name:var(--font-barlow)]">
                            3. User Representations
                        </h3>
                        <p>
                            By using the Site, you represent and warrant that:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 marker:text-accent">
                            <li>All registration information you submit will be true, accurate, current, and complete.</li>
                            <li>You will maintain the accuracy of such information and promptly update such registration information as necessary.</li>
                            <li>You have the legal capacity and you agree to comply with these Terms of Usage.</li>
                            <li>You are not a minor in the jurisdiction in which you reside.</li>
                        </ul>

                        <h3 className="text-2xl font-bold text-white uppercase tracking-tight mt-12 mb-4 font-[family-name:var(--font-barlow)]">
                            4. Prohibited Activities
                        </h3>
                        <p>
                            You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
                        </p>

                        <div className="mt-12 p-6 border border-white/10 bg-white/5 rounded-none">
                            <p className="text-sm uppercase tracking-widest text-white/40 mb-2">Last Updated</p>
                            <p className="text-white font-mono">February 6, 2026</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
