/**
 * Script: Delete old "Premier League Rivals Grid" Quiz and re-seed as a proper GridQuiz
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🗑️  Deleting old Grid Quiz (slug: premier-league-rivals-grid)...");

    // Find old quiz
    const oldQuiz = await prisma.quiz.findUnique({
        where: { slug: "premier-league-rivals-grid" },
    });

    if (oldQuiz) {
        // Cascade delete: QuizQuestionPool, QuizTagRelation, QuizAttempts, etc.
        await prisma.quiz.delete({ where: { id: oldQuiz.id } });
        console.log(`✓ Deleted old Quiz "${oldQuiz.title}" (${oldQuiz.id})`);
    } else {
        console.log("• No old Quiz with slug 'premier-league-rivals-grid' found. Skipping delete.");
    }

    // Also clean up orphaned questions that were created specifically for this grid
    // These have questionText matching "Row: ..., Col: ..." pattern
    const orphanedQuestions = await prisma.question.findMany({
        where: {
            questionText: { startsWith: "Row: " },
        },
        select: { id: true, questionText: true },
    });

    if (orphanedQuestions.length > 0) {
        console.log(`🧹 Cleaning up ${orphanedQuestions.length} orphaned grid questions...`);
        await prisma.question.deleteMany({
            where: {
                id: { in: orphanedQuestions.map((q) => q.id) },
            },
        });
        console.log("✓ Orphaned grid questions deleted.");
    }

    // ---- Now seed as GridQuiz ----
    console.log("\n📦 Seeding new GridQuiz...");

    const rows = ["Man Utd", "Real Madrid", "England"];
    const cols = ["Liverpool", "Man City", "UCL Winner"];

    // cellAnswers[row][col] = newline-separated accepted answers
    const cellAnswers = [
        // Row 0: Man Utd
        [
            "Michael Owen\nPaul Ince\nPeter Beardsley",
            "Carlos Tevez\nPeter Schmeichel\nAndy Cole\nOwen Hargreaves\nDenis Law\nJadon Sancho\nBrian Kidd",
            "Cristiano Ronaldo\nWayne Rooney\nRio Ferdinand\nPaul Scholes\nRyan Giggs\nNemanja Vidic\nEdwin van der Sar\nDavid Beckham\nGary Neville\nTeddy Sheringham\nOle Gunnar Solskjaer\nCasemiro\nRaphael Varane\nAngel Di Maria\nGerard Pique",
        ],
        // Row 1: Real Madrid
        [
            "Michael Owen\nXabi Alonso\nSteve McManaman\nJerzy Dudek\nFernando Morientes\nNicolas Anelka\nAlvaro Arbeloa\nNuri Sahin\nFabinho",
            "Steve McManaman\nNicolas Anelka\nRobinho\nEmmanuel Adebayor\nJavi Garcia\nBrahim Diaz\nDanilo\nMateo Kovacic\nAymeric Laporte",
            "Cristiano Ronaldo\nSergio Ramos\nLuka Modric\nKarim Benzema\nMarcelo\nGareth Bale\nToni Kroos\nCasemiro\nRaul\nIker Casillas\nRoberto Carlos\nZinedine Zidane\nLuis Figo\nRonaldo Nazario\nKaka\nPepe\nAngel Di Maria\nSami Khedira\nXabi Alonso",
        ],
        // Row 2: England
        [
            "Steven Gerrard\nMichael Owen\nJamie Carragher\nRobbie Fowler\nJordan Henderson\nTrent Alexander-Arnold\nPeter Crouch\nEmile Heskey\nJames Milner\nJoe Gomez\nAdam Lallana\nDaniel Sturridge\nRaheem Sterling\nJoe Cole",
            "Raheem Sterling\nJoe Hart\nKyle Walker\nJohn Stones\nPhil Foden\nJack Grealish\nJames Milner\nGareth Barry\nShaun Wright-Phillips\nMicah Richards\nFrank Lampard\nFabian Delph\nKalvin Phillips\nRico Lewis",
            "Wayne Rooney\nRio Ferdinand\nPaul Scholes\nSteve McManaman\nSteven Gerrard\nFrank Lampard\nJohn Terry\nAshley Cole\nGary Cahill\nJordan Henderson\nTrent Alexander-Arnold\nMason Mount\nReece James\nBen Chilwell\nAdam Lallana\nDaniel Sturridge\nJoe Gomez\nOwen Hargreaves\nWes Brown\nNicky Butt\nTeddy Sheringham\nDavid Beckham\nGary Neville\nPhil Neville",
        ],
    ];

    const gridQuiz = await prisma.gridQuiz.upsert({
        where: { slug: "premier-league-rivals-grid" },
        update: {
            cellAnswers: cellAnswers,
        },
        create: {
            title: "Premier League Rivals Grid",
            slug: "premier-league-rivals-grid",
            description:
                "Immaculate Grid: Test your knowledge of Premier League rivalries and superstars.",
            sport: "Football",
            status: "PUBLISHED",
            size: 3,
            rows: rows,
            cols: cols,
            cellAnswers: cellAnswers,
            timeLimit: 300,
        },
    });

    console.log(`✅ GridQuiz created: "${gridQuiz.title}" (${gridQuiz.id})`);
    console.log(`   Slug: ${gridQuiz.slug}`);
    console.log(`   Rows: ${rows.join(", ")}`);
    console.log(`   Cols: ${cols.join(", ")}`);
    console.log(`   Cells: ${cellAnswers.flat().length} cells with answers`);
    console.log("\n🎉 Done! You can now play at: /grids/premier-league-rivals-grid/play");
}

main()
    .catch((e) => {
        console.error("Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
