import * as fs from "fs/promises"
import { Glob } from "glob"
import * as globBase from "glob-base"
import { globifyGitIgnore } from "globify-gitignore"
import { dirname, join } from "path"
import { argv, exit } from "process"

export type Args = {
  dryRun: boolean
  glob: string
  ignoreFile?: string
}

export function parseArgs(program: string, args?: string[]): Args {
  if (!args) args = argv.slice(2)
  let dryRun = false
  let glob: string | undefined
  let ignoreFile: string | undefined
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (["--check", "--write"].includes(arg) && i + 1 < args.length) {
      dryRun = arg === "--check"
      i++
      glob = args[i]
    } else if (arg === "--ignorefile" && i + 1 < args.length) {
      i++
      ignoreFile = args[i]
    } else if (arg === "--version") {
      printVersion()
    } else {
      printHelp(program)
    }
  }
  if (!glob) {
    printHelp(program)
  }
  return {
    dryRun,
    glob: glob as string,
    ignoreFile,
  }
}

function printVersion() {
  console.log(require("./package.json").version)
  exit(0)
}

function printHelp(program: string) {
  console.log(`Usage:
  ${program} (--check | --write) <glob> [--ignorefile <file>]
  ${program} --version
  ${program} --help`)
  exit(0)
}

export async function editFiles(args: Args, edit: (contents: string) => string): Promise<void> {
  let ignore = args.ignoreFile ? await globifyIgnoreFile(args.ignoreFile) : []
  return new Promise((resolve, reject) => {
    realpathGlob(args.glob).then((glob) =>
      new Glob(glob, { ignore })
        .on("match", async (file) => {
          const contents = await fs.readFile(file, "utf8")
          const newContents = edit(contents)
          let done = contents === newContents
          if (!args.dryRun && !done) {
            try {
              await fs.writeFile(file, newContents, "utf8")
              done = true
            } catch (_error) {}
          }
          console.log("[" + (done ? "x" : " ") + "] " + file)
        })
        .on("end", () => resolve())
        .on("error", (error) => reject(error)),
    )
  })
}

async function globifyIgnoreFile(ignoreFile: string): Promise<string[]> {
  try {
    return (
      await Promise.all(
        (
          await globifyGitIgnore(await fs.readFile(ignoreFile, "utf8"), dirname(ignoreFile))
        ).map(async (glob) => {
          try {
            return await realpathGlob(glob.slice("!".length))
          } catch (_error) {
            return ""
          }
        }),
      )
    ).filter((glob) => glob !== "")
  } catch (error) {
    console.error(error)
    exit(1)
  }
}

async function realpathGlob(glob: any): Promise<string> {
  const pattern = typeof glob === "string" ? globBase(glob) : glob
  return join(await fs.realpath(pattern.base), pattern.glob)
}
