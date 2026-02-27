"use client";

import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Environment, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

// --- Camera controller with mouse interaction ---
function InteractiveCamera() {
  const { camera } = useThree();
  const mouse = useRef([0, 0]);

  // Update camera target smoothly
  useFrame((state) => {
    const [mx, my] = mouse.current;
    camera.position.x += (mx * 5 - camera.position.x) * 0.05;
    camera.position.y += (my * 3 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  // Capture mouse movement
  const handleMouseMove = (e: MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    mouse.current = [x, y];
  };

  // Attach event listener
  if (typeof window !== "undefined") {
    window.addEventListener("mousemove", handleMouseMove);
  }

  return null;
}

// --- Neon trail following mouse ---
function NeonTrail() {
  const trailRef = useRef<THREE.Mesh>(null);
  const points = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => new THREE.Vector3());
  }, []);

  useFrame((state) => {
    const mouseX = state.mouse.x * 15;
    const mouseY = state.mouse.y * 10;
    points.pop();
    points.unshift(new THREE.Vector3(mouseX, mouseY, 0));
    if (trailRef.current) {
      const positions = new Float32Array(points.length * 3);
      points.forEach((p, i) => {
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
      });
      trailRef.current.geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      trailRef.current.geometry.computeBoundingSphere();
    }
  });

  return (
    <line ref={trailRef}>
      <bufferGeometry />
      <lineBasicMaterial color="#0ff" transparent opacity={0.8} linewidth={2} />
    </line>
  );
}

// --- Floating geometric shapes ---
function FloatingShape({
  position,
  color,
  scale,
  speed,
}: {
  position: [number, number, number];
  color: string;
  scale: number;
  speed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.3;
      meshRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.5;
    }
  });

  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshDistortMaterial
          color={color}
          transparent
          opacity={0.6}
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

// --- Car wheels ---
function CarWheel({
  position,
  size,
}: {
  position: [number, number, number];
  size: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 2;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <torusGeometry args={[size, size * 0.3, 16, 32]} />
      <meshStandardMaterial color="#1a1a2e" metalness={0.9} roughness={0.1} />
    </mesh>
  );
}

// --- Speed lines ---
function SpeedLines() {
  const linesRef = useRef<THREE.Group>(null);

  const lines = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 20,
        -10 - Math.random() * 20,
      ] as [number, number, number],
      length: 0.5 + Math.random() * 2,
      speed: 0.5 + Math.random() * 1.5,
    }));
  }, []);

  useFrame(() => {
    if (linesRef.current) {
      linesRef.current.children.forEach((child, i) => {
        child.position.z += lines[i].speed * 0.3;
        if (child.position.z > 10) {
          child.position.z = -30;
          child.position.x = (Math.random() - 0.5) * 40;
          child.position.y = (Math.random() - 0.5) * 20;
        }
      });
    }
  });

  return (
    <group ref={linesRef}>
      {lines.map((line, i) => (
        <mesh key={i} position={line.position} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, line.length, 8]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// --- Grid floor ---
function GridFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
      <planeGeometry args={[100, 100, 50, 50]} />
      <meshBasicMaterial color="#1e40af" wireframe transparent opacity={0.1} />
    </mesh>
  );
}

// --- Particle field ---
function ParticleField() {
  const particlesRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      particlesRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={200}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#60a5fa"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// --- Neon vortex ---
function NeonVortex() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += 0.01;
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -20]}>
      <torusKnotGeometry args={[5, 1.2, 100, 16]} />
      <meshStandardMaterial
        color="#0ff"
        emissive="#0ff"
        emissiveIntensity={2}
        metalness={0.5}
        roughness={0.2}
      />
    </mesh>
  );
}

// --- Digital rain ---
function DigitalRain() {
  const rainRef = useRef<THREE.Group>(null);
  const streams = useMemo(
    () =>
      Array.from({ length: 100 }, () => ({
        x: (Math.random() - 0.5) * 40,
        y: Math.random() * 20 + 10,
        z: (Math.random() - 0.5) * 40,
        speed: 0.1 + Math.random() * 0.5,
      })),
    []
  );

  useFrame(() => {
    if (!rainRef.current) return;
    rainRef.current.children.forEach((child, i) => {
      child.position.y -= streams[i].speed;
      if (child.position.y < -10) child.position.y = 20;
    });
  });

  return (
    <group ref={rainRef}>
      {streams.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, s.z]}>
          <cylinderGeometry args={[0.02, 0.02, 1, 4]} />
          <meshBasicMaterial color="#0ff" />
        </mesh>
      ))}
    </group>
  );
}

// --- Holographic panels ---
function HoloPanel({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      const material = meshRef.current.material as THREE.Material;
      material.opacity = 0.3 + Math.sin(state.clock.elapsedTime) * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[3, 2]} />
      <meshBasicMaterial
        color="#3b82f6"
        transparent
        opacity={0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// --- Main scene ---
function Scene() {
  return (
    <>
      <InteractiveCamera />

      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#3b82f6" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
      <spotLight
        position={[0, 20, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        color="#60a5fa"
      />

      <FloatingShape
        position={[-8, 3, -5]}
        color="#3b82f6"
        scale={1.5}
        speed={1.2}
      />
      <FloatingShape
        position={[8, -2, -8]}
        color="#8b5cf6"
        scale={1.2}
        speed={0.8}
      />
      <FloatingShape
        position={[-5, -3, -10]}
        color="#06b6d4"
        scale={1}
        speed={1.5}
      />
      <FloatingShape
        position={[6, 4, -6]}
        color="#3b82f6"
        scale={0.8}
        speed={1}
      />
      <FloatingShape
        position={[0, 5, -12]}
        color="#8b5cf6"
        scale={1.3}
        speed={0.6}
      />

      <Float speed={1.5} rotationIntensity={1}>
        <CarWheel position={[-12, 0, -8]} size={1} />
      </Float>
      <Float speed={1.2} rotationIntensity={0.8}>
        <CarWheel position={[12, 2, -10]} size={0.8} />
      </Float>

      <SpeedLines />
      <GridFloor />
      <ParticleField />
      <NeonVortex />
      <DigitalRain />
      <HoloPanel position={[-6, 3, -12]} />
      <HoloPanel position={[5, -2, -10]} />
      <HoloPanel position={[0, 5, -15]} />

      <NeonTrail />

      <Environment preset="city" />
    </>
  );
}

// --- ThreeBackground wrapper ---
export function ThreeBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
    </div>
  );
}
