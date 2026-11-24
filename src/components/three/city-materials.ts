import * as THREE from "three";

/*
  Shader patches for the hero's real Mumbai.
  City buildings stay MeshStandardMaterial (real light + shadows) and get:
   - a rise-from-the-ground intro (per-building delay from aSeed; instanced low-rise and merged towers)
   - real-looking facades: Mumbai concrete, stone, plaster palettes; glass curtain walls on towers that
     reflect the sky and catch the sun; storey-scale windows (3.2 m floors, 3.6 m bays) faded to their
     average with distance so they never shimmer; roofs coloured by the satellite pixel underneath;
     warm lit windows at night
  The ground is the Sentinel-2 satellite image, with an OSM land/water mask for a sea that reflects
  the sky with small moving waves and a sun glint, and roads that glow at night.
*/

export const cityUniforms = {
  uRise: { value: 0 },
  uNight: { value: 0 },
  uWarm: { value: new THREE.Color("#ffb46a") },
  uSea: { value: new THREE.Color("#c9d3da") },
  uGround: { value: null as THREE.Texture | null },
  /** x0, z0, 1/(x1-x0), 1/(z1-z0) of the ground textures */
  uGB: { value: new THREE.Vector4(-36.89, -60.66, 1 / 92.28, 1 / 103.79) },
  /** 0 until the ground texture has loaded, then fades to 1 */
  uGroundOn: { value: 0 },
  /** Sentinel-2 imagery (EOX s2cloudless 2024), same grid as uGround */
  uSat: { value: null as THREE.Texture | null },
  uSatOn: { value: 0 },
  /** the sky that glass and sea reflect, and the sun they glint with */
  uSkyTop: { value: new THREE.Color("#a9bbd4") },
  uSkyHor: { value: new THREE.Color("#f1efea") },
  uSunDir: { value: new THREE.Vector3(0.45, 0.8, 0.55).normalize() },
  uSunCol: { value: new THREE.Color("#fffaf2") },
  uTime: { value: 0 },
  /** metres -> model units vertically (VERT / 550) */
  uVert: { value: 1.4 / 550 },
};

const HASH = /* glsl */ `
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
`;

const SKY_FN = /* glsl */ `
uniform vec3 uSkyTop; uniform vec3 uSkyHor; uniform vec3 uSunDir; uniform vec3 uSunCol;
vec3 skyAt(vec3 r){
  vec3 c = mix(uSkyHor, uSkyTop, smoothstep(-0.05, 0.5, r.y));
  float s = max(dot(normalize(r), normalize(uSunDir)), 0.0);
  return c + uSunCol * (pow(s, 12.0) * 0.25 + pow(s, 400.0) * 3.0);
}
`;

type BuildingMode = "instanced" | "merged" | "single";

/**
 * "instanced" (low-rise boxes) and "merged" (tower footprints) get the real facades;
 * "single" stays the white Runwal hero material with the original window grid.
 */
export function makeBuildingMaterial(opts: { mode: BuildingMode; color?: string; seed?: number; windows?: [number, number] }) {
  const facade = opts.mode !== "single";
  const m = new THREE.MeshStandardMaterial({ color: opts.color ?? "#ffffff", roughness: facade ? 0.82 : 0.9, metalness: 0 });
  const rises = opts.mode !== "single";
  const defines: Record<string, string> = {};
  if (opts.mode === "merged") defines.MERGED = "";
  if (facade) defines.FACADE = "";
  m.defines = defines;
  const win = opts.windows ?? [40, 28];
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uRise = rises ? cityUniforms.uRise : { value: 1 };
    shader.uniforms.uNight = cityUniforms.uNight;
    shader.uniforms.uWarm = cityUniforms.uWarm;
    shader.uniforms.uSeed = { value: opts.seed ?? 0.5 };
    shader.uniforms.uWin = { value: new THREE.Vector2(win[0], win[1]) };
    shader.uniforms.uSat = cityUniforms.uSat;
    shader.uniforms.uSatOn = cityUniforms.uSatOn;
    shader.uniforms.uGB = cityUniforms.uGB;
    shader.uniforms.uSkyTop = cityUniforms.uSkyTop;
    shader.uniforms.uSkyHor = cityUniforms.uSkyHor;
    shader.uniforms.uSunDir = cityUniforms.uSunDir;
    shader.uniforms.uSunCol = cityUniforms.uSunCol;
    shader.uniforms.uVert = cityUniforms.uVert;
    shader.uniforms.uTime = cityUniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uRise; uniform float uVert;
varying vec3 vWP; varying vec3 vObjN; varying float vSeed; varying float vH;
#if defined(USE_INSTANCING) || defined(MERGED)
attribute float aSeed;
#else
uniform float uSeed;
#endif
#ifdef MERGED
attribute float aH;
#endif`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
#if defined(USE_INSTANCING) || defined(MERGED)
float seed = aSeed;
#else
float seed = uSeed;
#endif
vSeed = seed;
#if defined(MERGED)
vH = aH;
#elif defined(USE_INSTANCING)
vH = length(instanceMatrix[1].xyz) / uVert;
#else
vH = 150.0;
#endif
float rr = clamp(uRise * 1.7 - seed * 0.7, 0.0, 1.0);
rr = 1.0 - pow(1.0 - rr, 3.0);
transformed.y *= max(rr, 0.002);
vObjN = normal;`,
      )
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
vec4 wp4 = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
wp4 = instanceMatrix * wp4;
vObjN = mat3(instanceMatrix) * normal;
#endif
vWP = (modelMatrix * wp4).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uNight; uniform vec3 uWarm; uniform vec2 uWin; uniform float uVert; uniform float uTime;
uniform sampler2D uSat; uniform float uSatOn; uniform vec4 uGB;
varying vec3 vWP; varying vec3 vObjN; varying float vSeed; varying float vH;
${HASH}
${SKY_FN}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
vec3 on = normalize(vObjN);
float side = 1.0 - step(0.5, abs(on.y));
float uu = abs(on.x) > abs(on.z) ? vWP.z : vWP.x;
vec3 V = normalize(vWP - cameraPosition);
float fres = 0.04 + 0.96 * pow(1.0 - max(dot(-V, on), 0.0), 5.0);
vec3 refl = skyAt(reflect(V, on));
float glass = 0.0;
vec3 reflAdd = vec3(0.0);
#ifdef FACADE
  // Mumbai facades: weathered concrete, beige stone, off-white and ochre plaster, grey-blue paint
  float pk = h21(vec2(vSeed * 91.7, 3.1));
  vec3 base = pk < 0.24 ? vec3(0.62, 0.60, 0.57) : pk < 0.46 ? vec3(0.72, 0.65, 0.53) : pk < 0.7 ? vec3(0.82, 0.79, 0.73) : pk < 0.85 ? vec3(0.70, 0.58, 0.48) : vec3(0.58, 0.61, 0.64);
  base *= (0.86 + 0.22 * h21(vec2(vSeed * 13.3, 7.7))) * 0.72;
  glass = step(60.0, vH) * step(0.22, fract(vSeed * 7.13));
  vec3 glassBase = mix(vec3(0.20, 0.25, 0.30), vec3(0.28, 0.32, 0.30), fract(vSeed * 3.7));
  // roofs: the real roof colour from the satellite pixel underneath
  vec2 guv = vec2((vWP.x - uGB.x) * uGB.z, (vWP.z - uGB.y) * uGB.w);
  vec3 sat = texture2D(uSat, clamp(guv, 0.0005, 0.9995)).rgb;
  vec3 roof = mix(base * 0.9, sat * 1.15, 0.7 * uSatOn);
  vec3 wall = mix(base, glassBase, glass);
  diffuseColor.rgb = mix(roof, wall, side);
  // contact shade: walls darken toward the street (the satellite already carries ground shadows)
  diffuseColor.rgb *= mix(1.0, mix(0.5, 1.0, smoothstep(0.0, 9.0 * uVert, vWP.y)), side);
  vec2 cell = vec2(uu / (3.6 / 550.0), vWP.y / (3.2 * uVert));
#else
  vec2 cell = vec2(uu * uWin.x, vWP.y * uWin.y);
#endif
vec2 fw = fwidth(cell);
float aa = 1.0 - smoothstep(0.3, 0.85, max(fw.x, fw.y));
vec2 fc = fract(cell);
float winSharp = step(0.16, fc.x) * step(fc.x, 0.84) * step(0.3, fc.y) * step(fc.y, 0.8);
float win = mix(0.33, winSharp, aa) * side * step(0.012, vWP.y);
float hh = h21(floor(cell) + vSeed * 37.0);
#ifdef FACADE
  // glass: the whole wall reflects the sky (mullions a touch lighter); plaster: only the panes do
  float wallRefl = mix(win * 0.3, 1.0 - (1.0 - win) * 0.25, glass);
  diffuseColor.rgb *= 1.0 - win * mix(0.35, 0.55, uNight) * (1.0 - glass);
  reflAdd = refl * mix(0.06, 0.6, fres) * wallRefl * side * (1.0 - uNight * 0.85);
  float litChance = mix(0.66, 0.5, glass);
#else
  diffuseColor.rgb *= 1.0 - win * mix(0.06, 0.5, uNight);
  float litChance = 0.66;
#endif
float litSharp = winSharp * step(litChance, hh) * (0.25 + pow(hh, 3.0) * 1.6);
// from afar each building keeps its own average: a few blaze, most glow softly, some are dark
float bl = h21(vec2(vSeed * 17.0, 2.3));
float far = 0.03 + 0.5 * smoothstep(0.55, 1.0, bl) + 0.08 * step(0.3, bl);
float lit = mix(far, litSharp, aa) * side * step(0.012, vWP.y);
lit *= 0.8 + 0.2 * sin(uTime * (1.5 + hh * 2.0) + hh * 40.0);`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, 0.18, glass * side);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
totalEmissiveRadiance += uWarm * lit * uNight * 1.15 + reflAdd;`,
      );
  };
  return m;
}

/** Depth material that applies the same rise, so shadows grow with the buildings. */
export function makeRiseDepthMaterial() {
  const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uRise = cityUniforms.uRise;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uRise;
attribute float aSeed;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
float rr = clamp(uRise * 1.7 - aSeed * 0.7, 0.0, 1.0);
rr = 1.0 - pow(1.0 - rr, 3.0);
transformed.y *= max(rr, 0.002);`,
      );
  };
  return m;
}

/**
 * Ground: the satellite image as the land (the clay tint until it has loaded), the OSM land/water
 * mask for a sea that reflects the sky with small moving waves and a real sun glint, roads that
 * glow at night, and a faint warm haze over built-up land after dark.
 */
export function makeGroundMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: "#ebe8e2", roughness: 0.95, metalness: 0 });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = cityUniforms.uNight;
    shader.uniforms.uWarm = cityUniforms.uWarm;
    shader.uniforms.uSea = cityUniforms.uSea;
    shader.uniforms.uGround = cityUniforms.uGround;
    shader.uniforms.uGB = cityUniforms.uGB;
    shader.uniforms.uGroundOn = cityUniforms.uGroundOn;
    shader.uniforms.uSat = cityUniforms.uSat;
    shader.uniforms.uSatOn = cityUniforms.uSatOn;
    shader.uniforms.uSkyTop = cityUniforms.uSkyTop;
    shader.uniforms.uSkyHor = cityUniforms.uSkyHor;
    shader.uniforms.uSunDir = cityUniforms.uSunDir;
    shader.uniforms.uSunCol = cityUniforms.uSunCol;
    shader.uniforms.uTime = cityUniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>
varying vec3 vGP;`)
      .replace("#include <project_vertex>", `#include <project_vertex>
vGP = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uNight; uniform vec3 uWarm; uniform vec3 uSea; uniform float uTime;
uniform sampler2D uGround; uniform vec4 uGB; uniform float uGroundOn;
uniform sampler2D uSat; uniform float uSatOn;
varying vec3 vGP;
${SKY_FN}
float wv(vec2 p){ return sin(dot(p, vec2(0.83, 0.56))) + 0.6 * sin(dot(p, vec2(-0.42, 0.91)) * 1.73 + 1.3) + 0.35 * sin(dot(p, vec2(0.97, -0.24)) * 2.91 + 0.7); }`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
vec2 guv = vec2((vGP.x - uGB.x) * uGB.z, (vGP.z - uGB.y) * uGB.w);
vec3 gt = texture2D(uGround, clamp(guv, 0.0005, 0.9995)).rgb;
vec3 sat = texture2D(uSat, clamp(guv, 0.0005, 0.9995)).rgb;
float L = mix(1.0, smoothstep(0.3, 0.7, gt.r), uGroundOn);
float road = gt.g * uGroundOn;
float nat = gt.b * uGroundOn;
float shore = (1.0 - smoothstep(0.0, 0.45, abs(L - 0.5))) * uGroundOn;
float waterMask = 1.0 - L;
vec3 clay = diffuseColor.rgb;
clay *= 1.0 - road * 0.12 * L * (1.0 - uNight);
clay = mix(clay, vec3(0.80, 0.84, 0.76), nat * 0.38 * L);
float sl = dot(sat, vec3(0.2126, 0.7152, 0.0722));
vec3 satG = mix(vec3(sl), sat, 1.12);
// soften raw bare-soil orange (cleared sites) so it doesn't read as a flat patch
satG = mix(satG, vec3(sl) * vec3(1.06, 1.0, 0.92), smoothstep(0.06, 0.18, sat.r - sat.g) * 0.45);
// lift the deepest imagery shadows so dark canopy / shade never reads as a hole in the city
satG = max(satG, vec3(0.0)) * 0.9 + vec3(0.032, 0.03, 0.026) + vec3(0.05) * (1.0 - smoothstep(0.0, 0.06, sl));
vec3 land = mix(clay, satG * 0.95, uSatOn);
// the sea keeps the satellite's own water colour, slightly deepened
vec3 sea = mix(uSea, sat * vec3(0.78, 0.86, 0.92), uSatOn);
diffuseColor.rgb = mix(sea, land, L);
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.84, shore * 0.6 * (1.0 - uSatOn));
// small waves (water only)
vec2 wp = vGP.xz * 70.0;
vec2 drift = uTime * vec2(0.6, 0.35);
float w0 = wv(wp + drift);
float wx = wv(wp + vec2(1.4, 0.0) + drift);
float wz = wv(wp + vec2(0.0, 1.4) + drift);
// waves fade out with distance (no moire): the far sea becomes a calm mirror of the sky
float wfade = 1.0 - smoothstep(0.25, 0.9, length(fwidth(wp)));
vec3 waveN = normalize(vec3(-(wx - w0) * 0.32 * wfade, 1.0, -(wz - w0) * 0.32 * wfade));`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
normal = normalize(mix(normal, normalize((viewMatrix * vec4(waveN, 0.0)).xyz), waterMask * uSatOn));`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
roughnessFactor = mix(0.16, roughnessFactor, L);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
vec3 Vg = normalize(vGP - cameraPosition);
float fr = 0.03 + 0.97 * pow(1.0 - max(dot(-Vg, waveN), 0.0), 5.0);
totalEmissiveRadiance += skyAt(reflect(Vg, waveN)) * fr * waterMask * mix(0.85, 0.55, uNight) * uSatOn;
// night: navy water, moonlit land a touch lighter than the sea
totalEmissiveRadiance += vec3(0.010, 0.020, 0.045) * waterMask * uNight * uSatOn;
totalEmissiveRadiance += satG * 0.045 * L * uNight * uSatOn;
totalEmissiveRadiance += uWarm * pow(road, 1.8) * uNight * 0.32;
totalEmissiveRadiance += uWarm * L * uNight * uSatOn * 0.05 * smoothstep(0.25, 0.6, dot(sat, vec3(0.33)));
totalEmissiveRadiance += vec3(0.95, 0.65, 0.35) * shore * uNight * 0.12;`,
      );
  };
  return m;
}

export const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main(){
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const SKY_FRAG = /* glsl */ `
uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uGlow; uniform vec3 uSunDir;
uniform float uGlowAmt; uniform float uStars;
varying vec3 vDir;
${HASH}
void main(){
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = mix(uHorizon, uTop, smoothstep(-0.02, 0.55, h));
  float g = pow(max(dot(d, normalize(uSunDir)), 0.0), 6.0);
  col += uGlow * g * uGlowAmt;
  col += uGlow * pow(max(dot(d, normalize(uSunDir)), 0.0), 60.0) * uGlowAmt * 1.4;
  vec2 sp = floor(vec2(atan(d.z, d.x) * 320.0, h * 320.0));
  float s = step(0.9975, h21(sp)) * smoothstep(0.08, 0.45, h);
  col += vec3(s) * uStars * (0.5 + 0.5 * h21(sp + 3.1));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/** The hero sky: Rayleigh-like gradient, horizon haze, Mie halo and a sun disc, stars at night. */
export const REAL_SKY_FRAG = /* glsl */ `
uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uGlow; uniform vec3 uSunDir; uniform vec3 uSunCol;
uniform float uGlowAmt; uniform float uStars; uniform float uHorizonGlow;
varying vec3 vDir;
${HASH}
void main(){
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = mix(uHorizon, uTop, pow(smoothstep(-0.03, 0.62, h), 0.7));
  col = mix(col, uHorizon * 1.04, exp(-max(h, 0.0) * 28.0) * 0.6);
  vec3 sd = normalize(uSunDir);
  float s = max(dot(d, sd), 0.0);
  col += uGlow * (pow(s, 5.0) * 0.45 + pow(s, 40.0) * 0.6) * uGlowAmt;
  col += uSunCol * smoothstep(0.9996, 0.99985, s) * (1.0 - uStars) * 2.5;
  col = mix(col, uHorizon * 0.92, smoothstep(0.0, -0.08, h));
  // finale: a thin last-light line on the horizon
  col += vec3(0.95, 0.55, 0.30) * exp(-abs(h - 0.004) * 110.0) * uHorizonGlow * 0.55;
  vec2 sp = floor(vec2(atan(d.z, d.x) * 320.0, h * 320.0));
  float st = step(0.9975, h21(sp)) * smoothstep(0.08, 0.45, h);
  col += vec3(st) * uStars * (0.5 + 0.5 * h21(sp + 3.1));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export const BEAM_VERT = /* glsl */ `
varying float vY;
void main(){
  vY = uv.y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const BEAM_FRAG = /* glsl */ `
uniform vec3 uColor; uniform float uAmt;
varying float vY;
void main(){
  float a = pow(1.0 - vY, 2.2) * uAmt;
  gl_FragColor = vec4(uColor * a, a);
}
`;
