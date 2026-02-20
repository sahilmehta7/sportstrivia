const fs = require('fs');

const data = fs.readFileSync('components/daily/WordleGame.tsx', 'utf8');
const lines = data.split('\n');

// Find the boundaries
let useEffectStart = -1;
let submitGuessStart = -1;
let submitGuessEnd = -1;
let handleKeyPressStart = -1;
let handleKeyPressEnd = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('// Listen for physical keyboard') || (lines[i].includes('useEffect(() => {') && !lines[i-1].includes('submitGuess')) && useEffectStart === -1) {
        if (lines[i-1] && lines[i-1].includes('// Listen for physical keyboard')) {
           useEffectStart = i - 1;
        } else {
           useEffectStart = i;
        }
    }
    if (lines[i].includes('const submitGuess = useCallback(async () => {')) {
        submitGuessStart = i;
    }
    if (lines[i].includes('}, [currentGuess, gameId, letterStatuses, toast, wordLength, isSubmitting]);') && submitGuessStart !== -1) {
        submitGuessEnd = i;
    }
    if (lines[i].includes('const handleKeyPress = useCallback((key: string) => {')) {
        handleKeyPressStart = i;
    }
    if (lines[i].includes('}, [currentGuess, wordLength, gameOver, isSubmitting, submitGuess, toast]);') && handleKeyPressStart !== -1) {
        handleKeyPressEnd = i;
    }
}

console.log({useEffectStart, submitGuessStart, submitGuessEnd, handleKeyPressStart, handleKeyPressEnd});

if (useEffectStart !== -1 && submitGuessStart !== -1 && handleKeyPressStart !== -1) {
    const useEffectBlock = lines.slice(useEffectStart, submitGuessStart);
    const submitGuessBlock = lines.slice(submitGuessStart, submitGuessEnd + 1);
    const handleKeyPressBlock = lines.slice(handleKeyPressStart, handleKeyPressEnd + 1);
    
    // We want the order to be: submitGuess, handleKeyPress, useEffect
    
    // Replace the area in the file
    const startIdx = Math.min(useEffectStart, submitGuessStart, handleKeyPressStart);
    const endIdx = Math.max(useEffectStart + useEffectBlock.length - 1, submitGuessEnd, handleKeyPressEnd);

    lines.splice(startIdx, endIdx - startIdx + 1, ...submitGuessBlock, '', ...handleKeyPressBlock, '', ...useEffectBlock);

    fs.writeFileSync('components/daily/WordleGame.tsx', lines.join('\n'));
    console.log('Reordered successful.');
}

