import { createRequire } from 'node:module';

import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import path from 'path';
import external from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';
import typescript from 'rollup-plugin-typescript2';
import { visualizer } from 'rollup-plugin-visualizer';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');
const nodeEnv = process.env.NODE_ENV;

const entry = './src';
const extensions = /\.(js|ts)$/;
const excludeExtensions = /(test|types|styled)\.(js|ts|jsx|tsx)$/;

export default [
  {
    input: ["src/index.ts"],
    output: [
      {
        dir: path.dirname(pkg.module),
        format: 'es',
        preserveModules: true,
        preserveModulesRoot: 'src',
        sourcemap: nodeEnv === 'production' ? false : 'inline',
        interop: 'compat',
      },
    ],
    plugins: [
      external(),
      resolve(),
      commonjs(),
      typescript({
        sourceMap: nodeEnv === 'production' ? false : 'inline',
      }),
      postcss(),
      terser(),
      babel({
        exclude: 'node_modules/**',
        babelHelpers: 'runtime',
        skipPreflightCheck: true,
      }),
      visualizer(),
    ],
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: nodeEnv === 'production' ? false : 'inline',
        interop: 'compat'
      }
    ],
    plugins: [
      external(),
      resolve(),
      commonjs(),
      typescript({
        sourcemap: nodeEnv === 'production' ? false : 'inline'
      }),
      postcss(),
      terser(),
      babel({
        exclude: 'node_modules/**',
        babelHelpers: 'runtime',
        skipPreflightCheck: true
      }),
      visualizer(),
    ]
  },
];
