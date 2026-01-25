import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
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
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
            },
        ],
        screenshots: [
            {
                src: '/og-image.jpg',
                sizes: '1200x630',
                type: 'image/jpeg',
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
