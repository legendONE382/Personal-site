import { HASH, SNOISE } from './common'

export const COPY_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D tMap;
void main(){ gl_FragColor = texture2D(tMap, vUv); }`

/**
 * Velocity pass. Every particle is a spring toward its morph target, pushed
 * by curl noise and by the fluid under the cursor. Re-forming between shapes
 * is staggered per particle so the cloud sweeps instead of popping.
 */
export const VEL_FRAG = /* glsl */ `
precision highp sampler2DArray;
varying vec2 vUv;
uniform sampler2D tPos;
uniform sampler2D tVel;
uniform sampler2DArray uTargets;
uniform sampler2D uFluid;
uniform float uA;
uniform float uB;
uniform float uMix;
uniform float uTime;
uniform float uDt;
uniform float uSpring;
uniform float uCurl;
uniform float uCurlScale;
uniform float uDrag;
uniform float uPush;
uniform mat4 uViewProj;
uniform vec3 uGroupPos;
uniform vec3 uCamRight;
uniform vec3 uCamUp;
${SNOISE}
${HASH}
vec3 pot(vec3 p){
  return vec3(snoise(p), snoise(p + vec3(31.4, 17.1, 5.7)), snoise(p + vec3(11.9, 44.3, 23.2)));
}
vec3 curlN(vec3 p){
  float e = 0.12;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);
  vec3 px0 = pot(p - dx); vec3 px1 = pot(p + dx);
  vec3 py0 = pot(p - dy); vec3 py1 = pot(p + dy);
  vec3 pz0 = pot(p - dz); vec3 pz1 = pot(p + dz);
  return vec3(py1.z - py0.z - (pz1.y - pz0.y),
              pz1.x - pz0.x - (px1.z - px0.z),
              px1.y - px0.y - (py1.x - py0.x)) / (2.0 * e);
}
void main(){
  vec3 pos = texture2D(tPos, vUv).xyz;
  vec3 vel = texture2D(tVel, vUv).xyz;
  float r = hash12(vUv * 511.7);
  float m = smoothstep(r * 0.45, r * 0.45 + 0.55, uMix);
  vec3 tA = texture(uTargets, vec3(vUv, uA)).xyz;
  vec3 tB = texture(uTargets, vec3(vUv, uB)).xyz;
  vec3 target = mix(tA, tB, m);

  vec3 f = (target - pos) * uSpring;
  f += curlN(pos * uCurlScale + vec3(0.0, 0.0, uTime * 0.07)) * uCurl;

  // the cursor stirs the fluid; the fluid pushes the particles
  vec4 clip = uViewProj * vec4(pos + uGroupPos, 1.0);
  if (clip.w > 0.0) {
    vec2 suv = clip.xy / clip.w * 0.5 + 0.5;
    vec2 fv = texture2D(uFluid, suv).xy;
    f += (uCamRight * fv.x + uCamUp * fv.y) * uPush;
  }

  vel = vel * exp(-uDrag * uDt) + f * uDt;
  float sp = length(vel);
  if (sp > 14.0) vel *= 14.0 / sp;
  gl_FragColor = vec4(vel, 1.0);
}`

export const POS_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D tPos;
uniform sampler2D tVel;
uniform float uDt;
void main(){
  vec3 p = texture2D(tPos, vUv).xyz;
  vec3 v = texture2D(tVel, vUv).xyz;
  gl_FragColor = vec4(p + v * uDt, 1.0);
}`

export const POINTS_VERT = /* glsl */ `
precision highp sampler2DArray;
uniform sampler2D uPos;
uniform sampler2D uVel;
uniform sampler2DArray uColors;
uniform float uA;
uniform float uB;
uniform float uMix;
uniform float uSize;
uniform float uProjScale;
uniform float uHold;
uniform float uIntensity;
uniform vec3 uGroupPos;
attribute vec2 aRef;
attribute float aRand;
varying vec3 vColor;
varying float vAlpha;
${HASH}
void main(){
  vec3 p = texture2D(uPos, aRef).xyz;
  vec3 v = texture2D(uVel, aRef).xyz;
  float r = hash12(aRef * 511.7);
  float m = smoothstep(r * 0.45, r * 0.45 + 0.55, uMix);
  vec3 cA = texture(uColors, vec3(aRef, uA)).rgb;
  vec3 cB = texture(uColors, vec3(aRef, uB)).rgb;
  vec3 c = mix(cA, cB, m);
  float sp = length(v);
  vec4 mv = viewMatrix * vec4(p + uGroupPos, 1.0);
  gl_Position = projectionMatrix * mv;
  float s = uSize * (0.6 + 0.8 * aRand) * (1.0 + sp * 0.1) * uProjScale / max(-mv.z, 0.1);
  gl_PointSize = clamp(s, 1.0, 24.0);
  vColor = c * uIntensity * (1.0 + sp * 0.3);
  vAlpha = (0.55 + 0.45 * aRand) * mix(1.0, 0.15, uHold);
}`

export const POINTS_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.04, d);
  a *= a;
  gl_FragColor = vec4(vColor * a * vAlpha, a * vAlpha);
}`
