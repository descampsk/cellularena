import type { SimplePoint } from '@/game/Point'
import { createImage } from './imageLoader'
import type { OrganType } from '@/game/State'
import { Direction, type Entity } from '@/game/Entity'

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

export const ORGAN_ANCHORS: Record<OrganType, { x: number; y: number }> = {
  BASIC: { x: 0.5, y: 0.5 },
  HARVESTER: { x: 84 / 503, y: 0.5 },
  ROOT: { x: 0.5, y: 0.5 },
  SPORER: {
    x: (239 + 72) / 2 / 412,
    y: (186 + 19) / 2 / 205,
  },
  TENTACLE: {
    x: (73 + 241) / 2 / 581,
    y: (262 + 95) / 2 / 329,
  },
}

const MAX_FRAME_ANIMATION = {
  TENTACLE: 25,
  ROOT: 0,
  SPORER: 0,
  HARVESTER: 17,
  BASIC: 0,
  GROW: 7,
}

const SPRITE_WIDTH_REF = 168

const directionToRotation: Record<Direction, number> = {
  [Direction.E]: 0,
  [Direction.N]: -Math.PI / 2,
  [Direction.W]: Math.PI,
  [Direction.S]: Math.PI / 2,
  [Direction.X]: 0,
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
    organ: Entity,
    cellSize: number,
    opacity: number = 1,
    frameIndex: number = 0,
  ): boolean {
    if (!this.spritesheet || !this.frameData) {
      console.error('Spritesheet not loaded')
      return false
    }

    const animatedFrame = organ.isGrowing
      ? this.frameData.frames[`GROW_${frameIndex}`]
      : this.frameData.frames[`${organ.type}_${frameIndex}`]

    const frame = organ.shouldBeAnimated ? animatedFrame : this.frameData.frames[`${organ.type}_0`]
    if (!frame) {
      console.error(`Sprite "${organ.type}" not found in the spritesheet`)
      return false
    }

    ctx.save()

    // Set global alpha for opacity
    ctx.globalAlpha = opacity

    const { x, y } = organ
    // Move to position and handle rotation
    ctx.translate(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2)
    const rotation = directionToRotation[organ.organDir]
    if (rotation !== 0) {
      ctx.rotate(rotation)
    }

    const anchor = ORGAN_ANCHORS[organ.type as OrganType]

    const padding = cellSize / 12

    const scale = (cellSize - padding * 2) / SPRITE_WIDTH_REF
    ctx.drawImage(
      this.spritesheet,
      frame.frame.x,
      frame.frame.y,
      frame.frame.w,
      frame.frame.h,
      -anchor.x * frame.frame.w * scale,
      -anchor.y * frame.frame.h * scale,
      frame.frame.w * scale,
      frame.frame.h * scale,
    )

    ctx.restore()

    const maxFrame = MAX_FRAME_ANIMATION[organ.isGrowing ? 'GROW' : (organ.type as OrganType)]
    if (frameIndex >= maxFrame || !organ.shouldBeAnimated) {
      organ.shouldBeAnimated = false
      organ.isGrowing = false
      return false
    }

    return organ.shouldBeAnimated
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
