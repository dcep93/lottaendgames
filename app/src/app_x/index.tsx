import type { ReactNode } from 'react'
import ChapterViewer from './ChapterViewer'
import './styles.css'

export default function AppX({
  readingTarget,
  chapterId,
  moduleSelector,
  onBookNavigate,
  onReadingPositionChange,
  onAnchorSelect,
  onChapterSelect,
}: {
  readingTarget: { anchorId: string | null }
  chapterId: string
  moduleSelector: ReactNode
  onBookNavigate: (href: string) => void
  onReadingPositionChange: (anchorId: string | null) => void
  onAnchorSelect: (anchorId: string) => void
  onChapterSelect: (chapterId: string) => void
}) {
  return (
    <ChapterViewer
      readingTarget={readingTarget}
      chapterId={chapterId}
      moduleSelector={moduleSelector}
      onBookNavigate={onBookNavigate}
      onReadingPositionChange={onReadingPositionChange}
      onAnchorSelect={onAnchorSelect}
      onChapterSelect={onChapterSelect}
    />
  )
}
