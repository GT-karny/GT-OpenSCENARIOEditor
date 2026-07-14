// Node-only entry point: `@osce/esmini/node`.
//
// `GtSimService` orchestrates GT_Sim REST + gRPC streaming, and its gRPC
// client (`GtSimGrpcClient`) depends on `@grpc/grpc-js` / `@grpc/proto-loader`
// plus Node's `path`/`url` modules to resolve and load the `.proto` files
// from disk. None of that resolves in a browser bundle, so it is kept out of
// the default `.` barrel (`src/index.ts`) and exported from this Node-only
// subpath instead. Import this from Node-hosted consumers only (e.g. Electron
// main process, server-side code) — never from `apps/web`.
export { GtSimService } from './service/gt-sim-service.js';
