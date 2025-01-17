import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, basename } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const mapsDir = join(__dirname, '../public/maps')

function updateMapFile(filePath) {
  const content = readFileSync(filePath, 'utf8')
  const lines = content.split('\n')

  // Get width from first line
  const [width] = lines[0].split(' ').map(Number)
  const halfWidth = width / 2

  let modified = false
  const updatedLines = lines.map((line) => {
    if (line.includes('ROOT')) {
      const parts = line.split(' ')
      const x = parseInt(parts[0])
      const currentPlayerId = parseInt(parts[3])
      const expectedPlayerId = x < halfWidth ? 0 : 1

      if (currentPlayerId !== expectedPlayerId) {
        modified = true
        parts[3] = expectedPlayerId.toString()
        return parts.join(' ')
      }
    }
    return line
  })

  if (modified) {
    console.log(`Updating file: ${basename(filePath)}`)
    writeFileSync(filePath, updatedLines.join('\n'))
  }
}

function processAllMaps() {
  const files = readdirSync(mapsDir)

  files.forEach((file) => {
    const filePath = join(mapsDir, file)
    if (statSync(filePath).isFile()) {
      try {
        updateMapFile(filePath)
      } catch (error) {
        console.error(`Error processing ${file}:`, error)
      }
    }
  })
}

processAllMaps()
