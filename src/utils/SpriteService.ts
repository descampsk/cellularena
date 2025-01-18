import type { SimplePoint } from '@/game/Point'
import { createImage } from './imageLoader'

interface SpriteFrame {
  frame: {
    x: number
    y: number
    w: number
    h: number
  }
  rotated: boolean
  trimmed: boolean
  spriteSourceSize: {
    x: number
    y: number
    w: number
    h: number
  }
  sourceSize: {
    w: number
    h: number
  }
}

interface SpriteSheetData {
  frames: Record<string, SpriteFrame>
  meta: {
    app: string
    version: string
    image: string
    size: {
      w: number
      h: number
    }
    scale: number
  }
}

export class SpriteService {
  private spritesheet: HTMLImageElement | null = null
  private frameData: SpriteSheetData | null = null

  async loadSpritesheet(imageUrl: string, jsonRelativeUrl: string): Promise<void> {
    const jsonUrl = new URL(`../assets/${jsonRelativeUrl}`, import.meta.url).href

    // Load the spritesheet image
    this.spritesheet = await createImage(imageUrl)

    // Load the JSON data
    const response = await fetch(jsonUrl)
    this.frameData = await response.json()
  }

  drawConnector(
    ctx: CanvasRenderingContext2D,
    organ1: SimplePoint,
    organ2: SimplePoint,
    cellSize: number,
  ): void {
    if (!this.spritesheet || !this.frameData) {
      console.error('Spritesheet not loaded')
      return
    }

    const frame = this.frameData.frames['CONNECTOR']
    if (!frame) {
      console.error(`Sprite CONNECTOR not found in the spritesheet`)
      return
    }

    const scale = cellSize / 6 / 24
    const width = 24 * scale
    const height = 45 * scale

    const { x, y } = organ1
    const { x: nx, y: ny } = organ2

    const dx = nx - x
    const dy = ny - y

    ctx.save()

    const centerX = Math.max(x, nx) * cellSize + (cellSize / 2) * (1 - Math.abs(dx))
    const centerY = Math.max(y, ny) * cellSize + (cellSize / 2) * (1 - Math.abs(dy))

    // Move to position and handle rotation
    ctx.translate(centerX, centerY)
    if (dx === 0) {
      ctx.rotate(Math.PI / 2)
    }

    // Draw the sprite
    ctx.drawImage(
      this.spritesheet,
      frame.frame.x,
      frame.frame.y,
      frame.frame.w,
      frame.frame.h,
      -width / 2,
      -height / 2,
      width,
      height,
    )

    ctx.restore()
  }

  drawOrgan(
    ctx: CanvasRenderingContext2D,
    spriteName: string,
    x: number,
    y: number,
    width: number,
    height: number,
    rotation: number = 0,
    opacity: number = 1,
  ): void {
    if (!this.spritesheet || !this.frameData) {
      console.error('Spritesheet not loaded')
      return
    }

    const frame = this.frameData.frames[spriteName]
    if (!frame) {
      console.error(`Sprite "${spriteName}" not found in the spritesheet`)
      return
    }

    ctx.save()

    // Set global alpha for opacity
    ctx.globalAlpha = opacity

    // Move to position and handle rotation
    ctx.translate(x + width / 2, y + width / 2)
    if (rotation !== 0) {
      ctx.rotate(rotation)
    }

    const paddingX = height / 12
    const paddingY = width / 12

    // Draw the sprite
    ctx.drawImage(
      this.spritesheet,
      frame.frame.x,
      frame.frame.y,
      frame.frame.w,
      frame.frame.h,
      -width / 2 + paddingX,
      -height / 2 + paddingY,
      width - paddingX * 2,
      height - paddingY * 2,
    )

    ctx.restore()
  }

  getSpriteFrame(spriteName: string): SpriteFrame | null {
    if (!this.frameData) {
      return null
    }
    return this.frameData.frames[spriteName] || null
  }

  isLoaded(): boolean {
    return this.spritesheet !== null && this.frameData !== null
  }
}
