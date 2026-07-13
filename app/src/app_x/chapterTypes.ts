export type ChapterSection =
  | CaptionSection
  | EndingSection
  | HeadingSection
  | PanelSection
  | PositionSection
  | ProblemSection
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

export type HeadingSection = {
  content: string
  type: 'heading'
}

export type PanelSection = {
  content: {
    text: string
    title?: string
  }
  type: 'panel'
}

export type PositionMarker = {
  meaning: string
  square: string
  symbol: string
}

export type PositionSection = {
  content: {
    alternateFens?: string[]
    caption?: string
    fen: string
    markers?: PositionMarker[]
    number: string
    subtitle?: string
  }
  type: 'position'
}

export type ProblemSection = {
  content: {
    fen: string
    markers?: PositionMarker[]
    number: string
    prompt: string
    solution: string
    solutionFen?: string
  }
  type: 'problem'
}

export type TextSection = {
  content: string
  type: 'text'
}

export type TitleSection = {
  content: string
  type: 'title'
}
