
const { exec } = require('child_process');

const url = 'http://localhost:3000/quizzes';
const iterations = 5;

function runBenchmark() {
    console.log(`Benchmarking ${url} with ${iterations} iterations...`);

    let totalTime = 0;
    let completed = 0;

    for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        exec(`curl -o /dev/null -s -w "%{time_total}\n" ${url}`, (error, stdout) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                return;
            }
            const time = parseFloat(stdout);
            console.log(`Run ${i + 1}: ${time}s`);
            totalTime += time;
            completed++;

            if (completed === iterations) {
                const avg = totalTime / iterations;
                console.log(`\nAverage Load Time: ${avg.toFixed(3)}s`);
            }
        });
    }
}

runBenchmark();
