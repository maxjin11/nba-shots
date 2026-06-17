"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { JetBrains_Mono } from "next/font/google";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

type Shot = {
  LOC_X: number;
  LOC_Y: number;
  SHOT_MADE_FLAG: number;
  SHOT_DISTANCE: number;
  SHOT_TYPE: string;
};

type ShotChartProps = {
  shots: Shot[];
  playerName?: string;
  loading?: boolean;
};

const MADE_COLOR = 0xff5e2b;
const MISSED_COLOR = 0xededed;
const LINE_COLOR = 0xededed;

function ChartSkeleton() {
  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-[#ededed]/15 to-transparent" />
        <div className="pointer-events-none absolute -left-24 -top-32 z-0 h-64 w-64 rounded-full bg-[#ff5e2b]/[0.06] blur-[100px]" />

        <div
          className={`${mono.className} pointer-events-none absolute left-5 top-5 z-10 flex flex-col gap-2 text-[10px] uppercase tracking-[0.32em] text-[#ededed]/35`}
        >
          <div className="flex items-center gap-2.5">
            <span className="inline-block h-[7px] w-[7px] rounded-full bg-[#ff5e2b]/40" />
            <span>made</span>
            <span className="text-[#ededed]/25">—</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="inline-block h-[7px] w-[7px] rounded-full bg-[#ededed]/20" />
            <span>missed</span>
            <span className="text-[#ededed]/25">—</span>
          </div>
        </div>

        <div className="flex h-[640px] items-center justify-center">
          <svg
            viewBox="0 0 500 470"
            className="h-[80%] w-auto animate-pulse text-[#ededed]/25"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
          >
            <rect x="1" y="1" width="498" height="468" />
            <rect x="170" y="0" width="160" height="190" />
            <circle cx="250" cy="190" r="60" />
            <path d="M 210 45 A 40 40 0 0 1 290 45" />
            <line x1="35" y1="0" x2="35" y2="146" />
            <line x1="465" y1="0" x2="465" y2="146" />
            <path d="M 35 146 A 237.5 237.5 0 0 1 465 146" />
            <circle cx="250" cy="45" r="9" stroke="#ff5e2b" />
          </svg>
        </div>

        <div
          className={`${mono.className} pointer-events-none absolute bottom-5 left-1/2 z-10 -translate-x-1/2 text-[10px] uppercase tracking-[0.32em] text-[#ededed]/40`}
        >
          fetching shot log · this may take a few seconds
        </div>
      </div>
    </div>
  );
}

export default function ShotChart({ shots, loading }: ShotChartProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const made = shots.filter((s) => s.SHOT_MADE_FLAG === 1).length;
    const missed = shots.length - made;
    const percentage =
      shots.length > 0
        ? parseFloat(((made / shots.length) * 100).toFixed(1))
        : 0;
    return { made, missed, percentage };
  }, [shots]);

  useEffect(() => {
    // Bail out while the skeleton is showing — the chart div isn't mounted
    // yet, so mountRef.current is null. We re-run when `loading` flips false.
    if (loading) return;
    if (!mountRef.current || shots.length === 0) return;
    const container = mountRef.current;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      3000
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ─── lighting ──────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 0.55);
    key.position.set(80, 400, 200);
    scene.add(key);
    const rimLight = new THREE.PointLight(0xff5e2b, 0.8, 700, 2);
    rimLight.position.set(0, 110, -190);
    scene.add(rimLight);

    // ─── court floor ───────────────────────────────────────────
    const courtGeo = new THREE.PlaneGeometry(500, 470);
    const courtMat = new THREE.MeshStandardMaterial({
      color: 0x1a1410,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      roughness: 0.95,
      metalness: 0,
    });
    const court = new THREE.Mesh(courtGeo, courtMat);
    court.rotation.x = -Math.PI / 2;
    scene.add(court);

    const lineMat = new THREE.LineBasicMaterial({
      color: LINE_COLOR,
      transparent: true,
      opacity: 0.55,
    });

    // ─── court outline ─────────────────────────────────────────
    const outlineGeo = new THREE.EdgesGeometry(courtGeo);
    const courtOutline = new THREE.LineSegments(outlineGeo, lineMat);
    courtOutline.rotation.x = -Math.PI / 2;
    courtOutline.position.y = 0.5;
    scene.add(courtOutline);

    // ─── three-point arc (geometry preserved as authored) ──────
    const cornerDistance = 215;
    const arcRadius = 237.5;
    const cornerZ = -Math.sqrt(
      arcRadius * arcRadius - cornerDistance * cornerDistance
    );
    const arcPoints: THREE.Vector3[] = [];
    arcPoints.push(new THREE.Vector3(-cornerDistance, 0.5, -arcRadius));
    arcPoints.push(new THREE.Vector3(-cornerDistance, 0.5, cornerZ));
    const startAngle = Math.acos(cornerDistance / arcRadius);
    const endAngle = Math.PI - startAngle;
    for (let angle = startAngle; angle <= endAngle; angle += 0.02) {
      arcPoints.push(
        new THREE.Vector3(
          -Math.cos(angle) * arcRadius,
          0.5,
          Math.sin(angle) * arcRadius - cornerDistance + 39
        )
      );
    }
    arcPoints.push(new THREE.Vector3(cornerDistance, 0.5, cornerZ));
    arcPoints.push(new THREE.Vector3(cornerDistance, 0.5, -arcRadius));
    const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
    scene.add(new THREE.Line(arcGeo, lineMat));

    // ─── paint ─────────────────────────────────────────────────
    const paintGeo = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(160, 0.1, 190)
    );
    const paint = new THREE.LineSegments(paintGeo, lineMat);
    paint.position.set(0, 0.5, -140);
    scene.add(paint);

    // ─── free throw circle ─────────────────────────────────────
    const ftPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 360; i += 5) {
      const a = (i * Math.PI) / 180;
      ftPoints.push(
        new THREE.Vector3(Math.cos(a) * 60, 0.5, Math.sin(a) * 60 - 45)
      );
    }
    scene.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(ftPoints),
        lineMat
      )
    );

    // ─── restricted area ───────────────────────────────────────
    const raPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 180; i += 5) {
      const a = (i * Math.PI) / 180;
      raPoints.push(
        new THREE.Vector3(Math.cos(a) * 40, 0.5, Math.sin(a) * 40 - 190)
      );
    }
    scene.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(raPoints),
        lineMat
      )
    );

    // ─── rim ───────────────────────────────────────────────────
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(9, 0.8, 16, 32),
      new THREE.MeshStandardMaterial({
        color: MADE_COLOR,
        emissive: MADE_COLOR,
        emissiveIntensity: 0.5,
        roughness: 0.4,
      })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 100, -190);
    scene.add(rim);

    // ─── backboard ─────────────────────────────────────────────
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(60, 35, 1),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.18,
        roughness: 0.2,
      })
    );
    board.position.set(0, 100, -198);
    scene.add(board);

    // ─── shot markers (instanced for performance) ──────────────
    const madeCount = stats.made;
    const missedCount = stats.missed;

    const madeGeo = new THREE.SphereGeometry(2.6, 12, 12);
    const madeMat = new THREE.MeshStandardMaterial({
      color: MADE_COLOR,
      emissive: MADE_COLOR,
      emissiveIntensity: 0.55,
      roughness: 0.35,
    });
    const missedGeo = new THREE.SphereGeometry(2.0, 10, 10);
    const missedMat = new THREE.MeshStandardMaterial({
      color: MISSED_COLOR,
      emissive: MISSED_COLOR,
      emissiveIntensity: 0.06,
      roughness: 0.7,
      transparent: true,
      opacity: 0.45,
    });

    const madeMesh = new THREE.InstancedMesh(
      madeGeo,
      madeMat,
      Math.max(1, madeCount)
    );
    const missedMesh = new THREE.InstancedMesh(
      missedGeo,
      missedMat,
      Math.max(1, missedCount)
    );
    madeMesh.count = madeCount;
    missedMesh.count = missedCount;

    const dummy = new THREE.Object3D();
    let madeIdx = 0;
    let missedIdx = 0;
    shots.forEach((shot) => {
      dummy.position.set(shot.LOC_X, 2, shot.LOC_Y - 180);
      dummy.updateMatrix();
      if (shot.SHOT_MADE_FLAG === 1) {
        madeMesh.setMatrixAt(madeIdx++, dummy.matrix);
      } else {
        missedMesh.setMatrixAt(missedIdx++, dummy.matrix);
      }
    });
    madeMesh.instanceMatrix.needsUpdate = true;
    missedMesh.instanceMatrix.needsUpdate = true;
    scene.add(missedMesh);
    scene.add(madeMesh);

    // ─── camera controls (orbit, damped, with momentum) ────────
    const TARGET = new THREE.Vector3(0, 0, 50);
    const MIN_PITCH = 0.1;
    const MAX_PITCH = Math.PI / 2 - 0.04;
    const MIN_DISTANCE = 380;
    const MAX_DISTANCE = 1100;

    // target = where the camera is heading; current = where it is right now.
    // Each frame we ease current → target so motion feels glassy instead of jerky.
    let targetAzimuth = 0;
    let targetPitch = Math.PI / 4;
    let targetDistance = 707;
    let currentAzimuth = targetAzimuth;
    let currentPitch = targetPitch;
    let currentDistance = targetDistance;

    let velAzimuth = 0;
    let velPitch = 0;

    const clampPitch = (p: number) =>
      Math.max(MIN_PITCH, Math.min(MAX_PITCH, p));

    const applyCamera = () => {
      const cosP = Math.cos(currentPitch);
      camera.position.x =
        TARGET.x + currentDistance * cosP * Math.sin(currentAzimuth);
      camera.position.y = TARGET.y + currentDistance * Math.sin(currentPitch);
      camera.position.z =
        TARGET.z + currentDistance * cosP * Math.cos(currentAzimuth);
      camera.lookAt(TARGET);
    };
    applyCamera();

    let isDragging = false;
    let activePointer: number | null = null;
    let prev = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      isDragging = true;
      activePointer = e.pointerId;
      prev = { x: e.clientX, y: e.clientY };
      velAzimuth = 0;
      velPitch = 0;
      renderer.domElement.setPointerCapture(e.pointerId);
      renderer.domElement.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging || e.pointerId !== activePointer) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      const azDelta = -dx * 0.005;
      const piDelta = dy * 0.005;
      targetAzimuth += azDelta;
      targetPitch = clampPitch(targetPitch + piDelta);
      // last frame's delta seeds the flick momentum on release
      velAzimuth = azDelta;
      velPitch = piDelta;
      prev = { x: e.clientX, y: e.clientY };
    };

    const onPointerEnd = (e: PointerEvent) => {
      if (e.pointerId !== activePointer) return;
      isDragging = false;
      activePointer = null;
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch {
        /* pointer already released */
      }
      renderer.domElement.style.cursor = "grab";
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // exponential zoom — feels uniform whether zoomed-in or zoomed-out
      const factor = Math.exp(e.deltaY * 0.0012);
      targetDistance = Math.max(
        MIN_DISTANCE,
        Math.min(MAX_DISTANCE, targetDistance * factor)
      );
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerEnd);
    renderer.domElement.addEventListener("pointercancel", onPointerEnd);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    // ─── animation loop (damped follow + momentum) ─────────────
    const FOLLOW = 0.18;
    const FRICTION = 0.93;
    const MIN_VEL = 0.00015;
    let rafId = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);

      // Flick momentum continues to push the target after release until
      // friction bleeds it off. Dragging again zeros it.
      if (!isDragging) {
        if (
          Math.abs(velAzimuth) > MIN_VEL ||
          Math.abs(velPitch) > MIN_VEL
        ) {
          targetAzimuth += velAzimuth;
          targetPitch = clampPitch(targetPitch + velPitch);
          velAzimuth *= FRICTION;
          velPitch *= FRICTION;
        } else {
          velAzimuth = 0;
          velPitch = 0;
        }
      }

      currentAzimuth += (targetAzimuth - currentAzimuth) * FOLLOW;
      currentPitch += (targetPitch - currentPitch) * FOLLOW;
      currentDistance += (targetDistance - currentDistance) * (FOLLOW * 0.85);
      applyCamera();

      renderer.render(scene, camera);
    };
    animate();

    // ─── resize ────────────────────────────────────────────────
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerEnd);
      renderer.domElement.removeEventListener("pointercancel", onPointerEnd);
      renderer.domElement.removeEventListener("wheel", onWheel);

      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh & { geometry?: THREE.BufferGeometry };
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = (obj as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) (mat as THREE.Material).dispose();
      });

      renderer.dispose();

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [shots, stats.made, stats.missed, loading]);

  if (loading) return <ChartSkeleton />;

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-[#ededed]/15 to-transparent" />
        <div className="pointer-events-none absolute -left-24 -top-32 z-0 h-64 w-64 rounded-full bg-[#ff5e2b]/[0.06] blur-[100px]" />

        {/* legend overlay */}
        <div
          className={`${mono.className} pointer-events-none absolute left-5 top-5 z-10 flex flex-col gap-2 text-[10px] uppercase tracking-[0.32em]`}
        >
          <div className="flex items-center gap-2.5 text-[#ededed]/85">
            <span className="inline-block h-[7px] w-[7px] rounded-full bg-[#ff5e2b] shadow-[0_0_8px_rgba(255,94,43,0.6)]" />
            <span>made</span>
            <span className="text-[#ededed]/55">
              {stats.made.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[#ededed]/55">
            <span className="inline-block h-[7px] w-[7px] rounded-full bg-[#ededed]/35" />
            <span>missed</span>
            <span className="text-[#ededed]/40">
              {stats.missed.toLocaleString()}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-[#ededed]/35">fg%</span>
            <span className="text-[#ededed]">{stats.percentage}</span>
          </div>
        </div>

        {/* control hint */}
        <div
          className={`${mono.className} pointer-events-none absolute bottom-5 right-5 z-10 flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-[#ededed]/30`}
        >
          <span>drag · rotate</span>
          <span className="text-[#ededed]/15">/</span>
          <span>scroll · zoom</span>
        </div>

        {shots.length === 0 ? (
          <div
            className={`${mono.className} flex h-[640px] items-center justify-center text-[11px] uppercase tracking-[0.32em] text-[#ededed]/35`}
          >
            no shot data available
          </div>
        ) : (
          <div
            ref={mountRef}
            className="h-[640px] w-full cursor-grab touch-none select-none"
          />
        )}
      </div>
    </div>
  );
}
