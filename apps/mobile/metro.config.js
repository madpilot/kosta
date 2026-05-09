// Canonical Expo + pnpm workspace metro config. Without these tweaks Metro
// can't resolve workspace packages (`@sprout/shared`, `@sprout/api-client`)
// because pnpm puts deps under .pnpm/ and creates symlinks, both of which
// Metro's default resolver gives up on.

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch every package so live updates propagate.
config.watchFolders = [workspaceRoot];

// pnpm hoists deps under each workspace package; tell Metro to resolve from
// the project's node_modules first, then fall back to the workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Required for pnpm: keep symlinks intact and don't try to walk up the tree.
config.resolver.disableHierarchicalLookup = true;
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
