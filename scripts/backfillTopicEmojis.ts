import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Map common topic slugs to emojis
const slugToEmoji: Record<string, string> = {
	"sports": "🏅",
	"cricket": "🏏",
	"batting": "🏏",
	"bowling": "🏏",
	"basketball": "🏀",
	"nba": "🏀",
	"football": "🏈",
	"nfl": "🏈",
	"soccer": "⚽",
	"premier-league": "⚽",
	"la-liga": "⚽",
	"fifa": "🏆",
	"baseball": "⚾",
	"mlb": "⚾",
	"hockey": "🏒",
	"nhl": "🏒",
	"tennis": "🎾",
	"golf": "🏌️",
	"formula-1": "🏎️",
	"f1": "🏎️",
	"olympics": "🎖️",
	"wwe": "🤼",
	"ufc": "🥊",
	"boxing": "🥊",
	"mma": "🥋",
	"badminton": "🏸",
	"volleyball": "🏐",
	"rugby": "🏉",
	"cycling": "🚴",
	"marathon": "🏃",
	"chess": "♟️",
	"esports": "🎮",
};

// Fallbacks based on name keywords when slug isn’t in map
const keywordToEmoji: Array<{ keyword: RegExp; emoji: string }> = [
	{ keyword: /cricket/i, emoji: "🏏" },
	{ keyword: /bat(ting)?/i, emoji: "🏏" },
	{ keyword: /bowl(ing)?/i, emoji: "🏏" },
	{ keyword: /basketball|nba/i, emoji: "🏀" },
	{ keyword: /football|nfl/i, emoji: "🏈" },
	{ keyword: /soccer|premier|la\s*liga|serie\s*a|bundesliga/i, emoji: "⚽" },
	{ keyword: /baseball|mlb/i, emoji: "⚾" },
	{ keyword: /hockey|nhl/i, emoji: "🏒" },
	{ keyword: /tennis|grand\s*slam/i, emoji: "🎾" },
	{ keyword: /golf|pga/i, emoji: "🏌️" },
	{ keyword: /formula|f1|grand\s*prix/i, emoji: "🏎️" },
	{ keyword: /olympic/i, emoji: "🎖️" },
	{ keyword: /wwe|wrestling/i, emoji: "🤼" },
	{ keyword: /ufc|mma|octagon/i, emoji: "🥋" },
	{ keyword: /boxing|boxer/i, emoji: "🥊" },
	{ keyword: /badminton/i, emoji: "🏸" },
	{ keyword: /volleyball/i, emoji: "🏐" },
	{ keyword: /rugby/i, emoji: "🏉" },
	{ keyword: /cycle|tour\s*de/i, emoji: "🚴" },
	{ keyword: /marathon|running/i, emoji: "🏃" },
	{ keyword: /chess/i, emoji: "♟️" },
	{ keyword: /esports|gaming|video\s*games/i, emoji: "🎮" },
];

function pickEmoji(slug: string, name: string): string | null {
	if (slug in slugToEmoji) return slugToEmoji[slug];
	for (const { keyword, emoji } of keywordToEmoji) {
		if (keyword.test(name) || keyword.test(slug)) return emoji;
	}
	return null;
}

async function main() {
	const argv = process.argv.slice(2);
	const dryRun = argv.includes("--dry");
	const verbose = argv.includes("--verbose");

	const topics = await prisma.topic.findMany({
		select: ({ id: true, slug: true, name: true, displayEmoji: true } as any),
	} as any);

	let updated = 0;
	let skipped = 0;

	for (const topic of topics) {
		const currentEmoji = (topic as any).displayEmoji as string | null | undefined;
		if (currentEmoji && !verbose) {
			skipped++;
			continue;
		}
		const emoji = pickEmoji(topic.slug, topic.name);
		if (!emoji) {
			if (verbose) {
				console.log(`No emoji mapping for: ${topic.slug} (${topic.name})`);
			}
			skipped++;
			continue;
		}

		if (dryRun) {
			console.log(`[dry-run] Would set ${topic.slug} -> ${emoji}`);
			updated++;
			continue;
		}

		await prisma.topic.update({
			where: { id: topic.id },
			data: ({ displayEmoji: emoji } as any),
		});
		if (verbose) console.log(`Updated ${topic.slug} -> ${emoji}`);
		updated++;
	}

	console.log(`Backfill complete. Updated: ${updated}, Skipped: ${skipped}`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
