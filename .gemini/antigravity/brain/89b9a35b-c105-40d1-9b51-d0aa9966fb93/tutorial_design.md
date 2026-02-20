# Grids Lobby Header Revamp: Interactive Tutorial

## Goal
Transform the verbose, empty-spaced header into a compact, high-utility "Mission Control" center that teaches the game mechanic instantly.

## 📐 New Layout Structure (2-Column)

### Column 1: Concise Context (Left)
- **Status Pill**: `IMMACULATE GRID: LIVE OPS`
- **Heading**: `TACTICAL <br/> DATA GRIDS` (Barlow Condensed, XL)
- **Constraint-Based Desc**: "3 Categories. 3 Stats. 9 Cells. One Immaculate Solution." 
- **CTA**: Scroll to "Operational Matrices" button.

### Column 2: The "Interactive Tutorial" Grid (Right)
A 2x2 animated matrix demonstrating the logical intersection.

**Components:**
1. **The Row Label**: `[Lakers Icons]`
2. **The Col Label**: `[MVP Icons]`
3. **The Solution Cell**: Initial state `?`.
4. **The "Auto-Solve" Sequence**: 
   - Animate a scanning line across Row 1.
   - Animate a scanning line down Col 1.
   - At intersection: Flash "DATA MATCH".
   - Replace `?` with a player silhouette/name (e.g., "Kobe Bryant").
   - Display `Rarity: 0.1%` in a small neon pill.

## 🛠️ Implementation Strategy
- **File**: Create `components/grid/GridTutorialCard.tsx`.
- **Logic**: Use `framer-motion` for the sequential scanning lines and the data reveal.
- **Integration**: Insert into `app/grids/page.tsx` replacing the current 2-column image.

## Decision Log
- **Decision**: Use Option 1 (Interactive Tutorial).
- **Reasoning**: Best balance of "Show" vs "Tell". Direct visual demonstration of the game's core innovation (rarity + intersections).
- **Alternative Considered**: The "Static Image" (current) was too passive. The "Live Feed" was too chaotic for a lobby.
