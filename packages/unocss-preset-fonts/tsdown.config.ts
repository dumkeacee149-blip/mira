import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    './src/index.ts',
  ],
  noExternal: [
    '@proj-mira/font-cjkfonts-allseto',
    '@proj-mira/font-departure-mono',
    '@proj-mira/font-xiaolai',
  ],
  dts: true,
  sourcemap: true,
})
