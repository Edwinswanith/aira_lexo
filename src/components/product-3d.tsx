"use client";

import { X } from "@phosphor-icons/react";
import { type ReactNode, useEffect, useRef, useState } from "react";

export type Feature3D = { id: "button" | "usb" | "pinhole" | "slot"; title: string; text: string; extra?: ReactNode };

/** Views (yaw, pitch in radians) that put each feature in front of the camera. */
const FEATURE_VIEWS: Record<Feature3D["id"], [number, number]> = {
  button: [0, 0.95],
  usb: [-0.35, 0.28],
  pinhole: [0.45, 0.9],
  slot: [-1.25, 0.32],
};

/**
 * An interactive 3D model of the Aira recorder, built to the real device's proportions.
 * Moving the cursor turns it all the way round; hovering the centre button holds the view
 * and shows that it can be pressed; clicking toggles the amber ready light.
 * Touch: drag to turn, tap the button to toggle.
 */
export function Product3D({ features, label }: { features: Feature3D[]; label: string }) {
  const mount = useRef<HTMLDivElement>(null);
  const api = useRef<{ setLit: (on: boolean) => void; goTo: (view: [number, number]) => void; nudge: (dYaw: number) => void } | null>(null);
  const [lit, setLit] = useState(false);
  const [hoverButton, setHoverButton] = useState(false);
  const [failed, setFailed] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const [active, setActive] = useState<Feature3D["id"] | null>(null);
  const litRef = useRef(false);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (disposed) return;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      } catch {
        setFailed(true);
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      host.appendChild(renderer.domElement);
      renderer.domElement.style.touchAction = "pan-y";

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 0.45;

      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
      camera.position.set(0, 0, 6.2);

      const key = new THREE.DirectionalLight(0xfff4e6, 1.6);
      key.position.set(-3, 5, 4);
      scene.add(key, new THREE.AmbientLight(0xffffff, 0.25));

      // ---------- textures ----------
      const canvasTexture = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        draw(canvas.getContext("2d")!);
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        return texture;
      };
      // Pebbled, leather-like grain on the top plate.
      const pebble = canvasTexture(512, 512, (c) => {
        c.fillStyle = "#808080";
        c.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 9000; i += 1) {
          const v = 90 + Math.floor(Math.random() * 120);
          c.fillStyle = `rgb(${v},${v},${v})`;
          c.beginPath();
          c.ellipse(Math.random() * 512, Math.random() * 512, 1.5 + Math.random() * 3.5, 1.2 + Math.random() * 2.8, Math.random() * 3, 0, Math.PI * 2);
          c.fill();
        }
      });
      pebble.repeat.set(2.6, 2.6);
      // Fine horizontal 3D-printing layer lines on the sides.
      const layers = canvasTexture(8, 64, (c) => {
        for (let y = 0; y < 64; y += 1) {
          const v = y % 4 < 2 ? 150 : 95;
          c.fillStyle = `rgb(${v},${v},${v})`;
          c.fillRect(0, y, 8, 1);
        }
      });
      layers.repeat.set(1, 3.2);

      // ---------- geometry (units: device length = 2.1) ----------
      const L = 2.1, W = 1.0, H = 0.38, R = W / 2;
      const stadium = (len: number, wid: number) => {
        const r = wid / 2, s = new THREE.Shape();
        s.moveTo(-len / 2 + r, -r);
        s.lineTo(len / 2 - r, -r);
        s.absarc(len / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
        s.lineTo(-len / 2 + r, r);
        s.absarc(-len / 2 + r, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);
        return s;
      };
      const black = (extra: Partial<ConstructorParameters<typeof THREE.MeshStandardMaterial>[0]> = {}) =>
        new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.86, metalness: 0, ...extra });

      const device = new THREE.Group();
      const model = new THREE.Group();
      model.add(device);
      scene.add(model);

      // Body: extruded upward, rounded edges, layer lines on the sides.
      const bodyGeo = new THREE.ExtrudeGeometry(stadium(L - 0.08, W - 0.08), { depth: H - 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 6, curveSegments: 48 });
      bodyGeo.rotateX(-Math.PI / 2);
      bodyGeo.translate(0, -H / 2 + 0.05, 0);
      const body = new THREE.Mesh(bodyGeo, [black({ roughness: 0.9 }), black({ bumpMap: layers, bumpScale: 2.5, roughness: 0.8 })]);
      device.add(body);

      // Top plate: slightly inset with a visible seam, pebbled grain.
      const plateGeo = new THREE.ExtrudeGeometry(stadium(L - 0.13, W - 0.13), { depth: 0.035, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3, curveSegments: 48 });
      plateGeo.rotateX(-Math.PI / 2);
      plateGeo.translate(0, H / 2 + 0.005, 0);
      const plateTop = black({ bumpMap: pebble, bumpScale: 5, roughness: 0.92, color: 0x0d0d0d });
      const plate = new THREE.Mesh(plateGeo, [plateTop, black({ color: 0x0e0e0e })]);
      device.add(plate);
      const topY = H / 2 + 0.06;

      // Centre button: off-white ring with a raised off-white cap. The ring carries the amber LED.
      const ringMat = new THREE.MeshStandardMaterial({ color: 0xe9e5dc, roughness: 0.45, emissive: 0xffa21f, emissiveIntensity: 0 });
      const capMat = new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.4, emissive: 0xffc35a, emissiveIntensity: 0 });
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 64), ringMat);
      ring.position.y = topY;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.11, 0.07, 48), capMat);
      cap.position.y = topY + 0.03;
      const capRim = new THREE.Mesh(new THREE.TorusGeometry(0.106, 0.008, 8, 48), new THREE.MeshStandardMaterial({ color: 0x9a968e, roughness: 0.6 }));
      capRim.rotation.x = Math.PI / 2;
      capRim.position.y = topY + 0.017;
      const button = new THREE.Group();
      button.add(ring, cap, capRim);
      device.add(button);

      // Amber halo and light that appear when the LED is on.
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: canvasTexture(256, 256, (c) => {
          const g = c.createRadialGradient(128, 128, 12, 128, 128, 112);
          g.addColorStop(0, "rgba(255,170,50,0.9)");
          g.addColorStop(0.35, "rgba(255,160,40,0.55)");
          g.addColorStop(1, "rgba(255,140,20,0)");
          c.fillStyle = g;
          c.fillRect(0, 0, 256, 256);
        }),
        transparent: true, depthWrite: false, depthTest: false, toneMapped: false, blending: THREE.AdditiveBlending, opacity: 0,
      }));
      halo.position.y = topY + 0.05;
      halo.scale.set(0.7, 0.7, 1);
      const glow = new THREE.PointLight(0xffa830, 0, 0.9, 2);
      glow.position.y = topY + 0.12;
      device.add(halo, glow);

      // Hover cue: a thin amber ring that pulses around the button.
      const cueMat = new THREE.MeshBasicMaterial({ color: 0xffb23f, transparent: true, opacity: 0, depthWrite: false });
      const cue = new THREE.Mesh(new THREE.RingGeometry(0.235, 0.255, 64), cueMat);
      cue.rotation.x = -Math.PI / 2;
      cue.position.y = topY + 0.02;
      device.add(cue);
      // One fixed, invisible target for both hover and click, so they always agree.
      const hitArea = new THREE.Mesh(new THREE.CircleGeometry(0.27, 48), new THREE.MeshBasicMaterial({ visible: false }));
      hitArea.rotation.x = -Math.PI / 2;
      hitArea.position.y = topY + 0.075;
      device.add(hitArea);

      // Charging-indicator pinhole near the far corner, on the same end as the port.
      const pin = new THREE.Mesh(new THREE.CircleGeometry(0.016, 20), new THREE.MeshBasicMaterial({ color: 0x020202 }));
      pin.rotation.x = -Math.PI / 2;
      pin.position.set(0.66, topY - 0.005, -0.33);
      device.add(pin);

      // USB-C on the front long side, off-centre, in a shallow scooped recess.
      const portX = 0.4, frontZ = W / 2 + 0.001;
      const recess = new THREE.Mesh(new THREE.CircleGeometry(1, 48), black({ color: 0x101010, roughness: 0.6 }));
      recess.scale.set(0.2, 0.1, 1);
      recess.position.set(portX, -0.01, frontZ);
      device.add(recess);
      const rr = (w: number, h: number, r: number) => {
        const s = new THREE.Shape();
        s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false);
        s.lineTo(w / 2, h / 2 - r); s.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2, false);
        s.lineTo(-w / 2 + r, h / 2); s.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI, false);
        s.lineTo(-w / 2, -h / 2 + r); s.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, (3 * Math.PI) / 2, false);
        return s;
      };
      const shell = rr(0.2, 0.072, 0.036);
      shell.holes.push(rr(0.17, 0.046, 0.023) as unknown as InstanceType<typeof THREE.Path>);
      const portShell = new THREE.Mesh(new THREE.ShapeGeometry(shell, 24), new THREE.MeshStandardMaterial({ color: 0xc9c9c9, metalness: 1, roughness: 0.3 }));
      portShell.position.set(portX, -0.01, frontZ + 0.003);
      const portHole = new THREE.Mesh(new THREE.ShapeGeometry(rr(0.17, 0.046, 0.023), 24), new THREE.MeshBasicMaterial({ color: 0x050505 }));
      portHole.position.set(portX, -0.01, frontZ + 0.002);
      const tongue = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.012), new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.5 }));
      tongue.position.set(portX, -0.01, frontZ + 0.004);
      device.add(portShell, portHole, tongue);

      // Badge-holder slot on the far short end.
      const slot = new THREE.Mesh(new THREE.ShapeGeometry(rr(0.2, 0.075, 0.03), 16), new THREE.MeshBasicMaterial({ color: 0x030303 }));
      slot.rotation.y = -Math.PI / 2;
      slot.position.set(-L / 2 - 0.002, -0.01, 0);
      device.add(slot);

      // Soft contact shadow under the device.
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.9), new THREE.MeshBasicMaterial({
        map: canvasTexture(256, 160, (c) => {
          const g = c.createRadialGradient(128, 80, 10, 128, 80, 120);
          g.addColorStop(0, "rgba(0,0,0,0.55)");
          g.addColorStop(1, "rgba(0,0,0,0)");
          c.setTransform(1, 0, 0, 0.62, 0, 30);
          c.fillStyle = g;
          c.fillRect(0, 0, 256, 256);
        }),
        transparent: true, depthWrite: false,
      }));
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = -H / 2 - 0.01;
      device.add(shadow);

      // ---------- interaction ----------
      const view = { yaw: -0.5, pitch: 0.55, tYaw: -0.5, tPitch: 0.55 };
      let hovering = false;
      let held = false;
      let glowLevel = 0;
      let dragging: { x: number; y: number; yaw: number; pitch: number; moved: boolean } | null = null;
      const pointer = new THREE.Vector2();
      const raycaster = new THREE.Raycaster();
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const hitButton = (event: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(pointer, camera);
        return raycaster.intersectObjects([hitArea, ring, cap], false).length > 0;
      };
      const setHover = (value: boolean) => {
        if (value === hovering) return;
        hovering = value;
        // Freeze the model exactly where it is, so the button cannot slide out from under the cursor.
        if (value) { view.tYaw = view.yaw; view.tPitch = view.pitch; }
        renderer.domElement.style.cursor = value ? "pointer" : dragging ? "grabbing" : "grab";
        setHoverButton(value);
      };

      const onMove = (event: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        const fx = (event.clientX - rect.left) / rect.width;
        const fy = (event.clientY - rect.top) / rect.height;
        setHover(hitButton(event));
        if (dragging) {
          const dx = event.clientX - dragging.x, dy = event.clientY - dragging.y;
          if (Math.abs(dx) + Math.abs(dy) > 4) dragging.moved = true;
          view.tYaw = dragging.yaw + (dx / rect.width) * Math.PI * 2;
          view.tPitch = Math.min(1.35, Math.max(-0.35, dragging.pitch + (dy / rect.height) * 1.6));
          return;
        }
        // Mouse: the cursor position steers the view, one full turn across the width.
        // While the cursor rests on the button the view holds still so it can be clicked.
        if (event.pointerType === "mouse" && !hovering && !held) {
          view.tYaw = (fx - 0.5) * Math.PI * 2;
          view.tPitch = 0.15 + (1 - fy) * 0.95;
          setInteracted(true);
        }
      };
      const onDown = (event: PointerEvent) => {
        if (event.pointerType !== "mouse" || !hitButton(event)) {
          dragging = { x: event.clientX, y: event.clientY, yaw: view.tYaw, pitch: view.tPitch, moved: false };
          renderer.domElement.setPointerCapture(event.pointerId);
          held = false;
        }
      };
      const onUp = (event: PointerEvent) => {
        const wasDrag = dragging?.moved;
        dragging = null;
        if (!wasDrag && hitButton(event)) {
          litRef.current = !litRef.current;
          setLit(litRef.current);
        }
        setInteracted(true);
      };
      const onLeave = () => setHover(false);
      renderer.domElement.addEventListener("pointermove", onMove);
      renderer.domElement.addEventListener("pointerdown", onDown);
      renderer.domElement.addEventListener("pointerup", onUp);
      renderer.domElement.addEventListener("pointerleave", onLeave);
      renderer.domElement.style.cursor = "grab";

      api.current = {
        setLit: (on) => { litRef.current = on; setLit(on); },
        goTo: ([yaw, pitch]) => { held = true; view.tYaw = yaw; view.tPitch = pitch; },
        nudge: (d) => { held = true; view.tYaw += d; },
      };

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = host;
        renderer.setSize(w, h, false);
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        camera.aspect = w / h;
        camera.position.z = w / h < 1 ? 8.2 : 6.2;
        camera.updateProjectionMatrix();
      };
      resize();
      const observer = new ResizeObserver(resize);
      observer.observe(host);

      let visible = true;
      const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
      io.observe(host);

      let frame = 0;
      let last = performance.now();
      const tick = (now: number) => {
        frame = requestAnimationFrame(tick);
        if (!visible) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const ease = reduced ? 1 : 1 - Math.pow(0.0008, dt);
        view.yaw += (view.tYaw - view.yaw) * ease;
        view.pitch += (view.tPitch - view.pitch) * ease;
        model.rotation.set(view.pitch, view.yaw, 0, "XYZ");

        // LED: fade on and off like a real illuminated push button.
        const target = litRef.current ? 1 : 0;
        glowLevel += (target - glowLevel) * (reduced ? 1 : 1 - Math.pow(0.004, dt));
        const flicker = litRef.current ? 1 + Math.sin(now / 900) * 0.03 : 1;
        ringMat.emissiveIntensity = 1.5 * glowLevel * flicker;
        capMat.emissiveIntensity = 0.28 * glowLevel;
        ringMat.color.setRGB(0.91 + 0.09 * glowLevel, 0.9 - 0.12 * glowLevel, 0.86 - 0.4 * glowLevel);
        (halo.material as InstanceType<typeof THREE.SpriteMaterial>).opacity = 0.6 * glowLevel;
        const s = 0.55 + 0.3 * glowLevel;
        halo.scale.set(s, s, 1);
        glow.intensity = 1.4 * glowLevel;

        // Hover cue pulses gently while the cursor is on the button.
        const pulse = hovering ? 0.45 + 0.35 * Math.sin(now / 260) : 0;
        cueMat.opacity += (pulse - cueMat.opacity) * Math.min(1, dt * 12);
        cue.scale.setScalar(1 + (hovering ? 0.06 * Math.sin(now / 260) : 0));

        renderer.render(scene, camera);
      };
      frame = requestAnimationFrame(tick);

      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        io.disconnect();
        renderer.domElement.removeEventListener("pointermove", onMove);
        renderer.domElement.removeEventListener("pointerdown", onDown);
        renderer.domElement.removeEventListener("pointerup", onUp);
        renderer.domElement.removeEventListener("pointerleave", onLeave);
        scene.traverse((object) => {
          const mesh = object as InstanceType<typeof THREE.Mesh>;
          mesh.geometry?.dispose?.();
          const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
          materials.forEach((material) => material.dispose());
        });
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        api.current = null;
      };
    })().catch(() => setFailed(true));

    return () => { disposed = true; cleanup(); };
  }, []);

  const activeFeature = features.find((feature) => feature.id === active);
  const openFeature = (id: Feature3D["id"]) => {
    setActive(id);
    setInteracted(true);
    api.current?.goTo(FEATURE_VIEWS[id]);
  };

  return (
    <div className="spin product-3d">
      <div
        className={`spin-stage product-3d-stage${lit ? " is-lit" : ""}`}
        role="img"
        aria-label={`${label}. Interactive 3D model. Move the pointer or use the arrow keys to turn it. Press Enter to switch the ready light ${lit ? "off" : "on"}.`}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") { event.preventDefault(); api.current?.nudge(0.35); }
          if (event.key === "ArrowLeft") { event.preventDefault(); api.current?.nudge(-0.35); }
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); api.current?.setLit(!lit); }
        }}
      >
        <div ref={mount} className="product-3d-canvas" />
        {failed && (
          // eslint-disable-next-line @next/next/no-img-element -- plain fallback when 3D is unavailable
          <img className="spin-frame" src="/images/product/aira-13-lit-plain.webp" alt="" />
        )}
        {!interacted && !failed && <span className="spin-hint" aria-hidden="true">Move to turn. Click the button to light it.</span>}
        {hoverButton && <span className="product-3d-tip" aria-hidden="true">{lit ? "Click to switch off" : "Click to switch on"}</span>}
        <span className="concept-label">{failed ? "Real product photo. Background edited." : "3D model of the real recorder. Not a photo."}</span>
      </div>

      <div className="spin-controls">
        <button type="button" onClick={() => api.current?.setLit(!lit)} aria-pressed={lit}>{lit ? "Light off" : "Light on"}</button>
      </div>

      <div className="spin-features" role="group" aria-label="Product features">
        {features.map((feature) => (
          <button key={feature.id} type="button" aria-pressed={active === feature.id} onClick={() => (active === feature.id ? setActive(null) : openFeature(feature.id))}>{feature.title}</button>
        ))}
      </div>

      {activeFeature && (
        <div className="spin-panel" role="region" aria-label={activeFeature.title}>
          <button type="button" className="spin-panel-close" onClick={() => setActive(null)} aria-label="Close feature"><X size={16} /></button>
          <h3>{activeFeature.title}</h3>
          <p>{activeFeature.text}</p>
          {activeFeature.extra}
        </div>
      )}
    </div>
  );
}
