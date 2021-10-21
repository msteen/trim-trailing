"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
async function main(args) {
    return (0, _1.editFiles)(args, (contents) => contents.replace(/[ \t]+$/gm, ""));
}
main((0, _1.parseArgs)("trim-trailing"));
//# sourceMappingURL=bin.js.map