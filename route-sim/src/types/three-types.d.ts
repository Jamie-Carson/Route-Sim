import * as THREE from "three";
import { Object3DNode } from "@react-three/fiber";

declare module "@react-three/fiber" {
  interface ThreeElements {
    mesh: Object3DNode<THREE.Mesh, typeof THREE.Mesh>;
    bufferGeometry: Object3DNode<
      THREE.BufferGeometry,
      typeof THREE.BufferGeometry
    >;
    meshStandardMaterial: Object3DNode<
      THREE.MeshStandardMaterial,
      typeof THREE.MeshStandardMaterial
    >;
    ambientLight: Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>;
    directionalLight: Object3DNode<
      THREE.DirectionalLight,
      typeof THREE.DirectionalLight
    >;
  }
}
