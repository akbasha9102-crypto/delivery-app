const fs = require('fs');
const path = require('path');

const metroPkg = path.join(require.resolve('metro/package.json'));
const m = JSON.parse(fs.readFileSync(metroPkg, 'utf8'));

if (!m.exports) {
  console.log('metro: no exports field, skipping patch');
  process.exit(0);
}

const paths = [
  'src/DeltaBundler/Serializers/baseJSBundle',
  'src/DeltaBundler/Serializers/helpers/js',
  'src/DeltaBundler/Serializers/hmrJSBundle',
  'src/DeltaBundler/Serializers/sourceMapGenerator',
  'src/HmrServer',
  'src/IncrementalBundler/RevisionNotFoundError',
  'src/Server',
  'src/lib/TerminalReporter',
  'src/lib/bundleToString',
  'src/lib/createWebsocketServer',
  'src/lib/formatBundlingError',
  'src/lib/getGraphId',
  'src/lib/splitBundleOptions',
  'src/shared/output/bundle',
];

let patched = 0;
for (const p of paths) {
  const key = './' + p;
  if (!m.exports[key]) {
    m.exports[key] = './' + p + '.js';
    patched++;
  }
}

fs.writeFileSync(metroPkg, JSON.stringify(m, null, 2));
console.log(`metro patched: ${patched} paths added`);
