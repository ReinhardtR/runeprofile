import { Html, useProgress } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef, useState } from "react";
import { BufferGeometry, Material, Mesh, MeshStandardMaterial } from "three";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";

type PlayerModelProps = {
  modelUri: string;
};

export const PlayerModel: React.FC<PlayerModelProps> = ({ modelUri }) => {
  return (
    <Canvas>
      <Suspense fallback={<Loader />}>
        <Model modelUri={modelUri} />
      </Suspense>
    </Canvas>
  );
};

type ModelProps = PlayerModelProps;

const Model: React.FC<ModelProps> = ({ modelUri }) => {
  const mesh = useRef<Mesh<BufferGeometry, Material | Material[]>>(null);
  const [object, setObject] =
    useState<Mesh<BufferGeometry, MeshStandardMaterial>>();
  const [oldUrl, setOldUrl] = useState<string>();

  if (object == null || oldUrl !== modelUri) {
    new PLYLoader().load(modelUri, (geometry) => {
      geometry.computeVertexNormals();

      const material = new MeshStandardMaterial({
        vertexColors: true,
      });

      const m = new Mesh(geometry, material);
      m.rotateX(-1.55);
      m.rotateZ(0.1);

      setObject(m);
      setOldUrl(modelUri);
    });
  }

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    mesh.current.rotation.y = Math.sin(clock.getElapsedTime());
  });

  return (
    <>
      {object && (
        <>
          <ambientLight intensity={2.5} />
          <mesh ref={mesh} scale={0.028} position={[0, -3, 0]}>
            <primitive object={object} />
          </mesh>
        </>
      )}
    </>
  );
};

const Loader: React.FC = () => {
  const { progress } = useProgress();
  return (
    <Html center className="font-runescape text-osrs-yellow">
      {progress}%
    </Html>
  );
};
