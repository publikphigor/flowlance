/**
 * Type definitions for FCL interactions.
 * FCL's own types are incomplete, so we define minimal aliases here
 * to keep ESLint happy without polluting the codebase with inline `any`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export type CadenceArg = (value: any, type: any) => any;
export type ArgsFn = (arg: CadenceArg, types: any) => any[];
export type FclAuthz = any;
export type RawChainData = any;
/* eslint-enable @typescript-eslint/no-explicit-any */
