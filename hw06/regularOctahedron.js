export class Octahedron {
  constructor(gl) {
    this.gl = gl;

    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();
    this.ebo = gl.createBuffer();

    // 6 unique positions for an octahedron
    const h = Math.sqrt(2) / 2;
    const v0 = [-0.5, 0.0, 0.5]; // front-left
    const v1 = [0.5, 0.0, 0.5]; // front-right
    const v2 = [0.5, 0.0, -0.5]; // back-right
    const v3 = [-0.5, 0.0, -0.5]; // back-left
    const v4 = [0.0, h, 0.0]; // top
    const v5 = [0.0, -h, 0.0]; // bottom

    // Duplicate vertices per face (8 faces × 3 vertices)
    this.vertices = new Float32Array([
      // Top pyramid (4 faces)
      ...v0,
      ...v1,
      ...v4,
      ...v1,
      ...v2,
      ...v4,
      ...v2,
      ...v3,
      ...v4,
      ...v3,
      ...v0,
      ...v4,
      // Bottom pyramid (4 faces)
      ...v0,
      ...v1,
      ...v5,
      ...v1,
      ...v2,
      ...v5,
      ...v2,
      ...v3,
      ...v5,
      ...v3,
      ...v0,
      ...v5,
    ]);

    // Simple flat normals per face (recomputed later)
    this.normals = new Float32Array(this.vertices.length);
    this.computeNormals();

    // Texture coordinates per face
    // For top faces: map base edge to texture bottom, apex to texture top-center
    // For bottom faces: map base edge to texture top, apex to texture bottom-center
    this.texCoords = new Float32Array([
      // Top front face (v0, v1, v4)
      0, 0, 1, 0, 0.5, 1,
      // Top right face (v1, v2, v4)
      0, 0, 1, 0, 0.5, 1,
      // Top back face  (v2, v3, v4)
      0, 0, 1, 0, 0.5, 1,
      // Top left face  (v3, v0, v4)
      0, 0, 1, 0, 0.5, 1,
      // Bottom front face (v0, v1, v5)
      0, 1, 1, 1, 0.5, 0,
      // Bottom right face (v1, v2, v5)
      0, 1, 1, 1, 0.5, 0,
      // Bottom back face  (v2, v3, v5)
      0, 1, 1, 1, 0.5, 0,
      // Bottom left face  (v3, v0, v5)
      0, 1, 1, 1, 0.5, 0,
    ]);

    // Colors (white)
    this.colors = new Float32Array((this.vertices.length / 3) * 4).fill(1.0);

    // Indices (optional, since we're drawing arrays)
    this.indices = new Uint16Array([...Array(24).keys()]);

    this.initBuffers();
  }

  computeNormals() {
    const p = this.vertices;
    const n = this.normals;
    // For every triangle
    for (let i = 0; i < p.length; i += 9) {
      const ax = p[i],
        ay = p[i + 1],
        az = p[i + 2];
      const bx = p[i + 3],
        by = p[i + 4],
        bz = p[i + 5];
      const cx = p[i + 6],
        cy = p[i + 7],
        cz = p[i + 8];
      const ux = bx - ax,
        uy = by - ay,
        uz = bz - az;
      const vx = cx - ax,
        vy = cy - ay,
        vz = cz - az;
      const nx = uy * vz - uz * vy;
      const ny = uz * vx - ux * vz;
      const nz = ux * vy - uy * vx;
      // assign same normal to all three
      for (let j = 0; j < 3; ++j) {
        n[i + j * 3] = nx;
        n[i + j * 3 + 1] = ny;
        n[i + j * 3 + 2] = nz;
      }
    }
    // normalize
    for (let i = 0; i < n.length; i += 3) {
      const lx = n[i],
        ly = n[i + 1],
        lz = n[i + 2];
      const len = Math.hypot(lx, ly, lz) || 1;
      n[i] = lx / len;
      n[i + 1] = ly / len;
      n[i + 2] = lz / len;
    }
  }

  initBuffers() {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);

    // Combined VBO
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    const vb = this.vertices.byteLength;
    const nb = this.normals.byteLength;
    const cb = this.colors.byteLength;
    const tb = this.texCoords.byteLength;
    gl.bufferData(gl.ARRAY_BUFFER, vb + nb + cb + tb, gl.STATIC_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
    gl.bufferSubData(gl.ARRAY_BUFFER, vb, this.normals);
    gl.bufferSubData(gl.ARRAY_BUFFER, vb + nb, this.colors);
    gl.bufferSubData(gl.ARRAY_BUFFER, vb + nb + cb, this.texCoords);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, vb);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, vb + nb);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, vb + nb + cb);

    // EBO
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  draw(shader) {
    shader.use();
    this.gl.bindVertexArray(this.vao);
    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.indices.length,
      this.gl.UNSIGNED_SHORT,
      0
    );
    this.gl.bindVertexArray(null);
  }

  delete() {
    const gl = this.gl;
    gl.deleteBuffer(this.vbo);
    gl.deleteBuffer(this.ebo);
    gl.deleteVertexArray(this.vao);
  }
}
