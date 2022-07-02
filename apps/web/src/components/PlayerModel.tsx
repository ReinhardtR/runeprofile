import {
  Center,
  Html,
  OrbitControls,
  Stage,
  useProgress,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { Group } from "three";
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
    <div className="h-[500px] w-[250px]">
      <Canvas>
        <Suspense fallback={<Loader />}>
          <Stage intensity={1}>
            <Model model={model} />
          </Stage>
          <OrbitControls />
        </Suspense>
      </Canvas>
    </div>
  );
};

type ModelProps = PlayerModelProps;

const Model: React.FC<ModelProps> = ({ model }) => {
  const [obj, setObj] = useState<Group>();

  useEffect(() => {
    const mtlBlob = new Blob([model.mtl], { type: "text/plain" });
    const mtlURL = URL.createObjectURL(mtlBlob);

    const objBlob = new Blob([model.obj], { type: "text/plain" });
    const objURL = URL.createObjectURL(objBlob);

    new MTLLoader().load(mtlURL, (materials) => {
      materials.preload();

      new OBJLoader().setMaterials(materials).load(objURL, (object) => {
        setObj(object);
      });
    });
  }, [model]);

  return <>{obj && <primitive object={obj} scale={0.025} />}</>;
};

const Loader: React.FC = () => {
  const { progress } = useProgress();
  return <Html center>{progress} % loaded</Html>;
};
