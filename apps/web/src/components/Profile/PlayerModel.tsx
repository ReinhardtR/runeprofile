import {
  Center,
  Html,
  OrbitControls,
  Stage,
  useProgress,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { MutableRefObject, Suspense, useEffect, useRef, useState } from "react";
import { BufferGeometry, Group, Material, Mesh } from "three";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";

type PlayerModelProps = {
  model: {
    obj: string;
    mtl: string;
  };
};

export const PlayerModel: React.FC<PlayerModelProps> = ({ model }) => {
  return (
    <Canvas>
      <Suspense fallback={<Loader />}>
        <Stage intensity={1}>
          <Model model={model} />
        </Stage>
      </Suspense>
    </Canvas>
  );
};

type ModelProps = PlayerModelProps;

const Model: React.FC<ModelProps> = ({ model }) => {
  const mesh = useRef<Mesh<BufferGeometry, Material | Material[]>>(null);
  const obj = useRef<Group>();

  useEffect(() => {
    const mtlBlob = new Blob([model.mtl], { type: "text/plain" });
    const mtlURL = URL.createObjectURL(mtlBlob);

    const objBlob = new Blob([model.obj], { type: "text/plain" });
    const objURL = URL.createObjectURL(objBlob);

    new MTLLoader().load(mtlURL, (materials) => {
      materials.preload();

      new OBJLoader().setMaterials(materials).load(objURL, (object) => {
        obj.current = object;
      });
    });
  }, [model]);

  useFrame(({ clock }) => {
    if (!obj.current) return;

    obj.current.rotation.x = Math.sin(clock.getElapsedTime());
  });

  return (
    <mesh ref={mesh}>
      {obj.current && <primitive object={obj.current} scale={0.025} />}
    </mesh>
  );
};

const Loader: React.FC = () => {
  const { progress } = useProgress();
  return <Html center>{progress} % loaded</Html>;
};
