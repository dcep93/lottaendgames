export type ChapterSection =
  | CaptionSection
  | EndingSection
  | MovesSection
  | PositionSection
  | TextSection
  | TitleSection

export type RawChapterSection = {
  content: unknown
  type: string
}

export type CaptionSection = {
  content: string
  type: 'caption'
}

export type EndingSection = {
  content: {
    number: string
    text: string
  }
  type: 'ending'
}

export type MovesSection = {
  content: string
  type: 'moves'
}

export type PositionMarker = {
  meaning: string
  square: string
  symbol: string
}

export type PositionSection = {
  content: {
    caption?: string
    fen: string
    markers?: PositionMarker[]
    number: string
  }
  type: 'position'
}

export type TextSection = {
  content: string
  type: 'text'
}

export type TitleSection = {
  content: string
  type: 'title'
}
