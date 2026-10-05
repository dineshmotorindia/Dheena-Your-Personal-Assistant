import * as THREE from "./vendor/three.module.js";
import { GLTFLoader } from "./vendor/GLTFLoader.js";
const $ = s => document.querySelector(s);
const pa = window.pa || {};
console.log("[assistant] bridge functions:", Object.keys(pa).join(", ") || "NONE (preload.js did not load)");
const CW = 300, CH = 420;          // window canvas size
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

let glb = null;
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
  let last = 0, seenWave = 0, lx = 0, ly = 0;
  glb = { box, update(t) {
    const dt = Math.min(.1, Math.max(0, t - last)); last = t;
    if (waveA && waveUntil !== seenWave) { seenWave = waveUntil; waveA.reset().fadeIn(.2).play(); idleA && idleA.fadeOut(.2); }
    mixer.update(dt);
    if (head) {
      if (!clips.length) head.quaternion.copy(headQ0);
      lx += (look.x - lx) * .1; ly += (look.y - ly) * .1;
      head.quaternion.multiply(QO.setFromEuler(EU.set(-ly * .2, lx * .45, 0)));
    }
    if (!clips.length) holder.position.y = Math.sin(t * 1.6) * .015;
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
  if (wave) waveUntil = now + 1.2;
  if (loud) { jumpUntil = now + 1.6; try { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(t.replace(/^⏰ /, ""))); } catch {} }
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

function run(raw) {
  const q = raw.trim(); if (!q) return setOpen(false);
  let m;
  if (m = q.match(new RegExp("^(?:remind me|reminder)(?: to)?\\s+(.+?)\\s+in\\s+(\\d+)\\s*" + T, "i"))) { addRem(m[1], ms(+m[2], m[3])); say(`Okay! I'll remind you to ${m[1]} in ${m[2]} ${m[3]}.`); }
  else if (m = q.match(new RegExp("^(?:set (?:a )?)?timer(?: for)?\\s+(\\d+)\\s*" + T, "i"))) { addRem("Your timer is up!", ms(+m[1], m[2])); say(`Timer set for ${m[1]} ${m[2]}.`); }
  else if (m = q.match(/^(?:add )?(?:task|todo|to-do)\s+(.+)/i)) { D.tasks.unshift({ text: m[1] }); save(); say("Added task: " + m[1]); }
  else if (/^(show |my )?(tasks|todos?)$/i.test(q)) say(list(D.tasks, "No tasks. Say: add task buy milk"));
  else if (m = q.match(/^(?:done|finish(?:ed)?|complete)\s+(?:task\s+)?(\d+)/i)) { const t = D.tasks.splice(m[1] - 1, 1)[0]; save(); say(t ? "Nice! Done: " + t.text : "I can't find that task number."); }
  else if (m = q.match(/^(?:add )?(?:note|remember)\s+(.+)/i)) { D.notes.unshift({ text: m[1] }); save(); say("Note saved."); }
  else if (/^(show |my )?notes$/i.test(q)) say(list(D.notes, "No notes. Say: note wifi password 1234"));
  else if (/^clear notes$/i.test(q)) { D.notes = []; save(); say("Notes cleared."); }
  else if (/^(show |my )?(reminders|timers)$/i.test(q)) say(D.rem.length ? D.rem.map(r => `${Math.max(1, Math.round((r.due - Date.now()) / 60000))} min: ${r.text}`).join("\n") : "Nothing scheduled.");
  else if (m = q.match(/weather(?: in (.+))?/i)) weather(m[1]);
  else if (/^(what )?time/i.test(q)) say(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
  else if (/date|day/i.test(q)) say(new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" }));
  else if (/^(hi|hello|hey)\b/i.test(q)) say("Hello! ✨");
  else say("Try: remind me to ... in 10 minutes, add task ..., show tasks, note ..., timer 5 minutes, weather in Chennai");
}

setInterval(() => {
  const n = Date.now(), due = D.rem.filter(r => r.due <= n); if (!due.length) return;
  D.rem = D.rem.filter(r => r.due > n); save();
  due.forEach(r => { say("⏰ " + r.text, { loud: true }); try { new Notification("Pocket Assistant", { body: r.text }); } catch {} });
}, 1000);

say("Hi! I'm your assistant. Click me and tell me what you need.");
