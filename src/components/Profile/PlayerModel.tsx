import { Center, Html, useProgress } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef, useState } from "react";
import {
  BufferGeometry,
  FrontSide,
  HemisphereLight,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NormalBlending,
} from "three";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";

type PlayerModelProps = {
  model: string;
};

export const PlayerModel: React.FC<PlayerModelProps> = ({ model }) => {
  return (
    <Canvas>
      <Suspense fallback={<Loader />}>
        <Model model={model} />
      </Suspense>
    </Canvas>
  );
};

type ModelProps = PlayerModelProps;

const Model: React.FC<ModelProps> = ({ model }) => {
  const mesh = useRef<Mesh<BufferGeometry, Material | Material[]>>(null);
  const [object, setObject] =
    useState<Mesh<BufferGeometry, MeshStandardMaterial>>();

  useMemo(() => {
    const blob = new Blob([Buffer.from(JSON.parse(model))]);

    const reader = new FileReader();

    reader.addEventListener("load", (event) => {
      // @ts-ignore
      const content = event.target.result as ArrayBuffer;

      const geometry = new PLYLoader().parse(content);
      geometry.computeVertexNormals();

      const material = new MeshStandardMaterial({
        vertexColors: true,
      });

      const m = new Mesh(geometry, material);
      m.rotateX(-1.5);

      setObject(m);
    });

    reader.readAsArrayBuffer(blob);
  }, [model]);

  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    m.rotation.y = Math.sin(clock.getElapsedTime());
  });

  return (
    <>
      {!!object && (
        <>
          <ambientLight intensity={2.5} />
          <mesh ref={mesh} scale={0.028} position={[0, -2.8, 0]}>
            <primitive object={object} />
          </mesh>
        </>
      )}
    </>
  );
};

const Loader: React.FC = () => {
  const { progress } = useProgress();
  return <Html center>{progress} % loaded</Html>;
};
