import { HASH } from './common'

/** The power grid under the journey: lines of light with current pulses travelling along them. */
export const FLOOR_VERT = /* glsl */ `
varying vec3 vW;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`

export const FLOOR_FRAG = /* glsl */ `
varying vec3 vW;
uniform float uTime;
uniform vec3 uCam;
uniform float uVelN;
${HASH}
float grid(vec2 p, float s){
  vec2 q = p / s;
  vec2 g = abs(fract(q - 0.5) - 0.5) / max(fwidth(q), vec2(0.0001));
  return 1.0 - min(min(g.x, g.y), 1.0);
}
void main(){
  float d = distance(vW.xz, uCam.xz);
  float fade = exp(-d * 0.03);
  float g1 = grid(vW.xz, 2.0);
  float g2 = grid(vW.xz, 10.0);

  float lane = floor(vW.x / 2.0 + 0.5);
  float line = 1.0 - smoothstep(0.0, 0.07, abs(vW.x - lane * 2.0));
  float spd = 0.6 + hash11(lane + 7.0) * 1.0 + abs(uVelN) * 2.2;
  float ph = hash11(lane) * 6.2831;
  float pulse = line * pow(max(0.0, sin(vW.z * 0.11 + uTime * spd + ph)), 26.0) * 2.4;

  float lane2 = floor(vW.z / 10.0 + 0.5);
  float line2 = 1.0 - smoothstep(0.0, 0.09, abs(vW.z - lane2 * 10.0));
  float pulse2 = line2 * pow(max(0.0, sin(vW.x * 0.16 - uTime * (0.5 + hash11(lane2) * 0.7) + hash11(lane2 + 3.0) * 6.28)), 30.0) * 1.8;

  vec3 amber = vec3(1.0, 0.68, 0.22);
  vec3 col = amber * (g1 * 0.07 + g2 * 0.2) + amber * (pulse + pulse2);
  gl_FragColor = vec4(col * fade, 1.0);
}`

/** Dust that becomes speed-lines when you scroll fast. */
export const STREAK_VERT = /* glsl */ `
attribute float aEnd;
attribute float aSeed;
uniform float uVel;
uniform float uTime;
varying float vA;
varying float vSeed;
void main(){
  vec3 p = position;
  float len = 0.05 + 0.5 * aSeed;
  p.z += aEnd * (len + abs(uVel) * (6.0 + 22.0 * aSeed));
  p.y += sin(uTime * 0.2 + aSeed * 40.0) * 0.05;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float d = -mv.z;
  vA = (1.0 - smoothstep(12.0, 90.0, d)) * (0.2 + 0.8 * aSeed) * (1.0 - 0.35 * aEnd) * step(0.0, d);
  vSeed = aSeed;
  gl_Position = projectionMatrix * mv;
}`

export const STREAK_FRAG = /* glsl */ `
varying float vA;
varying float vSeed;
void main(){
  vec3 c = mix(vec3(0.94, 0.9, 0.82), vec3(1.0, 0.7, 0.24), step(0.55, vSeed));
  gl_FragColor = vec4(c * vA * 1.3, 1.0);
}`

export const PLANE_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`

/**
 * A real project screenshot. It resolves out of a coarse pixel grid behind a
 * dissolve front, is refracted by the fluid under the cursor, and splits into
 * colour channels when you scroll fast.
 */
export const IMAGE_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uMap;
uniform vec4 uCrop;
uniform sampler2D uVel;
uniform vec2 uRes;
uniform float uAspect;
uniform float uReveal;
uniform float uPresence;
uniform float uScrollVel;
uniform float uTime;
uniform float uLift;
${HASH}
vec3 tex(vec2 uv){ return texture2D(uMap, uCrop.xy + uv * uCrop.zw).rgb; }
void main(){
  vec2 suv = gl_FragCoord.xy / uRes;
  vec2 fv = texture2D(uVel, suv).xy;
  vec2 off = clamp(fv * 0.0002, vec2(-0.004), vec2(0.004));

  float grid = mix(14.0, 900.0, pow(uReveal, 2.2));
  vec2 cell = vec2(grid * uAspect, grid);
  vec2 puv = (floor(vUv * cell) + 0.5) / cell;
  vec2 uv = mix(puv, vUv, smoothstep(0.72, 1.0, uReveal)) + off;

  float ca = length(off) * 1.2 + abs(uScrollVel) * 0.0035;
  vec3 col = vec3(tex(uv + vec2(ca, 0.0)).r, tex(uv).g, tex(uv - vec2(ca, 0.0)).b);

  float n = hash12(floor(vUv * cell * 0.5));
  float front = uReveal * 1.3 - vUv.x * 0.5 - n * 0.35;
  float vis = smoothstep(0.0, 0.08, front);
  float edge = vis * (1.0 - smoothstep(0.08, 0.24, front));

  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  vec2 b = vec2(uAspect, 1.0) * 0.5;
  float r = 0.03;
  float dd = length(max(abs(p) - b + r, 0.0)) - r;
  float shape = 1.0 - smoothstep(-0.003, 0.002, dd);
  float rim = smoothstep(-0.014, -0.006, dd) * (1.0 - smoothstep(-0.004, 0.0, dd));

  vec3 amber = vec3(1.0, 0.68, 0.22);
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col *= mix(1.0, 0.78, smoothstep(0.55, 0.95, lum));
  col = col * (0.97 + uLift) + amber * edge * 1.5 + amber * rim * (0.35 + uLift) * uReveal;
  gl_FragColor = vec4(col, shape * vis * uPresence);
}`

/** Big display type rendered into the scene. Reveals line by line, bends with the fluid. */
export const TEXT_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uMap;
uniform sampler2D uVel;
uniform vec2 uRes;
uniform float uReveal;
uniform float uOpacity;
uniform float uScrollVel;
uniform float uLines;
uniform float uLineT;
uniform float uPadT;
void main(){
  vec2 suv = gl_FragCoord.xy / uRes;
  vec2 fv = texture2D(uVel, suv).xy;
  vec2 off = clamp(fv * 0.0003, vec2(-0.005), vec2(0.005));

  float lf = ((1.0 - vUv.y) - uPadT) / uLineT;
  float li = clamp(floor(lf), 0.0, uLines - 1.0);
  float lr = clamp(uReveal * (uLines + 0.9) - li * 0.85, 0.0, 1.0);
  float e = 1.0 - pow(1.0 - lr, 3.0);

  vec2 uv = vUv;
  uv.y += (1.0 - e) * 0.95 * uLineT;
  uv += off;

  float ca = length(off) * 1.4 + abs(uScrollVel) * 0.0035;
  vec4 r = texture2D(uMap, uv + vec2(ca, 0.0));
  vec4 g = texture2D(uMap, uv);
  vec4 b = texture2D(uMap, uv - vec2(ca, 0.0));
  float a = (r.a + g.a + b.a) / 3.0;
  gl_FragColor = vec4(r.r, g.g, b.b, a * e * uOpacity);
}`
