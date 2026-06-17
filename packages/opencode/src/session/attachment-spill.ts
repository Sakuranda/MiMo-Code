import path from "path"
import { Effect } from "effect"
import { AppFileSystem } from "@mimo-ai/shared/filesystem"

export namespace AttachmentSpill {
  const MAX_BYTES = 50 * 1024 * 1024

  export interface Result {
    savedPath: string
    relativePath: string
    sizeBytes: number
  }

  export function decodeBinaryDataUrl(url: string): Uint8Array {
    const idx = url.indexOf(",")
    if (idx === -1) return new Uint8Array()
    const head = url.slice(0, idx)
    const body = url.slice(idx + 1)
    if (head.includes(";base64")) return new Uint8Array(Buffer.from(body, "base64"))
    return new Uint8Array(Buffer.from(decodeURIComponent(body), "utf8"))
  }

  export function sanitize(name: string): string {
    const base = name.split(/[\\/]/).pop() ?? "file"
    let clean = base
      .replace(/[^A-Za-z0-9._-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^\.+/, "")
    if (!clean) clean = "file"
    if (clean.length > 200) {
      const dot = clean.lastIndexOf(".")
      const ext = dot > 0 ? clean.slice(dot) : ""
      clean = clean.slice(0, 200 - ext.length) + ext
    }
    return clean
  }

  export function humanSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    const units = ["KB", "MB", "GB"]
    let value = bytes / 1024
    let unit = 0
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024
      unit += 1
    }
    return `${value.toFixed(value >= 10 || Number.isInteger(value) ? 0 : 1)} ${units[unit]}`
  }

  export const materialize = Effect.fn("AttachmentSpill.materialize")(function* (args: {
    fsys: AppFileSystem.Interface
    cwd: string
    sessionID: string
    partID: string
    filename: string
    url: string
  }) {
    const bytes = decodeBinaryDataUrl(args.url)
    if (bytes.byteLength === 0) return yield* Effect.fail(new Error("attachment is empty"))
    if (bytes.byteLength > MAX_BYTES)
      return yield* Effect.fail(new Error(`attachment exceeds ${MAX_BYTES} bytes`))

    const shortId = args.partID.slice(-8).replace(/[^A-Za-z0-9]/g, "") || "0"
    const name = `${shortId}-${sanitize(args.filename || "file")}`

    const dir = path.join(args.cwd, "uploads", args.sessionID)
    const savedPath = path.join(dir, name)

    const resolved = path.resolve(savedPath)
    const baseDir = path.resolve(dir)
    if (resolved !== baseDir && !resolved.startsWith(baseDir + path.sep))
      return yield* Effect.fail(new Error("invalid attachment path"))

    yield* args.fsys.writeWithDirs(resolved, bytes)

    return {
      savedPath: resolved,
      relativePath: "./" + path.relative(args.cwd, resolved).split(path.sep).join("/"),
      sizeBytes: bytes.byteLength,
    } satisfies Result
  })
}
