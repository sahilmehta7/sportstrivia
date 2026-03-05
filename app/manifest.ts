import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        id: '/',
        name: 'Sports Trivia',
        short_name: 'Sports Trivia',
        description: 'Compete with friends, climb the leaderboards, and become a sports trivia champion',
        start_url: '/',
        display: 'standalone',
        background_color: '#304152',
        theme_color: '#304152',
        orientation: 'portrait',
        icons: [
            {
                src: '/pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/pwa-maskable-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
        screenshots: [
            {
                src: '/screenshot-desktop.png',
                sizes: '1280x720',
                type: 'image/png',
            },
            {
                src: '/screenshot-mobile.png',
                sizes: '750x1334',
                type: 'image/png',
            },
        ],
        categories: ['sports', 'education', 'games', 'trivia'],
        shortcuts: [
            {
                name: 'Leaderboard',
                url: '/leaderboard',
                description: 'Check the current standings',
            },
            {
                name: 'Quizzes',
                url: '/quizzes',
                description: 'Browse available quizzes',
            },
        ],
        prefer_related_applications: false,
    };
}
