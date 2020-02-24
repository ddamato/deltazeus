import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const config = {
  external: ['aws-sdk'],
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    commonjs(),
    terser(),
  ],
  output: {
    dir: 'functions/',
    format: 'cjs'
  }
}

const files = ['api/cron.js', 'api/forecast.js', 'api/rss.js'];

export default files.map((input) => Object.assign(config, {input}));