# Prose And Panel Presentation Design

## Goal

Make the chapter reading hierarchy reflect the source material rather than the
presence of chess notation. Ordinary prose should look consistent, while rules,
summaries, and other source-emphasized panels should receive the pink callout
treatment.

## Rendering

- Render `text` and `moves` sections through the same normal prose presentation.
- Preserve the section types in JSON because they remain useful semantic input
  for move parsing and audits.
- Preserve clickable SAN playback in both section types.
- Render `panel` sections with the existing pink left indentation and subtle pink
  background previously associated with `moves`.
- Render a titled panel as one continuous paragraph in the form `Title: text`.
  The title and body use the same font weight, size, family, and line height.
- Render an untitled panel as its text without adding a prefix.

## Implementation Boundaries

Use the existing prose and panel components. Consolidate the `moves` renderer
onto the prose component instead of reproducing prose styles in a second CSS
class. Update the panel component and styles only as needed for inline title
flow and the callout treatment. Do not rewrite chapter JSON.

## Verification

- Component-level assertions should show that `text` and `moves` use the same
  prose markup while retaining playback tokens.
- Panel assertions should cover titled and untitled content and ensure a title
  is followed by `: ` in the same paragraph.
- Run the existing unit, content, structural, and build checks relevant to the
  renderer.
- Do not perform a visual end-to-end pass, consistent with `AGENTS.md`.
