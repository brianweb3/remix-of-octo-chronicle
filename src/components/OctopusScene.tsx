import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRef, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { LifeState } from '@/types/octo';

interface OctopusProps {
  lifeState: LifeState;
}

function LowPolyOctopus({ lifeState }: OctopusProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const tentacleGroupRefs = useRef<THREE.Group[]>([]);
  
  // Color based on life state
  const colors = useMemo(() => {
    switch (lifeState) {
      case 'alive':
        return { main: '#4ECDC4', light: '#A8E6CF', dark: '#2C7873', accent: '#E8A87C' };
      case 'starving':
        return { main: '#7FCDCD', light: '#B8E4E4', dark: '#4A9999', accent: '#D4A574' };
      case 'dying':
        return { main: '#9EBEBE', light: '#C8D8D8', dark: '#6A8888', accent: '#C09868' };
      case 'dead':
        return { main: '#888888', light: '#AAAAAA', dark: '#555555', accent: '#999999' };
    }
  }, [lifeState]);
  
  // Animation speed based on life state
  const animSpeed = useMemo(() => {
    switch (lifeState) {
      case 'alive': return 1;
      case 'starving': return 0.5;
      case 'dying': return 0.15;
      case 'dead': return 0;
    }
  }, [lifeState]);
  
  useFrame((state) => {
    if (!groupRef.current || animSpeed === 0) return;
    
    const time = state.clock.getElapsedTime();
    
    // Breathing animation for body
    if (headRef.current) {
      const breathScale = 1 + Math.sin(time * animSpeed) * 0.04;
      headRef.current.scale.set(breathScale, breathScale * 0.95, breathScale);
    }
    
    // Only subtle sway - NO vertical movement to prevent sliding down
    groupRef.current.rotation.y = Math.sin(time * 0.3 * animSpeed) * 0.08;
    groupRef.current.rotation.z = Math.sin(time * 0.2 * animSpeed) * 0.02;
    
    // Organic tentacle wave - each tentacle waves independently
    tentacleGroupRefs.current.forEach((tentacleGroup, i) => {
      if (tentacleGroup) {
        const offset = (i / 8) * Math.PI * 2;
        const wavePhase = time * animSpeed * 0.8;
        
        // Base rotation
        tentacleGroup.rotation.x = 0.4 + Math.sin(wavePhase + offset) * 0.2;
        tentacleGroup.rotation.z = Math.sin(wavePhase * 0.7 + offset) * 0.15;
        
        // Secondary curl
        const curl = Math.sin(wavePhase * 0.5 + offset * 2) * 0.1;
        tentacleGroup.rotation.y = curl;
      }
    });
  });
  
  // Create more detailed low-poly head
  const headGeometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.2, 1);
    // Elongate vertically for octopus head shape
    const positions = geo.attributes.position.array;
    for (let i = 1; i < positions.length; i += 3) {
      (positions as Float32Array)[i] *= 1.4;
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, []);
  
  // Eye geometry
  const eyeGeometry = useMemo(() => new THREE.IcosahedronGeometry(0.22, 0), []);
  const pupilGeometry = useMemo(() => new THREE.BoxGeometry(0.1, 0.1, 0.1), []);
  
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Head */}
      <mesh ref={headRef} geometry={headGeometry} position={[0, 0.3, 0]}>
        <meshStandardMaterial 
          color={colors.main} 
          flatShading 
          roughness={0.5}
          metalness={0.05}
        />
      </mesh>
      
      {/* Head highlight */}
      <mesh position={[0.3, 0.9, 0.6]} scale={0.3}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial 
          color={colors.light} 
          flatShading 
          transparent
          opacity={0.6}
        />
      </mesh>
      
      {/* Eyes */}
      <mesh geometry={eyeGeometry} position={[-0.45, 0.7, 0.85]}>
        <meshStandardMaterial color={colors.dark} flatShading />
      </mesh>
      <mesh geometry={eyeGeometry} position={[0.45, 0.7, 0.85]}>
        <meshStandardMaterial color={colors.dark} flatShading />
      </mesh>
      
      {/* Pupils */}
      <mesh geometry={pupilGeometry} position={[-0.45, 0.7, 1.02]}>
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh geometry={pupilGeometry} position={[0.45, 0.7, 1.02]}>
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      {/* Tentacles */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 0.7;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        return (
          <group
            key={i}
            ref={(el) => { if (el) tentacleGroupRefs.current[i] = el; }}
            position={[x, -0.7, z]}
            rotation={[0.4, angle, 0]}
          >
            {/* Main tentacle segments */}
            {Array.from({ length: 4 }).map((_, s) => {
              const t = s / 4;
              const segmentLength = 0.5;
              const segRadius = 0.18 * (1 - t * 0.6);
              
              return (
                <mesh
                  key={s}
                  position={[0, -s * segmentLength * 0.85, 0]}
                  rotation={[t * 0.2, 0, 0]}
                >
                  <coneGeometry args={[segRadius, segmentLength, 6]} />
                  <meshStandardMaterial 
                    color={s % 2 === 0 ? colors.main : colors.light} 
                    flatShading
                    roughness={0.6}
                  />
                </mesh>
              );
            })}
            
            {/* Suction cups */}
            {Array.from({ length: 3 }).map((_, c) => (
              <mesh
                key={`cup-${c}`}
                position={[
                  Math.sin(angle + Math.PI) * 0.12,
                  -0.3 - c * 0.45,
                  Math.cos(angle + Math.PI) * 0.12
                ]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <boxGeometry args={[0.12, 0.12, 0.08]} />
                <meshStandardMaterial color={colors.accent} flatShading />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

interface OctopusSceneProps {
  lifeState: LifeState;
  isDead?: boolean;
}

export function OctopusScene({ lifeState, isDead = false }: OctopusSceneProps) {
  // When dead, force lifeState to 'dead' for animations
  const effectiveLifeState = isDead ? 'dead' : lifeState;
  return (
    <div className="w-full h-full">
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0.5, 5], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          {/* Ambient and directional lighting for low-poly aesthetic */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
          <directionalLight position={[-3, 2, -3]} intensity={0.5} color="#4ECDC4" />
          <pointLight position={[0, -3, 0]} intensity={0.4} color="#FF6B35" />
          <spotLight 
            position={[0, 8, 0]} 
            intensity={0.3} 
            angle={0.5} 
            penumbra={1}
            color="#A8E6CF"
          />
          <hemisphereLight args={['#4ECDC4', '#FF6B35', 0.3]} />
          
          <LowPolyOctopus lifeState={effectiveLifeState} />
          
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            autoRotate={!isDead && effectiveLifeState !== 'dead'}
            autoRotateSpeed={effectiveLifeState === 'alive' ? 0.4 : 0.15}
            minPolarAngle={Math.PI / 2.5}
            maxPolarAngle={Math.PI / 2}
            minAzimuthAngle={-Math.PI / 4}
            maxAzimuthAngle={Math.PI / 4}
            target={[0, 0, 0]}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
