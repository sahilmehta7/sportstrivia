import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy | Sports Trivia",
    description: "Privacy Policy for Sports Trivia usage and data protection.",
};

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-24 max-w-4xl">
            <div className="space-y-8">
                <div className="space-y-2 border-b border-white/10 pb-8">
                    <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white font-[family-name:var(--font-barlow)]">
                        Privacy <span className="text-accent">Policy</span>
                    </h1>
                    <p className="text-lg text-white/60 font-medium uppercase tracking-widest max-w-2xl">
                        Transparency is our game. Here is how we handle your data.
                    </p>
                </div>

                <div className="prose prose-invert prose-lg max-w-none">
                    <div className="space-y-6 text-white/80 font-light loading-relaxed">
                        <p>
                            At Sports Trivia, we respect your privacy and are committed to protecting your personal data.
                            This privacy policy will inform you as to how we look after your personal data when you visit
                            our website and tell you about your privacy rights.
                        </p>

                        <h3 className="text-2xl font-bold text-white uppercase tracking-tight mt-12 mb-4 font-[family-name:var(--font-barlow)]">
                            1. Information We Collect
                        </h3>
                        <p>
                            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 marker:text-accent">
                            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
                            <li><strong>Contact Data</strong> includes email address.</li>
                            <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version.</li>
                            <li><strong>Usage Data</strong> includes information about how you use our website, products and services (quiz scores, streaks, etc).</li>
                        </ul>

                        <h3 className="text-2xl font-bold text-white uppercase tracking-tight mt-12 mb-4 font-[family-name:var(--font-barlow)]">
                            2. How We Use Your Data
                        </h3>
                        <p>
                            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 marker:text-accent">
                            <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                        </ul>

                        <h3 className="text-2xl font-bold text-white uppercase tracking-tight mt-12 mb-4 font-[family-name:var(--font-barlow)]">
                            3. Data Security
                        </h3>
                        <p>
                            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed.
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
