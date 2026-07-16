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

export type BoardOrientation = 'black' | 'white'

export type RawChapterSection = {
  content: unknown
  playbackPositionNumbers?: string[]
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
    orientation: BoardOrientation
    relatedPositionNumbers?: string[]
    routes?: PositionRoute[]
    subtitle?: string
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
  playbackPositionNumbers?: string[]
  type: 'panel'
}

export type PlaybackAnchor = {
  occurrence?: number
  parentFen: string
  sectionIndex: number
  token: string
}

export type PlaybackSegment = {
  parentFen: string
  positionNumber: string
  sectionIndex: number
  start: string
}

export type PositionMarker = {
  meaning: string
  square: string
  symbol: string
  variant?: 'badge' | 'emphasis' | 'label'
}

export type PositionRoute = {
  meaning: string
  squares: string[]
  style?: 'arrow' | 'line' | 'outline'
}

export type PositionSection = {
  content: {
    alternateFens?: string[]
    caption?: string
    displayLabel?: string
    fen: string
    markers?: PositionMarker[]
    number: string
    orientation: BoardOrientation
    playbackAnchors?: PlaybackAnchor[]
    playbackSegments?: PlaybackSegment[]
    relatedPositionNumbers?: string[]
    routes?: PositionRoute[]
    subtitle?: string
  }
  type: 'position'
}

export type ProblemSection = {
  content: {
    fen: string
    markers?: PositionMarker[]
    number: string
    orientation: BoardOrientation
    playbackAnchors?: PlaybackAnchor[]
    playbackSegments?: PlaybackSegment[]
    prompt: string
    solution: string
    solutionFen?: string
  }
  type: 'problem'
}

export type TableSection = {
  content: {
    caption?: string
    columns: string[]
    rows: string[][]
  }
  type: 'table'
}

export type TextSection = {
  content: string
  playbackPositionNumbers?: string[]
  type: 'text'
}

export type TitleSection = {
  content: string
  type: 'title'
}
