export function generatePattern(seed: string): { backgroundImage: string; backgroundColor: string } {
    // Simple PCG hash
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = Math.imul(31, hash) + seed.charCodeAt(i) | 0;
    }

    const absHash = Math.abs(hash);

    // Generate harmonious colors (HSL)
    const hue = absHash % 360;
    const sat = 60 + (absHash % 20); // 60-80%
    const light = 50 + (absHash % 10); // 50-60%

    const baseColor = `hsl(${hue}, ${sat}%, ${light}%)`;
    const secondaryColor = `hsl(${(hue + 30) % 360}, ${sat}%, ${light - 10}%)`;

    // Deterministic pattern choice
    const patterns = [
        // Circles
        `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
        // Diagonal lines
        `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2' stroke='%23ffffff' stroke-opacity='0.1' stroke-width='2'/%3E%3C/svg%3E")`,
        // Triangles
        `url("data:image/svg+xml,%3Csvg width='12' height='16' viewBox='0 0 12 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 0L0 8L6 16L12 8L6 0z' fill='%23ffffff' fill-opacity='0.1'/%3E%3C/svg%3E")`
    ];

    const patternIndex = absHash % patterns.length;
    const pattern = patterns[patternIndex];

    return {
        backgroundColor: baseColor,
        backgroundImage: `linear-gradient(135deg, ${baseColor}, ${secondaryColor}), ${pattern}`
    };
}
