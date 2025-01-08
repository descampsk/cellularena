export class InputParser {
  private readNextLine(lines: string[]) {
    return lines.shift()!
  }

  public getMapSize(lines: string[]) {
    const mapSize = this.readNextLine(lines)
    return mapSize
  }

  public getTurnInputs(lines: string[]) {
    const inputs: string[] = []

    const entityCount = this.readNextLine(lines)
    inputs.push(entityCount)

    for (let i = 0; i < parseInt(entityCount); i++) {
      inputs.push(this.readNextLine(lines))
    }

    // My proteins
    inputs.push(this.readNextLine(lines))
    // Opponent proteins
    inputs.push(this.readNextLine(lines))
    // Required actions count
    inputs.push(this.readNextLine(lines))

    return inputs
  }
}

export const inputParser = new InputParser()
