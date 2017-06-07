import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';

export default function(external) {
  return {
    entry: 'src/index.js',
    targets: [
      { dest: 'dist/index.js', format: 'cjs' },
      { dest: 'dist/index.es.js', format: 'es' },
    ],
    external: external.concat(/^babel-runtime/),
    plugins: [
      json(),
      babel({
        presets: [
          ["env", {
            targets: {
              browsers: ["last 2 versions", "> 2%"]
            },
            modules: false,
          }],
        ],
        plugins: [
          'transform-runtime',
        ],
        runtimeHelpers: true,
      }),
    ],
  };
}
