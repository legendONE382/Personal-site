import { projects } from '../../data/studio'
import { createContact } from './contact'
import { createIgnition } from './ignition'
import { createProjectScene } from './project'
import { createStatement } from './statement'
import type { SceneModule } from './types'

/** Order matches SCENES in config.ts. Projects come straight from src/data/studio.ts. */
export function createScenes(): SceneModule[] {
  return [
    createIgnition(),
    createStatement(),
    ...projects.map((p, i) => createProjectScene(i + 2, p)),
    createContact(),
  ]
}
