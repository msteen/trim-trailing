"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editFiles = exports.parseArgs = void 0;
const fs = require("fs/promises");
const glob_1 = require("glob");
const globBase = require("glob-base");
const globify_gitignore_1 = require("globify-gitignore");
const path_1 = require("path");
const process_1 = require("process");
function parseArgs(program, args) {
    if (!args)
        args = process_1.argv.slice(2);
    let dryRun = false;
    let glob;
    let ignoreFile;
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (["--check", "--write"].includes(arg) && i + 1 < args.length) {
            dryRun = arg === "--check";
            i++;
            glob = args[i];
        }
        else if (arg === "--ignorefile" && i + 1 < args.length) {
            i++;
            ignoreFile = args[i];
        }
        else if (arg === "--version") {
            printVersion();
        }
        else {
            printHelp(program);
        }
    }
    if (!glob) {
        printHelp(program);
    }
    return {
        dryRun,
        glob: glob,
        ignoreFile,
    };
}
exports.parseArgs = parseArgs;
function printVersion() {
    console.log(require("./package.json").version);
    (0, process_1.exit)(0);
}
function printHelp(program) {
    console.log(`Usage:
  ${program} (--check | --write) <glob> [--ignorefile <file>]
  ${program} --version
  ${program} --help`);
    (0, process_1.exit)(0);
}
async function editFiles(args, edit) {
    let ignore = args.ignoreFile ? await globifyIgnoreFile(args.ignoreFile) : [];
    return new Promise((resolve, reject) => {
        realpathGlob(args.glob).then((glob) => new glob_1.Glob(glob, { ignore })
            .on("match", async (file) => {
            const contents = await fs.readFile(file, "utf8");
            const newContents = edit(contents);
            let done = contents === newContents;
            if (!args.dryRun && !done) {
                try {
                    await fs.writeFile(file, newContents, "utf8");
                    done = true;
                }
                catch (_error) { }
            }
            console.log("[" + (done ? "x" : " ") + "] " + file);
        })
            .on("end", () => resolve())
            .on("error", (error) => reject(error)));
    });
}
exports.editFiles = editFiles;
async function globifyIgnoreFile(ignoreFile) {
    try {
        return (await Promise.all((await (0, globify_gitignore_1.globifyGitIgnore)(await fs.readFile(ignoreFile, "utf8"), (0, path_1.dirname)(ignoreFile))).map(async (glob) => {
            try {
                return await realpathGlob(glob.slice("!".length));
            }
            catch (_error) {
                return "";
            }
        }))).filter((glob) => glob !== "");
    }
    catch (error) {
        console.error(error);
        (0, process_1.exit)(1);
    }
}
async function realpathGlob(glob) {
    const pattern = typeof glob === "string" ? globBase(glob) : glob;
    return (0, path_1.join)(await fs.realpath(pattern.base), pattern.glob);
}
//# sourceMappingURL=index.js.map