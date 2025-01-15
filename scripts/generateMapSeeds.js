import fs from 'fs'
import path from 'path'

// Read the map.txt file
const mapPath = path.join('map.txt')
const outputPath = path.join('src/game/maps.ts')

try {
  // Read the content of map.txt
  const content = fs.readFileSync(mapPath, 'utf8')

  // Split into lines and filter empty lines
  const seeds = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  // Create the TypeScript content
  const tsContent = `// This file is auto-generated. Do not edit manually.
const seeds = [
${seeds.map((seed) => `  '${seed}',`).join('\n')}
] as const;

type MapSeed = (typeof seeds)[number];

export function getRandomSeed(): MapSeed {
  return seeds[Math.floor(Math.random() * seeds.length)];
}
`

  // Write the TypeScript file
  fs.writeFileSync(outputPath, tsContent)
  console.log(`Successfully generated ${outputPath}`)
} catch (error) {
  console.error('Error generating maps.ts:', error)
  process.exit(1)
}
