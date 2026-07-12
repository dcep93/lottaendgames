import { createHash } from 'node:crypto'
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildRuntimeChapter } from '../app/src/app_x/chapterRuntimeBuild'
import type { RuntimeChapterPayload } from '../app/src/app_x/chapterRuntime'
import type { RawChapterSection } from '../app/src/app_x/chapterTypes'

type ChapterManifestEntry = {
  id: string
  label: string
}

type SourceChapterDefinition = ChapterManifestEntry & {
  sections: RawChapterSection[]
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pdfDir = resolve(root, 'app/src/app_x/pdf')
const manifestPath = resolve(root, 'app/src/app_x/chapterManifest.json')
const publicPayloadDir = resolve(root, 'app/public/app_x')
const generatedPayloadDir = resolve(root, 'app/src/app_x/generated')
const payloadManifestPath = resolve(
  root,
  'app/src/app_x/chapterPayloadManifest.ts',
)

const chapterManifest = JSON.parse(
  readFileSync(manifestPath, 'utf8'),
) as ChapterManifestEntry[]
const sourceChapters = chapterManifest.map((chapter) => ({
  ...chapter,
  sections: JSON.parse(
    readFileSync(resolve(pdfDir, `chapter_${chapter.id}.json`), 'utf8'),
  ) as RawChapterSection[],
})) satisfies SourceChapterDefinition[]
const sourceContentHash = getContentHash(sourceChapters)
const sourcePayload = {
  schemaVersion: 1,
  contentHash: `sha256:${sourceContentHash}`,
  chapters: sourceChapters,
}
const runtimeChapters = sourceChapters.map(buildRuntimeChapter)
const runtimeContentHash = getContentHash(runtimeChapters)
const runtimePayload: RuntimeChapterPayload = {
  schemaVersion: 2,
  sourceContentHash: sourcePayload.contentHash,
  contentHash: `sha256:${runtimeContentHash}`,
  chapters: runtimeChapters,
}
const sourceFilename = `chapters.${sourceContentHash.slice(0, 16)}.json`
const runtimeFilename = `chapter-runtime.${runtimeContentHash.slice(0, 16)}.json`

mkdirSync(publicPayloadDir, { recursive: true })
mkdirSync(generatedPayloadDir, { recursive: true })
removeGeneratedPayloads(publicPayloadDir, /^chapter-runtime\..+\.json$/)
removeGeneratedPayloads(publicPayloadDir, /^chapters\..+\.json$/)
removeGeneratedPayloads(generatedPayloadDir, /^chapters\..+\.json$/)
writeJson(resolve(generatedPayloadDir, sourceFilename), sourcePayload, true)
writeJson(resolve(publicPayloadDir, runtimeFilename), runtimePayload)
writeFileSync(
  payloadManifestPath,
  [
    `export const chapterPayloadContentHash = '${runtimePayload.contentHash}'`,
    `export const chapterPayloadPath = 'app_x/${runtimeFilename}'`,
    `export const chapterSourcePayloadContentHash = '${sourcePayload.contentHash}'`,
    `export const chapterSourcePayloadPath = 'generated/${sourceFilename}'`,
    '',
  ].join('\n'),
)

function getContentHash(value: unknown) {
  return createHash('sha256').update(canonicalStringify(value)).digest('hex')
}

function canonicalStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalStringify).join(',')}]`
  }

  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(
        ([key, entryValue]) =>
          `${JSON.stringify(key)}:${canonicalStringify(entryValue)}`,
      )
      .join(',')}}`
  }

  return JSON.stringify(value)
}

function removeGeneratedPayloads(directory: string, pattern: RegExp) {
  for (const name of readdirSync(directory)) {
    if (pattern.test(name)) {
      rmSync(resolve(directory, name))
    }
  }
}

function writeJson(path: string, value: unknown, pretty = false) {
  writeFileSync(path, `${JSON.stringify(value, null, pretty ? 2 : 0)}\n`)
}
