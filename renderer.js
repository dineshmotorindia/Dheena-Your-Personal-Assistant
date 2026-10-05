import * as THREE from "./vendor/three.module.js";
import { GLTFLoader } from "./vendor/GLTFLoader.js";
import * as K from "./knowledge.js";
const $ = s => document.querySelector(s);
const pa = window.pa || {};
console.log("[assistant] bridge functions:", Object.keys(pa).join(", ") || "NONE (preload.js did not load)");
const CW = 300, CH = 420;          // window canvas size
const POSE_FLIP_SIDES = false;     // set true if left and right arms/legs are swapped in emotes
const POSE_FLIP_FRONT = false;     // set true if forward and backward moves are reversed
const MODEL_FACING = 0;            // set to Math.PI if your model shows its back

/* ---------- 3D character: a stylized you ---------- */
const canvas = $("#c");
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(CW, CH, false);
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(35, CW / CH, .1, 50); cam.position.set(0, -.3, 8); cam.lookAt(0, -.3, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0xb8a58c, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 2); sun.position.set(2.5, 4, 6); scene.add(sun);
const M = (c, o) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, ...o });
const sph = r => new THREE.SphereGeometry(r, 32, 24);
const mk = (g, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); return o; };
// Edit these hex colors to restyle him.
const C = { skin: 0xC8915F, skin2: 0xB57F4E, hair: 0x2B1D17, teal: 0x2E9AA3, tealDk: 0x25848C, orange: 0xE3902F, maroon: 0x8E3030, cream: 0xF0E2C4, yellow: 0xE4B42E, gold: 0xD9A441, brown: 0x5A3A22 };
const pet = new THREE.Group(); scene.add(pet);

/* body: yellow polo, open patterned shirt, neck, chain */
pet.add(mk(sph(1), M(C.yellow), 0, -2.15, 0, 1.4, 1.15, .82));
pet.add(mk(new THREE.CylinderGeometry(.3, .34, .6, 20), M(C.skin), 0, -1.05, 0));
const patch = (cx, cy, cz, ax, ay, az, lx, ly, r, col, rot) => {
  const z = cz + az * Math.sqrt(Math.max(0, 1 - (lx / ax) ** 2 - (ly / ay) ** 2));
  const p = mk(sph(r), M(col), cx + lx, cy + ly, z + .01, 1, .8, .25); p.rotation.z = rot; pet.add(p);
};
[-1, 1].forEach(s => {
  const cx = s * .95, cy = -2.15, cz = .04, ax = .6, ay = 1.12, az = .86;
  pet.add(mk(sph(1), M(C.teal), cx, cy, cz, ax, ay, az));
  [[.1, .55, .13, C.orange, .4], [-.15, .1, .15, C.maroon, -.3], [.12, -.35, .14, C.cream, .2], [-.1, -.8, .13, C.orange, 0], [.2, .2, .09, C.cream, .6]]
    .forEach(([lx, ly, r, c, rot]) => patch(cx, cy, cz, ax, ay, az, lx * s, ly, r, c, rot));
  const col = mk(sph(.22), M(C.tealDk), s * .36, -1.22, .55, 1.4, .4, .7); col.rotation.z = -s * .5; pet.add(col);
});
const chain = mk(new THREE.TorusGeometry(.36, .018, 8, 32), M(C.gold, { metalness: .7, roughness: .3 }), 0, -1.2, .35); chain.rotation.x = Math.PI / 2 + .5; pet.add(chain);

/* arms: right arm waves and wears the watch */
const arm = s => {
  const g = new THREE.Group(); g.position.set(s * 1.38, -1.5, 0);
  g.add(mk(sph(.3), M(C.teal)));
  g.add(mk(new THREE.CylinderGeometry(.27, .24, .8, 20), M(C.teal), 0, -.4, 0));
  g.add(mk(new THREE.CylinderGeometry(.255, .255, .16, 20), M(C.cream), 0, -.82, 0));
  g.add(mk(new THREE.CylinderGeometry(.17, .15, .4, 16), M(C.skin), 0, -1.05, 0));
  g.add(mk(sph(.2), M(C.skin), 0, -1.3, 0, 1, 1.15, .8));
  pet.add(g); return g;
};
const lArm = arm(-1); lArm.rotation.z = -.1;
const rArm = arm(1); rArm.rotation.z = .12;
const strap = mk(new THREE.TorusGeometry(.17, .045, 10, 24), M(C.brown), 0, -1.12, 0); strap.rotation.x = Math.PI / 2; rArm.add(strap);
rArm.add(mk(sph(.1), M(C.gold, { metalness: .6, roughness: .3 }), 0, -1.12, .17, 1, 1, .5));

/* head */
const head = new THREE.Group(); head.position.set(0, .2, 0); pet.add(head);
const hm = (g, m, x, y, z, sx, sy, sz) => { const o = mk(g, m, x, y, z, sx, sy, sz); head.add(o); return o; };
hm(sph(1), M(C.skin, { roughness: .5 }), 0, 0, 0, .95, 1.05, .95);                       // face
[-1, 1].forEach(s => hm(sph(.18), M(C.skin), s * .93, 0, -.05, .5, 1, .8));               // ears
hm(sph(.13), M(C.skin2), 0, -.12, .93, .9, 1.1, .9);                                      // nose
const eyes = [], pupils = [];
[-1, 1].forEach(s => {
  const e = new THREE.Group(); e.position.set(s * .36, .1, .84);
  e.add(mk(sph(.17), M(0xffffff, { roughness: .2 }), 0, 0, 0, 1, 1.1, .5));
  const p = mk(sph(.095), M(0x2B1A12, { roughness: .15 }), 0, 0, .07, 1, 1.1, .5);
  p.add(mk(sph(.035), new THREE.MeshBasicMaterial({ color: 0xffffff }), .035, .045, .1));
  e.add(p); head.add(e); eyes.push(e); pupils.push(p);
  const b = hm(sph(.2), M(C.hair), s * .36, .36, .82, 1, .22, .3); b.rotation.z = s * .12; // brows
});
const hairM = M(C.hair, { roughness: .9, side: THREE.DoubleSide });
const beardM = M(0x24170F, { roughness: .95, side: THREE.DoubleSide });
const shell = (r, m, ps, pl, ts, tl) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28, ps, pl, ts, tl), m); o.scale.set(.95, 1.05, .95); head.add(o); };
shell(1.06, hairM, 0, Math.PI * 2, 0, .85);                              // hair cap
shell(1.06, hairM, Math.PI / 2 + 1.05, Math.PI * 2 - 2.1, 0, 1.62);      // sides and back
shell(1.03, beardM, Math.PI / 2 - 1.3, 2.6, 1.85, Math.PI - 1.85);       // beard
[[.27, .55], [Math.PI - .82, .55]].forEach(([ps, pl]) => shell(1.03, beardM, ps, pl, 1.35, .6)); // sideburns
const lock = (x, y, z, r, sx, sy, sz, rot) => { const o = hm(sph(r), hairM, x, y, z, sx, sy, sz); o.rotation.z = rot; };
lock(0, 1.12, .25, .55, 1, .6, .9, 0); lock(.38, 1.05, .05, .5, .8, .6, .8, -.3);
lock(-.35, 1, .15, .45, .8, .6, .9, .3); lock(.6, .75, .45, .28, 1.2, .5, .6, -.5);
hm(sph(.18), beardM, 0, -.3, .9, 1.5, .3, .5);                                              // moustache
const smile = hm(new THREE.TorusGeometry(.11, .035, 8, 20, Math.PI), M(0xF5ECE4, { roughness: .4 }), 0, -.36, .9, 1, 1, 1); smile.rotation.z = Math.PI;

let glb = null, talkUntil = 0, emo = null;
let look = { x: 0, y: 0 }, nextBlink = 2, blinkAt = -1, waveUntil = 0, jumpUntil = 0;
const clock = { getElapsedTime: () => performance.now() / 1000 };
(function frame() {
  const t = clock.getElapsedTime();
  let y = Math.sin(t * 1.6) * .04;
  const j = jumpUntil - t; if (j > 0) y += Math.abs(Math.sin(j * 9)) * .3 * Math.min(1, j);
  pet.position.y = y;
  head.rotation.y += (look.x * .5 - head.rotation.y) * .08;
  head.rotation.x += (-look.y * .2 - head.rotation.x) * .08;
  pet.rotation.y += (look.x * .12 - pet.rotation.y) * .05;
  if (t > nextBlink) { blinkAt = t; nextBlink = t + 2.5 + Math.random() * 3; }
  const sy = t - blinkAt < .14 ? .1 : 1;
  eyes.forEach(e => e.scale.y += (sy - e.scale.y) * .5);
  pupils.forEach(p => p.position.set(look.x * .05, look.y * .04, .07));
  const target = t < waveUntil ? 2.9 + Math.sin(t * 12) * .25 : .12;
  rArm.rotation.z += (target - rArm.rotation.z) * .15;
  if (glb) glb.update(t);
  renderer.render(scene, cam); requestAnimationFrame(frame);
})();

/* ---------- emotes: procedural poses (angles in radians, world axes) ---------- */
const mix = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
// A("lArm", x, y, z) points a limb toward a direction: x = outward (mirrored for right side), y = up, z = toward the viewer.
const EM = {
  wave:  [3, (t, P, o, A) => { const w = Math.sin(t * 9); A("rArm", .75, .55, .1); A("rFore", .25 + w * .5, 1, .15); P("chest", 0, -.08, 0); P("head", 0, .1, 0); }],
  dance: [8, (t, P, o, A) => {                       // kuthu-style: wide bent-knee stance, bounce, one arm up and one down, switching
    const b = t * 5.2, s = Math.sin(b), a = Math.sin(b / 2), ua = (1 + a) / 2, ub = 1 - ua, L = Math.max(0, s), R = Math.max(0, -s), pump = Math.sin(b * 2) * .15;
    o.y = -.17 + Math.abs(s) * .07; o.x = a * .1;
    A("lUp", ...mix([.4, -.9, .15], [.35, -.7, .55], L)); A("rUp", ...mix([.4, -.9, .15], [.35, -.7, .55], R));
    A("lLeg", ...mix([.1, -.85, -.35], [.1, -.6, -.75], L)); A("rLeg", ...mix([.1, -.85, -.35], [.1, -.6, -.75], R));
    A("lArm", ...mix([.35, -.7, .45], [.3, .95 + pump, .1], ua)); A("lFore", ...mix([.1, -.3, .95], [.4, 1, 0], ua));
    A("rArm", ...mix([.35, -.7, .45], [.3, .95 + pump, .1], ub)); A("rFore", ...mix([.1, -.3, .95], [.4, 1, 0], ub));
    P("spine", .1 + s * .05, 0, -a * .1); P("chest", 0, a * .15, 0); P("head", 0, -a * .1, a * .08); }],
  jump:  [2.4, (t, P, o, A) => { const p = (t * 1.5) % 1, h = 4 * p * (1 - p), c = p < .2 ? 1 - p / .2 : p > .85 ? (p - .85) / .15 : 0;
    o.y = h * .6 - .42 * c;
    const th = mix(mix([.12, -1, 0], [.15, -.6, .8], c), [.1, -.8, .55], h), sh = mix(mix([.05, -1, 0], [0, -.9, -.4], c), [0, -.6, -.8], h);
    A("lUp", ...th); A("rUp", ...th); A("lLeg", ...sh); A("rLeg", ...sh);
    const ar = mix(mix([.12, -1, 0], [.2, -.8, -.55], c), [.25, 1, .1], h), fo = mix(mix([.1, -1, .05], [.1, -.9, -.3], c), [.3, 1, 0], h);
    A("lArm", ...ar); A("rArm", ...ar); A("lFore", ...fo); A("rFore", ...fo); P("spine", .15 * c, 0, 0); }],
  skip:  [5, (t, P, o, A) => { const s = Math.sin(t * 7), a = Math.max(0, s), b = Math.max(0, -s), u = (1 + s) / 2; o.y = Math.abs(s) * .1;
    A("lUp", ...mix([.12, -1, 0], [.1, -.65, .75], a)); A("lLeg", ...mix([.05, -1, .05], [0, -.6, -.8], a));
    A("rUp", ...mix([.12, -1, 0], [.1, -.65, .75], b)); A("rLeg", ...mix([.05, -1, .05], [0, -.6, -.8], b));
    A("lArm", ...mix([.1, -.6, .7], [.15, -.9, -.4], u)); A("rArm", ...mix([.15, -.9, -.4], [.1, -.6, .7], u));
    A("lFore", .1, -.3, .95); A("rFore", .1, -.3, .95); P("spine", .1, 0, 0); P("chest", 0, -s * .15, 0); }],
  clap:  [3.2, (t, P, o, A) => { const u = (1 + Math.sin(t * 13)) / 2; o.y = Math.abs(Math.sin(t * 6.5)) * .03;
    A("lArm", .4, -.5, .75); A("rArm", .4, -.5, .75); A("lFore", ...mix([.55, .1, .8], [-.2, .1, 1], u)); A("rFore", ...mix([.55, .1, .8], [-.2, .1, 1], u)); P("head", .1, 0, 0); }],
  spin:  [1.6, (t, P, o, A) => { o.spin = (1 - Math.cos(Math.min(1, t / 1.4) * Math.PI)) * Math.PI; A("lArm", 1, .1, 0); A("rArm", 1, .1, 0); A("lFore", 1, .1, 0); A("rFore", 1, .1, 0); A("lUp", .25, -1, 0); A("rUp", .25, -1, 0); }],
  bow:   [2.6, (t, P, o, A) => { const b = Math.sin(Math.min(1, t / 2.6) * Math.PI); P("spine", b * .5, 0, 0); P("chest", b * .3, 0, 0); P("head", b * .15, 0, 0); A("rArm", .15, -.7, .6); A("rFore", -.8, .25, .6); }],
  flex:  [3.4, (t, P, o, A) => { const tr = Math.sin(t * 22) * .03; o.y = -.08;
    A("lArm", 1, .1, .1); A("rArm", 1, .1, .1); A("lFore", .1 + tr, 1, .05); A("rFore", .1 + tr, 1, .05);
    A("lUp", .4, -.9, 0); A("rUp", .4, -.9, 0); A("lLeg", .1, -.95, 0); A("rLeg", .1, -.95, 0); P("chest", -.08, Math.sin(t * 2) * .2, 0); P("head", 0, Math.sin(t * 2) * -.15, 0); }],
  cheer: [3.2, (t, P, o, A) => { const s = Math.abs(Math.sin(t * 5)), w = Math.sin(t * 10) * .15; o.y = s * .3;
    A("lArm", .45, .9, .05); A("rArm", .45, .9, .05); A("lFore", .4 + w, 1, 0); A("rFore", .4 + w, 1, 0);
    A("lUp", ...mix([.12, -1, 0], [.1, -.75, .5], s)); A("rUp", ...mix([.12, -1, 0], [.1, -.75, .5], s)); A("lLeg", ...mix([.05, -1, 0], [0, -.7, -.7], s)); A("rLeg", ...mix([.05, -1, 0], [0, -.7, -.7], s)); P("head", -.15, 0, 0); }],
};
const EMOSAY = { wave: "Hi hi! 👋", dance: "Let's dance! 💃", jump: "Wheee! 🦘", skip: "Skip skip! 🤸", clap: "👏👏👏", spin: "Wheee, spinning! 🌀", bow: "At your service. 🙇", flex: "Strong! 💪", cheer: "Hooray! 🎉" };
function playEmote(name) {
  const now = clock.getElapsedTime(); talkUntil = 0;
  if (glb) glb.play(name); else if (/jump|cheer/.test(name)) jumpUntil = now + 1.6; else waveUntil = now + 1.6;
}

/* ---------- real 3D model: put character.glb next to index.html ---------- */
const V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), Q1 = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), Q3 = new THREE.Quaternion(), EU = new THREE.Euler(), QO = new THREE.Quaternion();
function aimDown(model, b, c) {            // swing an arm bone so it points down (fixes T-pose models)
  model.updateMatrixWorld(true);
  b.getWorldPosition(V1); c.getWorldPosition(V2);
  const dir = V2.sub(V1).normalize(), tgt = new THREE.Vector3(Math.sign(dir.x || 1) * .18, -1, 0).normalize();
  Q1.setFromUnitVectors(dir, tgt);
  b.getWorldQuaternion(Q2); Q2.premultiply(Q1);
  b.parent.getWorldQuaternion(Q3);
  b.quaternion.copy(Q3.invert().multiply(Q2));
  model.updateMatrixWorld(true);
}
function useModel(gltf) {
  console.log("[assistant] character.glb loaded. animations:", (gltf.animations || []).map(a => a.name).join(", ") || "none");
  const model = gltf.scene; model.rotation.y = MODEL_FACING;
  model.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
  const clips = gltf.animations || [];
  const bones = []; model.traverse(o => { if (o.isBone) bones.push(o); });
  if (!clips.length) bones.filter(b => /arm/i.test(b.name) && !/fore|lower|hand|twist|armature|shoulder|clav|roll/i.test(b.name)).forEach(b => {
    const c = b.children.find(x => x.isBone); if (!c) return;
    aimDown(model, b, c); const g = c.children.find(x => x.isBone); if (g) aimDown(model, c, g);
  });
  pet.clear();                                   // remove the cartoon fallback
  const holder = new THREE.Group(); holder.add(model); pet.add(holder);
  let box = new THREE.Box3().setFromObject(model);
  model.scale.multiplyScalar(3.6 / box.getSize(new THREE.Vector3()).y);
  box.setFromObject(model);
  const ctr = box.getCenter(new THREE.Vector3());
  model.position.x -= ctr.x; model.position.z -= ctr.z; model.position.y -= box.min.y + 1.95;
  cam.fov = 28; cam.position.set(0, 0, 8); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
  box = new THREE.Box3().setFromObject(model); box.expandByVector(new THREE.Vector3(-.2, 0, 0));
  let head = null; model.traverse(o => { if (o.isBone && /head/i.test(o.name) && !/end|top|nub|brow|eye|jaw|hair/i.test(o.name) && !head) head = o; });
  const headQ0 = head ? head.quaternion.clone() : null;
  const mixer = new THREE.AnimationMixer(model);
  const find = re => clips.find(a => re.test(a.name));
  const idle = find(/idle|stand|breath/i) || clips[0], wave = find(/wave|hello|greet/i);
  const idleA = idle ? mixer.clipAction(idle).play() : null;
  const waveA = wave && wave !== idle ? mixer.clipAction(wave).setLoop(THREE.LoopOnce, 1) : null;
  mixer.addEventListener("finished", e => { if (e.action === waveA) { waveA.fadeOut(.25); idleA && idleA.reset().fadeIn(.25).play(); } });
  /* bones + procedural poses (used when the model has no animations of its own) */
  const side = n => /left|[_.:-]l([_.:-]|$)|^l[_.:-]/i.test(n) ? "l" : /right|[_.:-]r([_.:-]|$)|^r[_.:-]/i.test(n) ? "r" : "";
  const classify = n => {
    const s = n.toLowerCase(), d = side(n);
    if (/twist|roll|_end|nub|toe|foot|hand|finger|thumb|index|middle|ring|pinky|eye|jaw|hair|teeth|tongue|armature/.test(s)) return null;
    if (/hips|pelvis/.test(s)) return "hips";
    if (/head/.test(s)) return "head";
    if (/neck/.test(s)) return "neck";
    if (/spine|chest/.test(s)) return /spine2|chest|upper/.test(s) ? "chest" : "spine";
    if (!d || /shoulder|clav/.test(s)) return null;
    if (/fore|lowerarm/.test(s)) return d + "Fore";
    if (/arm/.test(s)) return d + "Arm";
    if (/upleg|upperleg|thigh/.test(s)) return d + "Up";
    if (/leg|calf|shin/.test(s)) return d + "Leg";
    return null;
  };
  const B = {}; model.traverse(o => { if (o.isBone) { const k = classify(o.name); if (k && !B[k]) B[k] = o; } });
  model.updateMatrixWorld(true);
  const chainQ = n => { const q = new THREE.Quaternion(); for (; n && n !== model; n = n.parent) q.premultiply(n.quaternion); return q; };
  const mp = b => model.worldToLocal(b.getWorldPosition(new THREE.Vector3()));
  const depth = b => { let d = 0; for (let n = b.parent; n && n !== model; n = n.parent) d++; return d; };
  const rest = Object.entries(B).map(([key, b]) => { const c = b.children.find(x => x.isBone);
    return { key, b, q: b.quaternion.clone(), pq: chainQ(b.parent), dir: c ? mp(c).sub(mp(b)).normalize() : null, anc: null }; }).sort((x, y) => depth(x.b) - depth(y.b));
  rest.forEach(r => { for (let n = r.b.parent; n && n !== model; n = n.parent) { if (rest.some(x => x.b === n)) { r.anc = n; break; } } });
  let swap = B.lArm && B.rArm ? mp(B.lArm).x < mp(B.rArm).x : false;     // 'left' bone on the screen-left? then swap sides
  if (POSE_FLIP_SIDES) swap = !swap;
  if (swap) rest.forEach(r => { if (/^[lr](Arm|Fore|Up|Leg)$/.test(r.key)) r.key = (r.key[0] === "l" ? "r" : "l") + r.key.slice(1); });
  console.log("[assistant] sides swapped:", swap);
  const QT = new THREE.Quaternion(), QR = new THREE.Quaternion(), QD = new THREE.Quaternion(), IDQ = new THREE.Quaternion(), TV = new THREE.Vector3();
  const morphs = [];
  model.traverse(o => { if (o.isMesh && o.morphTargetDictionary) { const k = Object.keys(o.morphTargetDictionary).find(n => /^(jawopen|mouthopen|viseme_aa|v_aa)$/i.test(n)); if (k) morphs.push([o, o.morphTargetDictionary[k]]); } });
  console.log("[assistant] bones found:", rest.map(r => r.key).join(" ") || "none", "| mouth shapes:", morphs.length);
  let last = 0, seenWave = 0, lx = 0, ly = 0, mouth = 0, tw = 0;
  glb = { box, play(name) { emo = { name, t0: last }; }, update(t) {
    const dt = Math.min(.1, Math.max(0, t - last)); last = t;
    const talking = t < talkUntil;
    mixer.update(dt);
    lx += (look.x - lx) * .1; ly += (look.y - ly) * .1;
    if (clips.length) {                                   // the model brings its own animations
      if (waveA && waveUntil !== seenWave) { seenWave = waveUntil; waveA.reset().fadeIn(.2).play(); idleA && idleA.fadeOut(.2); }
      if (head) head.quaternion.multiply(QR.setFromEuler(EU.set(-ly * .2, lx * .45, 0)));
    } else {
      const p = {}, aim = {}, o = { x: 0, y: 0, spin: 0 };
      let W = 1; const fr = POSE_FLIP_FRONT ? -1 : 1;
      const P = (k, x, y, z) => { const a = p[k] || (p[k] = [0, 0, 0]); a[0] += x * W * fr; a[1] += y * W; a[2] += z * W; };
      const A = (k, x, y, z) => { aim[k] = { v: new THREE.Vector3(k[0] === "r" ? -x : x, y, z * fr), w: W }; };
      P("spine", Math.sin(t * 1.6) * .015, 0, 0); P("head", -ly * .2, lx * .45, 0);
      const E = emo && EM[emo.name];
      tw += ((talking && !E ? 1 : 0) - tw) * .12;
      if (E && t - emo.t0 < E[0]) { const et = t - emo.t0; W = Math.min(1, et / .3, (E[0] - et) / .3); E[1](et, P, o, A); }
      else { emo = null; if (tw > .01) { W = tw; P("head", Math.sin(t * 9) * .05, 0, 0); A("rArm", .3, -.75, .55); A("rFore", .1 + .2 * Math.sin(t * 3), -.15, .95); } }
      const delta = new Map();
      rest.forEach(r => {
        const pd = r.anc ? delta.get(r.anc) : IDQ, ai = aim[r.key];
        if (ai && r.dir) { TV.copy(r.dir).lerp(ai.v, ai.w).normalize(); QR.setFromUnitVectors(r.dir, TV); QD.copy(pd).invert().multiply(QR); }
        else if (p[r.key]) QD.setFromEuler(EU.set(p[r.key][0], p[r.key][1], p[r.key][2]));
        else QD.identity();
        delta.set(r.b, new THREE.Quaternion().copy(pd).multiply(QD));
        r.b.quaternion.copy(QT.copy(r.pq).invert().multiply(QD).multiply(r.pq).multiply(r.q));
      });
      pet.position.y += o.y; pet.position.x = o.x; holder.rotation.y = o.spin;
    }
    const target = talking ? .12 + .38 * Math.abs(Math.sin(t * 13)) * (.6 + .4 * Math.sin(t * 5.3)) : 0;
    mouth += (target - mouth) * .5; morphs.forEach(([m, i]) => m.morphTargetInfluences[i] = mouth);
  } };
}
if (pa.readModel) pa.readModel().then(buf => {
  if (!buf) return console.log("[assistant] no character.glb found, showing the cartoon");                              // no character.glb: keep the cartoon
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  new GLTFLoader().parse(ab, "", useModel, err => console.warn("Could not read character.glb", err));
});


/* ---------- mouse: drag, click, hover (clicks pass through empty space) ---------- */
const ray = new THREE.Raycaster(), mv = new THREE.Vector2();
const hit = e => { const r = canvas.getBoundingClientRect(); mv.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height * 2 - 1)); ray.setFromCamera(mv, cam); return glb ? ray.ray.intersectsBox(glb.box) : ray.intersectObject(pet, true).length > 0; };
const clamp = v => Math.max(-1, Math.min(1, v));
let drag = null, lastOver = null;
pa.ignore?.(true);
addEventListener("mousemove", e => {
  const r = canvas.getBoundingClientRect();
  look.x = clamp((e.clientX - r.left) / r.width * 2 - 1); look.y = clamp((r.top + r.height / 2 - e.clientY) / (r.height / 2));
  if (drag) { const dx = e.screenX - drag.x, dy = e.screenY - drag.y; drag.x = e.screenX; drag.y = e.screenY; drag.moved += Math.abs(dx) + Math.abs(dy); pa.move?.(dx, dy); return; }
  const over = hit(e) || !!e.target.closest("#bubble");
  if (over !== lastOver) { lastOver = over; pa.ignore?.(!over); }
});
addEventListener("mousedown", e => { if (e.button === 0 && hit(e)) drag = { x: e.screenX, y: e.screenY, moved: 0 }; });
addEventListener("mouseup", () => { if (drag && drag.moved < 5) { open ? setOpen(false) : (setOpen(true), say("How can I help?", { wave: false })); } drag = null; });
addEventListener("contextmenu", e => { e.preventDefault(); if (hit(e)) pa.menu?.(); });

/* ---------- speech bubble ---------- */
const bub = $("#bubble"), msg = $("#msg"), cmd = $("#cmd");
let open = false, hideT, idleT;
function say(t, { loud = false, wave = true } = {}) {
  msg.textContent = t; bub.classList.add("on");
  const now = clock.getElapsedTime();
  if (wave) { waveUntil = now + 1.2; talkUntil = now + Math.min(9, .5 + t.length * .055); }
  if (loud) jumpUntil = now + 1.6;
  if (loud || D.voice) { try { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(t.replace(/^⏰ /, ""))); } catch {} }
  clearTimeout(hideT);
  if (!open) hideT = setTimeout(() => bub.classList.remove("on"), Math.max(loud ? 15000 : 5000, t.length * 70));
}
function setOpen(v) {
  open = v; bub.classList.toggle("inp", v); clearTimeout(hideT);
  if (v) { bub.classList.add("on"); cmd.focus(); bump(); }
  else { cmd.blur(); hideT = setTimeout(() => bub.classList.remove("on"), 4000); }
}
function bump() { clearTimeout(idleT); idleT = setTimeout(() => setOpen(false), 20000); }
cmd.addEventListener("keydown", e => { if (e.key === "Enter") { run(cmd.value); cmd.value = ""; bump(); } if (e.key === "Escape") setOpen(false); });
cmd.addEventListener("input", bump);

/* ---------- assistant brain (no AI, works offline) ---------- */
let D = { tasks: [], notes: [], rem: [], city: null };
try { Object.assign(D, JSON.parse(localStorage.getItem("pa2") || "{}")); } catch {}
const save = () => { try { localStorage.setItem("pa2", JSON.stringify(D)); } catch {} };
const UN = { s: 1e3, sec: 1e3, second: 1e3, m: 6e4, min: 6e4, minute: 6e4, h: 36e5, hr: 36e5, hour: 36e5 };
const ms = (n, u) => n * (UN[u.toLowerCase().replace(/s$/, "")] || 6e4);
const T = "(seconds?|secs?|minutes?|mins?|hours?|hrs?|[smh])\\b";
function addRem(text, delay) {
  if (Notification.permission === "default") Notification.requestPermission();
  D.rem.push({ text, due: Date.now() + delay }); save();
}
const list = (a, empty) => a.length ? a.map((x, i) => `${i + 1}. ${x.text}`).join("\n") : empty;

async function weather(city) {
  city = city || D.city; if (!city) return say("Which city? Say: weather in Chennai");
  say("Checking " + city + "...", { wave: false });
  try {
    const g = await (await fetch("https://geocoding-api.open-meteo.com/v1/search?count=1&name=" + encodeURIComponent(city))).json();
    const p = g.results && g.results[0]; if (!p) return say("I couldn't find " + city + ".");
    const c = (await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&current=temperature_2m,weather_code,wind_speed_10m`)).json()).current;
    const k = c.weather_code, d = k === 0 ? "clear" : k < 4 ? "partly cloudy" : k < 50 ? "foggy" : k < 70 ? "rainy" : k < 80 ? "snowy" : k < 90 ? "showery" : "stormy";
    D.city = p.name; save(); say(`${p.name}: ${Math.round(c.temperature_2m)}°C, ${d}, wind ${Math.round(c.wind_speed_10m)} km/h.`);
  } catch { say("I couldn't reach the weather service. Check your internet."); }
}

async function wiki(topic) {
  say("Looking that up...", { wave: false });
  try {
    const s = await (await fetch("https://en.wikipedia.org/w/api.php?action=opensearch&limit=1&format=json&origin=*&search=" + encodeURIComponent(topic))).json();
    const title = s[1] && s[1][0]; if (!title) return say("I couldn't find that. Try: google " + topic);
    const r = await (await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title))).json();
    let t = (r.extract || "").split(". ").slice(0, 2).join(". "); if (t.length > 280) t = t.slice(0, 277) + "...";
    say((t || "No summary available.") + "\n(Source: Wikipedia)");
  } catch { say("I couldn't reach the internet. Check your connection."); }
}

function run(raw) {
  const q = raw.trim(); if (!q) return setOpen(false);
  const n = q.toLowerCase().replace(/[?!.]+$/, "").trim();
  let m;
  if (m = q.match(new RegExp("^(?:remind me|reminder)(?: to)?\\s+(.+?)\\s+in\\s+(\\d+)\\s*" + T, "i"))) { addRem(m[1], ms(+m[2], m[3])); say(`Okay! I'll remind you to ${m[1]} in ${m[2]} ${m[3]}.`); }
  else if (m = q.match(new RegExp("^(?:set (?:a )?)?timer(?: for)?\\s+(\\d+)\\s*" + T, "i"))) { addRem("Your timer is up!", ms(+m[1], m[2])); say(`Timer set for ${m[1]} ${m[2]}.`); }
  else if (m = q.match(/^(?:add )?(?:task|todo|to-do)\s+(.+)/i)) { D.tasks.unshift({ text: m[1] }); save(); say("Added task: " + m[1]); }
  else if (/^(show |my )?(tasks|todos?)$/i.test(n)) say(list(D.tasks, "No tasks. Say: add task buy milk"));
  else if (m = q.match(/^(?:done|finish(?:ed)?|complete)\s+(?:task\s+)?(\d+)/i)) { const t = D.tasks.splice(m[1] - 1, 1)[0]; save(); say(t ? "Nice! Done: " + t.text : "I can't find that task number."); }
  else if (m = q.match(/^(?:add )?(?:note|remember)\s+(.+)/i)) { D.notes.unshift({ text: m[1] }); save(); say("Note saved."); }
  else if (/^(show |my )?notes$/i.test(n)) say(list(D.notes, "No notes. Say: note wifi password 1234"));
  else if (/^clear notes$/i.test(n)) { D.notes = []; save(); say("Notes cleared."); }
  else if (/^(show |my )?(reminders|timers)$/i.test(n)) say(D.rem.length ? D.rem.map(r => `${Math.max(1, Math.round((r.due - Date.now()) / 60000))} min: ${r.text}`).join("\n") : "Nothing scheduled.");
  else if (m = n.match(/^(?:please |can you |could you |do a |do |let'?s |show me |play )?(wave|dance|jump|skip|clap|spin|bow|flex|cheer)(?: for me| again| now| please)?$/)) { playEmote(m[1]); say(EMOSAY[m[1]], { wave: false }); }
  else if (m = n.match(/^voice (on|off)$/)) { D.voice = m[1] === "on"; save(); say(D.voice ? "Voice is on. 🔊" : "Voice is off. 🔇"); }
  else if (/\d/.test(n) && /[+\-*/x×÷^%]/.test(n) && (m = n.match(/^(?:what is |what's |calculate |calc )?([\d\s+\-*/().%^x×÷]+)$/))) {
    try { const v = Function('"use strict";return (' + m[1].replace(/[x×]/g, "*").replace(/÷/g, "/").replace(/\^/g, "**") + ")")(); say(Number.isFinite(v) ? `${m[1].trim()} = ${+v.toFixed(6)}` : "That doesn't compute. 🤔"); } catch { say("I couldn't read that sum."); }
  }
  else if (/flip a coin|coin toss|toss a coin/.test(n)) say(Math.random() < .5 ? "Heads! 🪙" : "Tails! 🪙");
  else if (/roll (a )?(dice|die)/.test(n)) say("🎲 You rolled a " + (1 + Math.floor(Math.random() * 6)));
  else if (m = q.match(/^(?:google|search(?: google)?(?: for)?)\s+(.+)/i)) { pa.open?.("https://www.google.com/search?q=" + encodeURIComponent(m[1])); say("Opening Google for: " + m[1]); }
  else if (m = q.match(/weather(?: in (.+))?/i)) weather(m[1]);
  else if (/^(what('?s| is) )?(the )?time( now)?$/.test(n)) say(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
  else if (/^(what('?s| is) )?(the |today'?s )?(date|day)( today)?$/.test(n)) say(new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  else {
    const a = K.answer(n);
    if (a) say(a);
    else if (m = n.match(/^(?:who is|who was|what is|what are|what was|tell me about|define|explain)\s+(?:a |an |the )?(.+)/)) wiki(m[1]);
    else say("I don't know that yet. 🤔 Try \"google " + n.slice(0, 40) + "\" or say \"help\".");
  }
}

setInterval(() => {
  const n = Date.now(), due = D.rem.filter(r => r.due <= n); if (!due.length) return;
  D.rem = D.rem.filter(r => r.due > n); save();
  due.forEach(r => { say("⏰ " + r.text, { loud: true }); try { new Notification("Pocket Assistant", { body: r.text }); } catch {} });
}, 1000);

const EMO = [["👋", "wave"], ["💃", "dance"], ["🦘", "jump"], ["🤸", "skip"], ["👏", "clap"], ["🌀", "spin"], ["🙇", "bow"], ["💪", "flex"], ["🎉", "cheer"]];
const QUICK = [["Joke", "tell me a joke"], ["Weather", "weather"], ["Time", "time"], ["Fun fact", "fun fact"], ["Motivate", "motivate me"], ["Help", "help"]];
const mkBtn = (label, title, fn) => { const b = document.createElement("button"); b.textContent = label; b.title = title; b.onclick = () => { fn(); bump(); }; return b; };
EMO.forEach(([i, nme]) => $("#em").append(mkBtn(i, nme, () => playEmote(nme))));
QUICK.forEach(([l, qq]) => $("#qs").append(mkBtn(l, qq, () => run(qq))));
pa.on?.((kind, v) => kind === "emote" ? playEmote(v) : run(v));
say("Hi! I'm " + K.NAME + ". Click me, then type, or tap a button!");
