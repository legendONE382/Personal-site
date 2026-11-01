/**
 * The final lens. One custom effect does the work that makes the whole
 * screen feel liquid:
 *   • refraction: the fluid velocity under the cursor bends every pixel
 *   • chromatic split driven by fluid speed AND scroll velocity
 *   • amber dye glow where the cursor has been
 *   • per-scene colour grade
 *   • the full-screen shader menu (a noisy radial wipe from the menu button,
 *     engraved with scanlines and a travelling rule)
 */
export const FLUID_GRADE_FRAG = /* glsl */ `
uniform sampler2D tVel;
uniform sampler2D tDye;
uniform float uTime;
uniform float uScroll;
uniform float uMenu;
uniform float uDim;
uniform float uAspect;
uniform float uChroma;
uniform float uRefract;
uniform float uFlash;
uniform vec3 uGrade;
uniform vec2 uMenuOrigin;
uniform float uStreak;
uniform vec2 uTexel;

float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

void mainUv(inout vec2 uv){
  vec2 v = texture2D(tVel, uv).xy;
  uv += clamp(v * 0.00022, vec2(-0.008), vec2(0.008)) * uRefract;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
  vec2 v = texture2D(tVel, uv).xy;
  float ca = (min(length(v) * 0.00005, 0.0035) + abs(uScroll) * 0.0035) * uChroma;
  vec2 dir = uv - 0.5;
  vec3 col = inputColor.rgb;
  col.r = texture2D(inputBuffer, uv + dir * ca * 2.0).r;
  col.b = texture2D(inputBuffer, uv - dir * ca * 2.0).b;

  vec3 dye = texture2D(tDye, uv).rgb;
  col += min(dye, vec3(1.2)) * 0.16;

  /* anamorphic horizontal smear on the hot parts of the image: a few taps in a
     pass we already run, instead of a separate bloom/glare pass */
  if (uStreak > 0.001) {
    vec2 so = vec2(uTexel.x * 7.0, 0.0);
    vec3 smear = vec3(0.0);
    for (int i = 1; i <= 3; i++) {
      float wi = 1.0 / float(i);
      vec2 o = so * float(i);
      vec3 a = texture2D(inputBuffer, uv + o).rgb;
      vec3 b = texture2D(inputBuffer, uv - o).rgb;
      float la = max(max(a.r, a.g), a.b) - 0.6;
      float lb = max(max(b.r, b.g), b.b) - 0.6;
      smear += (a * max(la, 0.0) + b * max(lb, 0.0)) * wi;
    }
    col += smear * uStreak * 0.3;
  }

  col *= uGrade;
  col += uFlash * vec3(1.0, 0.72, 0.38) * (1.0 - smoothstep(0.0, 0.9, length((uv - 0.5) * vec2(uAspect, 1.0)))) * 0.6;
  col *= 1.0 - uDim * 0.88;

  if (uMenu > 0.001) {
    vec2 p = (uv - uMenuOrigin) * vec2(uAspect, 1.0);
    float r = length(p);
    float n = h21(floor(uv * vec2(uAspect, 1.0) * 70.0)) * 0.07
            + sin(uv.y * 20.0 + uTime * 0.8) * 0.015
            + v.x * 0.00012;
    float rad = uMenu * 2.7;
    float mask = 1.0 - smoothstep(rad - 0.1, rad + 0.02, r + n);
    float edge = smoothstep(rad - 0.16, rad - 0.06, r + n) * mask;
    col = mix(col, col * 0.03 + vec3(0.012, 0.014, 0.02) + dye * 0.4, mask * 0.97);
    col += edge * vec3(1.0, 0.7, 0.24) * 0.5;
    // engraved scanlines: the menu reads as a surface, not an overlay
    col *= 1.0 - 0.07 * step(0.5, fract(gl_FragCoord.y * 0.5));
    col += smoothstep(0.9965, 1.0, sin(uv.y * 150.0 - uTime * 0.5)) * mask * vec3(1.0, 0.62, 0.16) * 0.14;
  }
  outputColor = vec4(col, inputColor.a);
}`
