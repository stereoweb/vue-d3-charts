import fs from 'fs';
import path from 'path';
import { defineConfig } from 'rollup';
import vue from '@vitejs/plugin-vue';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-minification';
import minimist from 'minimist';

const esbrowserslist = fs.readFileSync('./.browserslistrc')
  .toString()
  .split('\n')
  .filter((entry) => entry && entry.substring(0, 2) !== 'ie');

const argv = minimist(process.argv.slice(2));

const projectRoot = path.resolve(__dirname, '..');

const baseConfig = {
  input: 'src/entry.js',
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    alias({
      resolve: ['.js', '.jsx', '.ts', '.tsx', '.vue'],
      entries: {
        '@': path.resolve(projectRoot, 'src'),
      },
    }),
  ],
};

const external = ['vue'];

const globals = {
  vue: 'Vue',
};

const buildFormats = [];
if (!argv.format || argv.format === 'es') {
  const esConfig = defineConfig({
    ...baseConfig,
    external,
    output: {
      file: 'dist/vue-d3-charts.esm.js',
      format: 'es',
      exports: 'named',
    },
    plugins: [
      ...baseConfig.plugins,
      vue(),
      babel({
        exclude: 'node_modules/**',
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue'],
        presets: [
          [
            '@babel/preset-env',
            {
              targets: esbrowserslist,
            },
          ],
        ],
      }),
      commonjs(),
    ],
  });
  buildFormats.push(esConfig);
}

if (!argv.format || argv.format === 'cjs') {
  const umdConfig = defineConfig({
    ...baseConfig,
    external,
    output: {
      compact: true,
      file: 'dist/vue-d3-charts.ssr.js',
      format: 'cjs',
      name: 'VueD3Charts',
      exports: 'named',
      globals,
    },
    plugins: [
      ...baseConfig.plugins,
      vue({
        optimizeSSR: true,
      }),
      babel(baseConfig.plugins.babel),
      commonjs(),
    ],
  });
  buildFormats.push(umdConfig);
}

if (!argv.format || argv.format === 'iife') {
  const unpkgConfig = defineConfig({
    ...baseConfig,
    external,
    output: {
      compact: true,
      file: 'dist/vue-d3-charts.min.js',
      format: 'iife',
      name: 'VueD3Charts',
      exports: 'named',
      globals,
    },
    plugins: [
      ...baseConfig.plugins,
      vue(),
      babel(baseConfig.plugins.babel),
      commonjs(),
      terser({
        output: {
          ecma: 5,
        },
      }),
    ],
  });
  buildFormats.push(unpkgConfig);
}

export default buildFormats;
