/**
 * Scene environment: lights, grid, and axes helper.
 */

import React from 'react';
import { Grid } from '@react-three/drei';

interface SceneEnvironmentProps {
  showGrid: boolean;
}

export const SceneEnvironment: React.FC<SceneEnvironmentProps> = React.memo(
  ({ showGrid }) => {
    return (
      <>
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[50, 80, 50]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-30, 40, -30]} intensity={0.3} />

        {showGrid && (
          <Grid
            args={[1000, 1000]}
            cellSize={10}
            cellThickness={0.5}
            cellColor="#333333"
            sectionSize={50}
            sectionThickness={1}
            sectionColor="#555555"
            fadeDistance={500}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid
          />
        )}
      </>
    );
  },
);

SceneEnvironment.displayName = 'SceneEnvironment';
