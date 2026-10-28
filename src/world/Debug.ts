import type { World } from './World'

/** lil-gui tuning panel. Open with ?gui in the URL, or press "g". Lazy-loaded. */
export async function openDebug(world: World) {
  const { default: GUI } = await import('lil-gui')
  const gui = new GUI({ title: 'The Signal — tuning' })
  const t = world.tune

  const p = gui.addFolder('Particles')
  p.add(t, 'particleSize', 0.004, 0.04, 0.0005)
  p.add(t, 'intensity', 0.2, 2.5, 0.01)
  p.add(t, 'curlScale', 0.1, 1.2, 0.01)
  p.add(t, 'push', 0, 0.12, 0.001).name('fluid push')
  p.add(t, 'drag', 1, 8, 0.05)
  p.add(t, 'springHold', 1, 12, 0.1)

  const f = gui.addFolder('Fluid')
  const c = world.fluid.cfg
  f.add(c, 'curl', 0, 60, 1)
  f.add(c, 'velDissipation', 0, 2, 0.01)
  f.add(c, 'dyeDissipation', 0.2, 4, 0.01)
  f.add(c, 'force', 1000, 12000, 100)
  f.add(c, 'radius', 0.05, 0.6, 0.01)

  const l = gui.addFolder('Lens')
  l.add(t, 'chroma', 0, 3, 0.01)
  l.add(t, 'refract', 0, 3, 0.01)
  l.add(t, 'bloom', 0, 2.5, 0.01)
  l.add(world.post.noise.blendMode.opacity, 'value', 0, 0.6, 0.01).name('grain')
  l.add(world.post.vignette, 'darkness', 0, 1.2, 0.01)

  gui.add({ tier: world.quality.tier }, 'tier', 0, 3, 1).onChange((v: number) => world.setTier(v))
  return gui
}
