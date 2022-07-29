import { Html, useProgress } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef, useState } from "react";
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
        <Model model={model} />
      </Suspense>
    </Canvas>
  );
};

type ModelProps = PlayerModelProps;

const Model: React.FC<ModelProps> = ({ model }) => {
  const mesh = useRef<Mesh<BufferGeometry, Material | Material[]>>(null);
  const [obj, setObj] = useState<Group>();

  useMemo(() => {
    const mtlBlob = new Blob([model.mtl], { type: "text/plain" });
    const mtlURL = URL.createObjectURL(mtlBlob);

    new MTLLoader().load(mtlURL, (materials) => {
      materials.preload();

      const objBlob = new Blob([model.obj], { type: "text/plain" });
      const objURL = URL.createObjectURL(objBlob);

      return new OBJLoader()
        .setMaterials(materials)
        .load(objURL, (objectGroup) => {
          setObj(objectGroup);

          URL.revokeObjectURL(objURL);
          URL.revokeObjectURL(mtlURL);
        });
    });
  }, [model.obj, model.mtl]);

  console.log(obj);

  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;

    m.rotation.y = Math.sin(clock.getElapsedTime());
  });

  return (
    <>
      <ambientLight />
      {!!obj && (
        <mesh ref={mesh} position={[0, -2, 1.1]} rotation={[0.3, 0, 0]}>
          <primitive object={obj} scale={0.02} />
        </mesh>
      )}
    </>
  );
};

const Loader: React.FC = () => {
  const { progress } = useProgress();
  return <Html center>{progress} % loaded</Html>;
};
