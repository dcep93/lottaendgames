export type ChapterSection =
  | CaptionSection
  | DiagramSection
  | EndingSection
  | HeadingSection
  | PanelSection
  | PositionSection
  | ProblemSection
  | TableSection
  | TextSection
  | TitleSection

export type BookSource = {
  parts: BookPartSource[]
  schemaVersion: 1
}

export type BookPartSource = {
  id: string
  label: string
  name: string
  sections: RawChapterSection[]
}

export type RawChapterSection = {
  content: unknown
  type: string
}

export type CaptionSection = {
  content: string
  type: 'caption'
}

export type DiagramSection = {
  content: {
    fen: string
    label: string
    markers?: PositionMarker[]
    number: string
  }
  type: 'diagram'
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
  variant?: 'badge' | 'label'
}

export type PositionSection = {
  content: {
    alternateFens?: string[]
    caption?: string
    displayLabel?: string
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

export type TableSection = {
  content: {
    caption: string
    columns: string[]
    rows: string[][]
  }
  type: 'table'
}

export type TextSection = {
  content: string
  type: 'text'
}

export type TitleSection = {
  content: string
  type: 'title'
}
