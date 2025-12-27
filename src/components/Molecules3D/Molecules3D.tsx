import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, Line } from '@react-three/drei'
import * as THREE from 'three'

// Individual atom component
const Atom: React.FC<{
  position: [number, number, number]
  color: string
  size?: number
  speed?: number
}> = ({ position, color, size = 0.3, speed = 1 }) => {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01 * speed
      meshRef.current.rotation.y += 0.01 * speed
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime * speed) * 0.02
    }
  })

  return (
    <Sphere ref={meshRef} position={position} args={[size, 16, 16]}>
      <meshPhongMaterial 
        color={color} 
        transparent 
        opacity={0.8} 
        shininess={100}
        specular="#ffffff"
      />
    </Sphere>
  )
}

// Bond/connection between atoms
const Bond: React.FC<{
  start: [number, number, number]
  end: [number, number, number]
  color?: string
}> = ({ start, end, color = '#ffffff' }) => {
  const points = useMemo(() => [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end)
  ], [start, end])

  return (
    <Line 
      points={points} 
      color={color} 
      lineWidth={2}
      transparent
      opacity={0.6}
    />
  )
}

// Water molecule (H2O)
const WaterMolecule: React.FC<{ position: [number, number, number], scale?: number }> = ({ 
  position, 
  scale = 1 
}) => {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2
      groupRef.current.rotation.y += 0.005
      groupRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.3) * 0.1
    }
  })

  const oxygenPos: [number, number, number] = [0, 0, 0]
  const hydrogen1Pos: [number, number, number] = [-0.8 * scale, 0.6 * scale, 0]
  const hydrogen2Pos: [number, number, number] = [0.8 * scale, 0.6 * scale, 0]

  return (
    <group ref={groupRef} position={position}>
      {/* Oxygen atom (red) */}
      <Atom position={oxygenPos} color="#ff4444" size={0.4 * scale} speed={0.8} />
      
      {/* Hydrogen atoms (white) */}
      <Atom position={hydrogen1Pos} color="#ffffff" size={0.25 * scale} speed={1.2} />
      <Atom position={hydrogen2Pos} color="#ffffff" size={0.25 * scale} speed={1.2} />
      
      {/* Bonds */}
      <Bond start={oxygenPos} end={hydrogen1Pos} color="#cccccc" />
      <Bond start={oxygenPos} end={hydrogen2Pos} color="#cccccc" />
    </group>
  )
}

// Methane molecule (CH4)
const MethaneMolecule: React.FC<{ position: [number, number, number], scale?: number }> = ({ 
  position, 
  scale = 1 
}) => {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x += 0.008
      groupRef.current.rotation.y += 0.012
      groupRef.current.rotation.z += 0.006
      groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 0.7) * 0.03
    }
  })

  const carbonPos: [number, number, number] = [0, 0, 0]
  const hydrogenPositions: [number, number, number][] = [
    [1 * scale, 1 * scale, 1 * scale],
    [-1 * scale, -1 * scale, 1 * scale],
    [-1 * scale, 1 * scale, -1 * scale],
    [1 * scale, -1 * scale, -1 * scale]
  ]

  return (
    <group ref={groupRef} position={position}>
      {/* Carbon atom (black) */}
      <Atom position={carbonPos} color="#333333" size={0.35 * scale} speed={0.6} />
      
      {/* Hydrogen atoms */}
      {hydrogenPositions.map((pos, index) => (
        <Atom 
          key={index} 
          position={pos} 
          color="#ffffff" 
          size={0.2 * scale} 
          speed={1 + index * 0.2} 
        />
      ))}
      
      {/* Bonds */}
      {hydrogenPositions.map((pos, index) => (
        <Bond key={index} start={carbonPos} end={pos} color="#dddddd" />
      ))}
    </group>
  )
}

// Benzene ring (C6H6)
const BenzeneMolecule: React.FC<{ position: [number, number, number], scale?: number }> = ({ 
  position, 
  scale = 1 
}) => {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += 0.01
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.3
    }
  })

  // Hexagonal arrangement for benzene ring
  const carbonPositions: [number, number, number][] = []
  const hydrogenPositions: [number, number, number][] = []
  
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3
    const radius = 1.2 * scale
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    carbonPositions.push([x, y, 0])
    
    // Hydrogen positions (further out)
    const hRadius = 1.8 * scale
    const hX = Math.cos(angle) * hRadius
    const hY = Math.sin(angle) * hRadius
    hydrogenPositions.push([hX, hY, 0])
  }

  return (
    <group ref={groupRef} position={position}>
      {/* Carbon atoms in hexagonal ring */}
      {carbonPositions.map((pos, index) => (
        <Atom 
          key={`carbon-${index}`} 
          position={pos} 
          color="#333333" 
          size={0.3 * scale} 
          speed={0.8 + index * 0.1} 
        />
      ))}
      
      {/* Hydrogen atoms */}
      {hydrogenPositions.map((pos, index) => (
        <Atom 
          key={`hydrogen-${index}`} 
          position={pos} 
          color="#ffffff" 
          size={0.2 * scale} 
          speed={1.2 + index * 0.1} 
        />
      ))}
      
      {/* Carbon-Carbon bonds (ring) */}
      {carbonPositions.map((pos, index) => {
        const nextIndex = (index + 1) % 6
        return (
          <Bond 
            key={`cc-bond-${index}`} 
            start={pos} 
            end={carbonPositions[nextIndex]} 
            color="#888888" 
          />
        )
      })}
      
      {/* Carbon-Hydrogen bonds */}
      {carbonPositions.map((cPos, index) => (
        <Bond 
          key={`ch-bond-${index}`} 
          start={cPos} 
          end={hydrogenPositions[index]} 
          color="#cccccc" 
        />
      ))}
    </group>
  )
}

// Main 3D Scene
const Scene3D: React.FC = () => {
  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.4} />
      
      {/* Directional lights */}
      <directionalLight position={[10, 10, 5]} intensity={0.8} color="#ffffff" />
      <directionalLight position={[-10, -10, -5]} intensity={0.4} color="#4f46e5" />
      <pointLight position={[0, 0, 10]} intensity={0.6} color="#10b981" />
      
      {/* Molecules */}
      <WaterMolecule position={[-4, 2, 0]} scale={0.8} />
      <MethaneMolecule position={[4, -1, 2]} scale={0.6} />
      <BenzeneMolecule position={[0, -3, -1]} scale={0.5} />
      
      {/* Additional floating molecules */}
      <WaterMolecule position={[6, 3, -2]} scale={0.5} />
      <MethaneMolecule position={[-6, -2, 1]} scale={0.4} />
      <WaterMolecule position={[2, 4, -3]} scale={0.6} />
      <BenzeneMolecule position={[-3, 1, 3]} scale={0.4} />
    </>
  )
}

// Main component
const Molecules3D: React.FC<{
  className?: string
  height?: string
}> = ({ className = '', height = '100vh' }) => {
  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <Canvas
        camera={{ 
          position: [0, 0, 12], 
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance"
        }}
        style={{ background: 'transparent' }}
      >
        <Scene3D />
      </Canvas>
    </div>
  )
}

export default Molecules3D