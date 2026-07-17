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
import { buildBookReferenceIndex } from '../app/src/app_x/bookReferences'
import { validateBookSource } from '../app/src/app_x/bookSourceValidation'
import type { RuntimeChapterPayload } from '../app/src/app_x/chapterRuntime'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pdfDir = resolve(root, 'app/src/app_x/pdf')
const publicPayloadDir = resolve(root, 'app/public/app_x')
const payloadManifestPath = resolve(
  root,
  'app/src/app_x/chapterPayloadManifest.ts',
)

const bookSource = validateBookSource(
  JSON.parse(readFileSync(resolve(pdfDir, 'book.json'), 'utf8')),
)
const sourceChapters = bookSource.parts
const sourceContentHash = getContentHash(sourceChapters)
const referenceIndex = buildBookReferenceIndex(sourceChapters)
const runtimeChapters = sourceChapters.map((chapter) =>
  buildRuntimeChapter(chapter, referenceIndex),
)
const runtimeContentHash = getContentHash(runtimeChapters)
const runtimePayload: RuntimeChapterPayload = {
  schemaVersion: 3,
  sourceContentHash: `sha256:${sourceContentHash}`,
  contentHash: `sha256:${runtimeContentHash}`,
  chapters: runtimeChapters,
}
const runtimeFilename = `chapter-runtime.${runtimeContentHash.slice(0, 16)}.json`

mkdirSync(publicPayloadDir, { recursive: true })
removeGeneratedPayloads(publicPayloadDir, /^chapter-runtime\..+\.json$/)
removeGeneratedPayloads(publicPayloadDir, /^chapters\..+\.json$/)
writeJson(resolve(publicPayloadDir, runtimeFilename), runtimePayload)
writeFileSync(
  payloadManifestPath,
  [
    `export const chapterPayloadContentHash = '${runtimePayload.contentHash}'`,
    `export const chapterPayloadPath = 'app_x/${runtimeFilename}'`,
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
