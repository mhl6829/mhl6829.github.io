/*-----------------------------------------------------------------------------------
13_Texture.js

- Viewing a 3D unit octahedron at origin with perspective projection
- Rotating the octahedron by ArcBall interface (by left mouse button dragging)
- Applying image texture (../images/textures/woodWall2.png) to each face of the octahedron
-----------------------------------------------------------------------------------*/

import { resizeAspectRatio, Axes } from "../util/util.js";
import { Shader, readShaderFile } from "../util/shader.js";
import { Octahedron } from "./regularOctahedron.js";
import { Arcball } from "../util/arcball.js";
import { loadTexture } from "../util/texture.js";
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");
let shader;

let isInitialized = false;

let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create();
const axes = new Axes(gl, 1.5); // create an Axes object with the length of axis 1.5
const texture = loadTexture(gl, true, "./sunrise.jpg"); // see ../util/texture.js
const octahedron = new Octahedron(gl);

const v0 = [0, 0.5];
const v1 = [0.25, 0.5];
const v2 = [0.5, 0.5];
const v3 = [0.75, 0.5];
const v4 = [1, 0.5];
const v5 = [0.5, 1];
const v6 = [0.5, 0];

octahedron.texCoords = new Float32Array([
  // F1
  ...v0,
  ...v1,
  ...v5,
  // F2
  ...v1,
  ...v2,
  ...v5,
  // F3
  ...v2,
  ...v3,
  ...v5,
  // F4
  ...v3,
  ...v4,
  ...v5,
  // F5
  ...v0,
  ...v1,
  ...v6,
  // F6
  ...v1,
  ...v2,
  ...v6,
  // F7
  ...v2,
  ...v3,
  ...v6,
  // F8
  ...v3,
  ...v4,
  ...v6,
]);
octahedron.initBuffers();

// Arcball object: initial distance 5.0, rotation sensitivity 2.0, zoom sensitivity 0.0005
// default of rotation sensitivity = 1.5, default of zoom sensitivity = 0.001
const arcball = new Arcball(canvas, 5.0, { rotation: 2.0, zoom: 0.0005 });

document.addEventListener("DOMContentLoaded", () => {
  if (isInitialized) {
    console.log("Already initialized");
    return;
  }

  main()
    .then((success) => {
      if (!success) {
        console.log("program terminated");
        return;
      }
      isInitialized = true;
    })
    .catch((error) => {
      console.error("program terminated with error:", error);
    });
});

function initWebGL() {
  if (!gl) {
    console.error("WebGL 2 is not supported by your browser.");
    return false;
  }

  canvas.width = 700;
  canvas.height = 700;
  resizeAspectRatio(gl, canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.7, 0.8, 0.9, 1.0);

  return true;
}

async function initShader() {
  const vertexShaderSource = await readShaderFile("shVert.glsl");
  const fragmentShaderSource = await readShaderFile("shFrag.glsl");
  return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function render() {
  // clear canvas
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  // get view matrix from the arcball
  const viewMatrix = arcball.getViewMatrix();

  // drawing the octahedron
  shader.use(); // using the octahedron's shader
  shader.setMat4("u_model", modelMatrix);
  shader.setMat4("u_view", viewMatrix);
  shader.setMat4("u_projection", projMatrix);
  octahedron.draw(shader);

  // drawing the axes (using the axes's shader: see util.js)
  axes.draw(viewMatrix, projMatrix);

  // call the render function the next time for animation
  requestAnimationFrame(render);
}

async function main() {
  try {
    if (!initWebGL()) {
      throw new Error("WebGL 초기화 실패");
    }

    shader = await initShader();

    // View transformation matrix (camera at (0,0,-3), invariant in the program)
    mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -3));

    // Projection transformation matrix (invariant in the program)
    mat4.perspective(
      projMatrix,
      glMatrix.toRadian(60), // field of view (fov, degree)
      canvas.width / canvas.height, // aspect ratio
      0.1, // near
      100.0 // far
    );

    // bind the texture to the shader
    gl.activeTexture(gl.TEXTURE0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    shader.setInt("u_texture", 0);

    // call the render function the first time for animation
    requestAnimationFrame(render);

    return true;
  } catch (error) {
    console.error("Failed to initialize program:", error);
    alert("Failed to initialize program");
    return false;
  }
}
