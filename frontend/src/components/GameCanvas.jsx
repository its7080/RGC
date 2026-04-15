import React from 'react';

export function GameCanvas({ phase }) {
  return (
    <div className="panel">
      <h3>3D Game Canvas (WebGL Shell)</h3>
      <p>
        Integrate Three.js/Babylon.js scene here. Current animation phase: <strong>{phase || 'idle'}</strong>
      </p>
      <div className="canvas-placeholder">3D Scene Placeholder</div>
    </div>
  );
}
