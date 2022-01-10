import { uglify } from "rollup-plugin-uglify"

export default [
  {
    input: './src/esm/index.js',
    output: [
      { format: 'es', file: './dist/index.js' },
    ],
    plugins: [uglify()]
  }
]
