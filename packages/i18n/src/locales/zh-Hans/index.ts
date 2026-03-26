import base from './base.yaml'
import docs from './docs'
import settings from './settings.yaml'
import stageShowcase from './stage-showcase.yaml'
import stage from './stage.yaml'
import tamagotchi from './tamagotchi'

export default {
  base,
  docs,
  settings,
  stage: {
    ...stage,
    ...stageShowcase,
  },
  tamagotchi,
}
