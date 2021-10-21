import { Args, editFiles, parseArgs } from '.';

async function main(args: Args) {
  return editFiles(args, (contents) => contents.replace(/[ \t]+$/gm, ""))
}
main(parseArgs(__dirname))
