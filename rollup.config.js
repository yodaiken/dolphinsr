import cjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

const pkg = require('./package.json');

const external = Object.keys(pkg.dependencies || {});

export default {
  entry: 'lib/index.js',
  plugins: [
    babel({
      exclude: 'node_modules/**', // only transpile our source code
      babelrc: false,
      presets: [
        ['env', {
          modules: false,
        }],
      ],
      plugins: ['transform-flow-strip-types', 'transform-object-rest-spread', 'external-helpers'],
    }),
    cjs(),
    resolve(),
  ],
  external,
  globals: {
    uuid: 'uuid',
  },

  targets: [
    {
      dest: pkg.main,
      format: 'umd',
      moduleName: pkg.name,
      sourceMap: true,
    },
    {
      dest: pkg.module,
      format: 'es',
      sourceMap: true,
    },
  ],
};
