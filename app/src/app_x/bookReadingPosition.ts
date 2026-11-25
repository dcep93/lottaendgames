// Keep the entire ending bookmarked until its final block leaves the viewport.
// Ending headings and their content are siblings in the chapter article.
export function trackBookReadingPosition(
  chapter: HTMLElement,
  onAnchorChange: (anchorId: string | null) => void,
) {
  const headings = Array.from(chapter.querySelectorAll<HTMLElement>('.leg-ending'))
  if (headings.length === 0) return () => {}

  const endings = headings.map((heading, index) => ({
    heading,
    end: headings[index + 1]?.previousElementSibling ?? chapter.lastElementChild ?? heading,
  }))
  // Navigation restores the requested anchor before installing this listener.
  // Ignore its queued scroll event, preserving explicit position deep links.
  let previousScrollY = window.scrollY
  let previousAnchor: string | null | undefined

  function recordPosition() {
    if (window.scrollY === previousScrollY) return
    previousScrollY = window.scrollY

    const ending = endings.find(({ end }) => end.getBoundingClientRect().bottom > 0)
      ?? endings[endings.length - 1]
    const anchor = headings[0].getBoundingClientRect().top >= window.innerHeight
      ? null
      : ending.heading.id
    if (anchor === previousAnchor) return
    previousAnchor = anchor
    onAnchorChange(anchor)
  }

  window.addEventListener('scroll', recordPosition, { passive: true })
  return () => window.removeEventListener('scroll', recordPosition)
}
