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
let keyPressed = 0;

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
  if (keyPressed != 0) {
    switch (keyPressed) {
      case 1:
        dy = Math.min(0.9, dy + 0.01);
        break;
      case 2:
        dy = Math.max(-0.9, dy - 0.01);
        break;
      case 3:
        dx = Math.min(0.9, dx + 0.01);
        break;
      case 4:
        dx = Math.max(-0.9, dx - 0.01);
        break;
    }
  }

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
  switch (event.key) {
    case "ArrowUp":
      keyPressed = 1;
      break;
    case "ArrowDown":
      keyPressed = 2;
      break;
    case "ArrowRight":
      keyPressed = 3;
      break;
    case "ArrowLeft":
      keyPressed = 4;
      break;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key == "ArrowUp" || event.key == "ArrowDown" || event.key == "ArrowRight" || event.key == "ArrowLeft") {
    keyPressed = 0;
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
