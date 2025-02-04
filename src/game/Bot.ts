export const BotNames = ['Apofils', 'reCurse'] as const

export type BotName = (typeof BotNames)[number]

export type Bot = {
  description: string
  elo: number
  availibility: 'GA' | 'ALPHA' | 'BETA'
}

export const Bots: Record<BotName, Bot> = {
  Apofils: {
    description: "Apofils contest's bot which end up in the 38th place",
    elo: 18.24,
    availibility: 'GA',
  },
  reCurse: {
    description: "reCurse winner contest's bot",
    elo: 32.69,
    availibility: 'ALPHA',
  },
}
