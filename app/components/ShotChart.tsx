import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Shot data type matching your API
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
};

export default function ShotChart({ shots, playerName = "Player" }: ShotChartProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({ made: 0, missed: 0, percentage: 0 });

  useEffect(() => {
    if (!mountRef.current || shots.length === 0) return;

    // Calculate stats
    const made = shots.filter(s => s.SHOT_MADE_FLAG === 1).length;
    const missed = shots.length - made;
    const percentage = ((made / shots.length) * 100).toFixed(1);
    setStats({ made, missed, percentage: parseFloat(percentage) });

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      40,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      2000
    );
    camera.zoom = 5;
    camera.position.set(0, 500, 400);
    camera.lookAt(0, 0, 50);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(50, 200, 100);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Court floor (half court)
    const courtGeometry = new THREE.PlaneGeometry(500, 470);
    const courtMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xc87533,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide 
    });
    const court = new THREE.Mesh(courtGeometry, courtMaterial);
    court.rotation.x = -Math.PI / 2;
    court.receiveShadow = true;
    scene.add(court);

    // Court outline
    const outlineGeometry = new THREE.EdgesGeometry(courtGeometry);
    const outlineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const courtOutline = new THREE.LineSegments(outlineGeometry, outlineMaterial);
    courtOutline.rotation.x = -Math.PI / 2;
    courtOutline.position.y = 0.5;
    courtOutline.position.z = 0;
    scene.add(courtOutline);

    // Court lines
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });

    // Three-point arc
    const cornerDistance = 215;
    const arcRadius = 237.5;

    const cornerZ = -Math.sqrt(arcRadius * arcRadius - cornerDistance * cornerDistance);
    const arcPoints = [];

    arcPoints.push(new THREE.Vector3(-cornerDistance, 0.5, -arcRadius));
    arcPoints.push(new THREE.Vector3(-cornerDistance, 0.5, cornerZ));

    const startAngle = Math.acos(cornerDistance / arcRadius);
    const endAngle = Math.PI - startAngle;

    for (let angle = startAngle; angle <= endAngle; angle += 0.02) {
      arcPoints.push(new THREE.Vector3(
        -Math.cos(angle) * arcRadius,
        0.5,
        Math.sin(angle) * arcRadius - cornerDistance + 39
      ));
    }

    arcPoints.push(new THREE.Vector3(cornerDistance, 0.5, cornerZ));
    arcPoints.push(new THREE.Vector3(cornerDistance, 0.5, -arcRadius));

    const arcGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints);
    const arcLine = new THREE.Line(arcGeometry, lineMaterial);
    scene.add(arcLine);

    // Paint/Key
    const paintGeometry = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(160, 0.1, 190)
    );
    const paint = new THREE.LineSegments(paintGeometry, lineMaterial);
    paint.position.set(0, 0.5, -140);
    scene.add(paint);

    // Free throw circle
    const ftCirclePoints = [];
    for (let i = 0; i <= 360; i += 5) {
      const angle = (i * Math.PI) / 180;
      ftCirclePoints.push(new THREE.Vector3(
        Math.cos(angle) * 60,
        0.5,
        Math.sin(angle) * 60 - 45
      ));
    }
    const ftCircleGeometry = new THREE.BufferGeometry().setFromPoints(ftCirclePoints);
    const ftCircle = new THREE.Line(ftCircleGeometry, lineMaterial);
    scene.add(ftCircle);

    // Restricted area
    const resAreaPoints = [];
    for (let i = 0; i <= 180; i += 5) {
      const angle = (i * Math.PI) / 180;
      resAreaPoints.push(new THREE.Vector3(
        Math.cos(angle) * 40,
        0.5,
        Math.sin(angle) * 40 - 190
      ));
    }
    const resAreaGeometry = new THREE.BufferGeometry().setFromPoints(resAreaPoints);
    const resArea = new THREE.Line(resAreaGeometry, lineMaterial);
    scene.add(resArea);

    // Rim
    const rimGeometry = new THREE.TorusGeometry(9, 0.8, 16, 32);
    const rimMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600 });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 100, -190);
    scene.add(rim);

    // Backboard
    const backboardGeometry = new THREE.BoxGeometry(60, 35, 1);
    const backboardMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.3
    });
    const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial);
    backboard.position.set(0, 100, -198);
    scene.add(backboard);

    // Shot markers
    const madeGeometry = new THREE.SphereGeometry(2.5, 16, 16);
    const madeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4ade80,
      emissive: 0x22c55e,
      emissiveIntensity: 0.3
    });
    
    const missedGeometry = new THREE.SphereGeometry(3, 16, 16);
    const missedMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.4
    });

    shots.forEach((shot) => {
      const geometry = shot.SHOT_MADE_FLAG === 1 ? madeGeometry : missedGeometry;
      const material = shot.SHOT_MADE_FLAG === 1 ? madeMaterial : missedMaterial;
      const sphere = new THREE.Mesh(geometry, material);
      
      // NBA API uses decifeet (1/10th of a foot)
      // Flip Y coordinate because NBA court coordinates are inverted
      
      const x = shot.LOC_X;
      const y = shot.LOC_Y - 180;

      sphere.position.set(x, 2, y);
      sphere.castShadow = true;
      scene.add(sphere);
    });

    // Camera controls (mouse drag)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let cameraAngle = 0;
    let cameraHeight = 500;
    let cameraDistance = 500;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      cameraAngle -= deltaX * 0.005;
      cameraHeight = Math.max(100, Math.min(800, cameraHeight - deltaY * 0.5));

      camera.position.x = Math.sin(cameraAngle) * cameraDistance;
      camera.position.z = Math.cos(cameraAngle) * cameraDistance + 50;
      camera.position.y = cameraHeight;
      camera.lookAt(0, 0, 50);

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraHeight = Math.max(300, Math.min(1000, cameraHeight + e.deltaY * 0.3));
      camera.position.x = Math.sin(cameraAngle) * cameraDistance;
      camera.position.z = Math.cos(cameraAngle) * cameraDistance + 50;
      camera.lookAt(0, 0, 50);
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }

      while (mountRef.current?.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
      }

      scene.clear();
      renderer.dispose();
    };
  }, [shots]);

  if (shots.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height: '600px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#1a1a2e',
        color: '#fff',
        borderRadius: '8px'
      }}>
        <p>No shot data available</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ 
        padding: '20px',
        background: '#16213e',
        color: '#fff',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0 }}>{playerName}</h2>
        <div style={{ display: 'flex', gap: '30px', fontSize: '14px' }}>
          <div>
            <span style={{ color: '#4ade80' }}>● Made: </span>
            <strong>{stats.made}</strong>
          </div>
          <div>
            <span style={{ color: '#ef4444' }}>● Missed: </span>
            <strong>{stats.missed}</strong>
          </div>
          <div>
            <span>FG%: </span>
            <strong>{stats.percentage}%</strong>
          </div>
          <div style={{ fontSize: '11px', color: '#999' }}>
            Total Shots: {shots.length}
          </div>
        </div>
      </div>
      <div 
        ref={mountRef} 
        style={{ 
          width: '100%', 
          height: '600px',
          background: '#1a1a2e',
          borderRadius: '0 0 8px 8px',
          cursor: 'grab'
        }} 
      />
      <div style={{ 
        marginTop: '10px',
        textAlign: 'center',
        color: '#666',
        fontSize: '12px'
      }}>
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
}