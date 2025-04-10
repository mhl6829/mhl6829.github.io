export class Pyramid {
  constructor(gl) {
    this.gl = gl;

    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();
    this.ebo = gl.createBuffer();

    const v0 = [-0.5, 0.0, 0.5];
    const v1 = [0.5, 0.0, 0.5];
    const v2 = [0.5, 0.0, -0.5];
    const v3 = [-0.5, 0.0, -0.5];
    const v4 = [0.0, 1.0, 0.0];

    // Pyramid geometry
    this.vertices = new Float32Array([
      // Base
      ...v0,
      ...v1,
      ...v2,
      ...v2,
      ...v3,
      ...v0,
      // Front
      ...v0,
      ...v1,
      ...v4,
      // Right
      ...v1,
      ...v2,
      ...v4,
      // Back
      ...v2,
      ...v3,
      ...v4,
      // Left
      ...v3,
      ...v0,
      ...v4,
    ]);

    const n0 = [0, -1, 0];

    this.normals = new Float32Array([
      // Base normals (down)
      ...n0,
      ...n0,
      ...n0,
      ...n0,
      ...n0,
      ...n0,

      // Front face normal (approximate)
      0,
      0.5,
      1,
      0,
      0.5,
      1,
      0,
      0.5,
      1,

      // Right face normal
      1,
      0.5,
      0,
      1,
      0.5,
      0,
      1,
      0.5,
      0,

      // Back face normal
      0,
      0.5,
      -1,
      0,
      0.5,
      -1,
      0,
      0.5,
      -1,

      // Left face normal
      -1,
      0.5,
      0,
      -1,
      0.5,
      0,
      -1,
      0.5,
      0,
    ]);

    this.colors = new Float32Array([
      // Base (blue)
      0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1,

      // Front face - red
      1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1,

      // Right face - yellow
      1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1,

      // Back face - magenta
      1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1,

      // Left face - cyan
      0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1,
    ]);

    this.texCoords = new Float32Array([
      // Base (6 vertices)
      0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0,

      // Front
      0.5, 0, 1, 0.5, 0.5, 1,

      // Right
      0.5, 0, 1, 0.5, 0.5, 1,

      // Back
      0.5, 0, 1, 0.5, 0.5, 1,

      // Left
      0.5, 0, 1, 0.5, 0.5, 1,
    ]);

    this.indices = new Uint16Array([
      // Base (2 triangles)
      0, 1, 2, 3, 4, 5,

      // Sides (4 triangles)
      6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
    ]);

    this.initBuffers();
  }

  initBuffers() {
    const gl = this.gl;

    const vSize = this.vertices.byteLength;
    const nSize = this.normals.byteLength;
    const cSize = this.colors.byteLength;
    const tSize = this.texCoords.byteLength;
    const totalSize = vSize + nSize + cSize + tSize;

    gl.bindVertexArray(this.vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
    gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
    gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize, this.colors);
    gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize + cSize, this.texCoords);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); // position
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, vSize); // normal
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, vSize + nSize); // color
    gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, vSize + nSize + cSize); // texCoord

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);
    gl.enableVertexAttribArray(3);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  draw(shader) {
    const gl = this.gl;
    shader.use();
    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }

  delete() {
    const gl = this.gl;
    gl.deleteBuffer(this.vbo);
    gl.deleteBuffer(this.ebo);
    gl.deleteVertexArray(this.vao);
  }
}
