import type { ReactNode } from 'react'
import ChapterViewer from './ChapterViewer'
import './styles.css'

export default function AppX({
  anchorId,
  chapterId,
  moduleSelector,
  onBookNavigate,
  onAnchorSelect,
  onChapterSelect,
}: {
  anchorId: string | null
  chapterId: string
  moduleSelector: ReactNode
  onBookNavigate: (href: string) => void
  onAnchorSelect: (anchorId: string) => void
  onChapterSelect: (chapterId: string) => void
}) {
  return (
    <ChapterViewer
      anchorId={anchorId}
      chapterId={chapterId}
      moduleSelector={moduleSelector}
      onBookNavigate={onBookNavigate}
      onAnchorSelect={onAnchorSelect}
      onChapterSelect={onChapterSelect}
    />
  )
}
