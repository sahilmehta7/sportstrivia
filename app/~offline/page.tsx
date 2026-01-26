import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Offline | Sports Trivia',
    description: "You're currently offline. Please check your internet connection.",
};

export default function OfflinePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
            <div className="w-16 h-16 mb-6 rounded-full bg-muted flex items-center justify-center">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted-foreground"
                >
                    <path d="M1 1l22 22" />
                    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                    <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
                    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                    <line x1="12" y1="20" x2="12.01" y2="20" />
                </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">You&apos;re Offline</h1>
            <p className="text-muted-foreground max-w-[400px] mb-8">
                It looks like you&apos;ve lost your internet connection. Please check your network and try again.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
            >
                Try Again
            </button>
        </div>
    );
}
