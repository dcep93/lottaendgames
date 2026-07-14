import type { ReactNode } from 'react'
import ChapterViewer from './ChapterViewer'
import './styles.css'

export default function AppX({
  anchorId,
  chapterId,
  moduleSelector,
  onAnchorSelect,
  onChapterSelect,
}: {
  anchorId: string | null
  chapterId: string
  moduleSelector: ReactNode
  onAnchorSelect: (anchorId: string) => void
  onChapterSelect: (chapterId: string) => void
}) {
  return (
    <ChapterViewer
      anchorId={anchorId}
      chapterId={chapterId}
      moduleSelector={moduleSelector}
      onAnchorSelect={onAnchorSelect}
      onChapterSelect={onChapterSelect}
    />
  )
}
