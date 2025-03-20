/*----------------------------------------------------------------------------
05_ShaderClass.js

1) Use Shader class to create a shader program (see ../util/shader.js)
2) Separate the shader sources as independent files (see shVert.glsl and shFrag.glsl)
3) Introduce the second attribute (colors) in the vertex data 
-----------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText } from "../util/util.js";
import { Shader, readShaderFile } from "../util/shader.js";

// Global variables
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");
let shader = null;
let vao = null;
let dLocation = null;
let dy = 0;
let dx = 0;

// Initialize WebGL stuffs
function initWebGL() {
  if (!gl) {
    console.error("WebGL 2 is not supported by your browser.");
    return false;
  }

  // Set canvas dimensions
  canvas.width = 600;
  canvas.height = 600;

  // Initialize WebGL settings
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1.0);

  return true;
}

// Set canvas dimensions and WebGL settings
function setupCanvas() {
  // add resize handler
  resizeAspectRatio(gl, canvas);

  // set viewport (the first time)
  gl.viewport(0, 0, canvas.width, canvas.height);

  // set the background color
  gl.clearColor(0, 0, 0, 1.0);
}

// Create and setup buffers
function setupBuffers(shader) {
  const vertices = new Float32Array([
    -0.1, -0.1, 0, -0.1, 0.1, 0, 0.1, 0.1, 0, 0.1, -0.1, 0,
  ]);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  shader.setAttribPointer(
    "aPos",
    3,
    gl.FLOAT,
    false,
    3 * Float32Array.BYTES_PER_ELEMENT,
    0
  );

  return vao;
}

// Render function
function render(vao) {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform2fv(dLocation, [dx, dy]);
  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
  requestAnimationFrame(() => render(vao));
}

// Loading the shader source files
async function initShader() {
  const vertexShaderSource = await readShaderFile("shVert.glsl");
  const fragmentShaderSource = await readShaderFile("shFrag.glsl");
  return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

// Main function
async function main() {
  try {
    shader = await initShader();
    setupText(canvas, "Use arrow keys to move the rectangle", 1);
    dLocation = gl.getUniformLocation(shader.program, "d");
    setupCanvas();
    vao = setupBuffers(shader);
    shader.use();
    render(vao);
    return true;
  } catch (error) {
    console.error("Failed to initialize program:", error);
    alert("프로그램 초기화에 실패했습니다.");
    return false;
  }
}

if (!initWebGL()) {
  throw new Error("WebGL 초기화 실패");
}

window.addEventListener("keydown", (event) => {
  // 아래 if condition을 if (event.key in keys)로 간단히 할 수도 있음
  if (event.key === "ArrowUp") {
    if (dy >= 0.9) return;
    else dy += 0.01;
  } else if (event.key === "ArrowDown") {
    if (dy <= -0.9) return;
    else dy -= 0.01;
  } else if (event.key === "ArrowLeft") {
    if (dx <= -0.9) return;
    else dx -= 0.01;
  } else if (event.key === "ArrowRight") {
    if (dx >= 0.9) return;
    else dx += 0.01;
  }
});

main()
  .then((success) => {
    if (!success) {
      console.log("프로그램을 종료합니다.");
      return; // 단순히 종료
    }
  })
  .catch((error) => {
    console.error("프로그램 실행 중 오류 발생:", error);
  });
