/**
 * Scene names only — plain data with no three.js import, so the HTML layer
 * (HUD, menu, panels) can use it without pulling the engine onto the
 * critical path. The geometry for each scene lives in world/config.ts.
 */
export const SCENES = [
  { id: 'ignition', label: 'Ignition' },
  { id: 'statement', label: 'Signal' },
  { id: 'lumora', label: 'Lumora AI' },
  { id: 'tradepulse', label: 'TradePulse' },
  { id: 'askdocs', label: 'AskDocs' },
  { id: 'voltwatch', label: 'VoltWatch AI' },
  { id: 'contact', label: 'Contact' },
] as const

export const N = SCENES.length
export type SceneId = (typeof SCENES)[number]['id']
