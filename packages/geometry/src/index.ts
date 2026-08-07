/**
 * Analytical geometry package.
 * Etapa 0: placeholder — wall_box mesh lands in Etapa 1.
 */

export type MeshBuffer = {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
};

export function emptyMesh(): MeshBuffer {
  return {
    positions: new Float32Array(0),
    normals: new Float32Array(0),
    indices: new Uint32Array(0),
  };
}
