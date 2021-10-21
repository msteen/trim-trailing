export declare type Args = {
    dryRun: boolean;
    glob: string;
    ignoreFile?: string;
};
export declare function parseArgs(program: string, args?: string[]): Args;
export declare function editFiles(args: Args, edit: (contents: string) => string): Promise<void>;
//# sourceMappingURL=index.d.ts.map