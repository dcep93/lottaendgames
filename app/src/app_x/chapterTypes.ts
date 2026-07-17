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
    boundaryPaths?: PositionBoundaryPath[]
    fen: string
    hideVisualLabel?: boolean
    label: string
    markers?: PositionMarker[]
    number: string
    orientation: BoardOrientation
    quadrantDividers?: boolean
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
  pathPrefix?: string[]
  sectionIndex: number
  token: string
}

export type PlaybackContinuationAlias = {
  alternateOccurrence?: number
  alternateToken: string
  continuationOccurrence?: number
  continuationToken: string
  sectionIndex: number
}

export type PlaybackCanonicalAlias = {
  path: string[]
  sourceOccurrence?: number
  sourcePositionNumber: string
  sourceSectionIndex: number
  sourceToken: string
}

export type PlaybackSegment = {
  parentFen: string
  pathPrefix?: string[]
  positionNumber: string
  sectionIndex: number
  start: string
}

export type PositionMarker = {
  meaning: string
  square: string
  symbol: string
  variant?: 'badge' | 'emphasis' | 'label' | 'label-italic'
}

export type PositionBoundaryPath = {
  meaning: string
  points: PositionBoundaryPoint[]
}

export type PositionBoundaryPoint = {
  x: number
  y: number
}

export type PositionRoute = {
  meaning: string
  squares: string[]
  style?: 'arrow' | 'line' | 'outline'
}

export type PositionSection = {
  content: {
    alternateFens?: string[]
    boundaryPaths?: PositionBoundaryPath[]
    caption?: string
    displayLabel?: string
    fen: string
    hideVisualLabel?: boolean
    markers?: PositionMarker[]
    number: string
    orientation: BoardOrientation
    playbackAnchors?: PlaybackAnchor[]
    playbackCanonicalAliases?: PlaybackCanonicalAlias[]
    playbackCanonicalPaths?: string[]
    playbackCanonicalSourcePositionNumbers?: string[]
    playbackContinuationAliases?: PlaybackContinuationAlias[]
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
    playbackContinuationAliases?: PlaybackContinuationAlias[]
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
