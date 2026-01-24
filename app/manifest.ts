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
        icons: [
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
            },
        ],
    };
}
