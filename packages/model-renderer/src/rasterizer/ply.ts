export type ParsedModel = {
  /** x,y,z per vertex */
  positions: Int16Array;
  /** r,g,b per vertex */
  colors: Uint8Array;
  /** triangulated vertex indices, 3 per face */
  indices: Uint32Array;
};

/**
 * Parses the PLY files produced by the RuneProfile plugin:
 * binary little-endian, vertices as int16 x/y/z + uint8 r/g/b,
 * faces as a uint8 count followed by int16 indices.
 */
export function parsePly(data: ArrayBuffer | Uint8Array): ParsedModel {
  const bytes =
    data instanceof Uint8Array
      ? data
      : new Uint8Array(data);

  const headerText = new TextDecoder("latin1").decode(
    bytes.subarray(0, Math.min(bytes.length, 2048)),
  );
  const headerEnd = headerText.indexOf("end_header");
  if (headerEnd === -1) {
    throw new Error("Invalid PLY: missing end_header");
  }
  if (!headerText.includes("binary_little_endian")) {
    throw new Error("Invalid PLY: expected binary_little_endian format");
  }

  const vertexCount = Number(headerText.match(/element vertex (\d+)/)?.[1]);
  const faceCount = Number(headerText.match(/element face (\d+)/)?.[1]);
  if (!Number.isFinite(vertexCount) || !Number.isFinite(faceCount)) {
    throw new Error("Invalid PLY: missing vertex/face counts");
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = headerText.indexOf("\n", headerEnd) + 1;

  const positions = new Int16Array(vertexCount * 3);
  const colors = new Uint8Array(vertexCount * 3);
  for (let i = 0; i < vertexCount; i++) {
    positions[i * 3] = view.getInt16(offset, true);
    positions[i * 3 + 1] = view.getInt16(offset + 2, true);
    positions[i * 3 + 2] = view.getInt16(offset + 4, true);
    colors[i * 3] = bytes[offset + 6]!;
    colors[i * 3 + 1] = bytes[offset + 7]!;
    colors[i * 3 + 2] = bytes[offset + 8]!;
    offset += 9;
  }

  // Faces are mostly triangles; triangulate anything larger as a fan.
  const indices: number[] = [];
  for (let i = 0; i < faceCount; i++) {
    const count = bytes[offset]!;
    offset += 1;
    const first = view.getInt16(offset, true);
    for (let t = 1; t + 1 < count; t++) {
      indices.push(
        first,
        view.getInt16(offset + t * 2, true),
        view.getInt16(offset + (t + 1) * 2, true),
      );
    }
    offset += count * 2;
  }

  return { positions, colors, indices: new Uint32Array(indices) };
}
