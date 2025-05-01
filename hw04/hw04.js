import { resizeAspectRatio, Axes } from "../util/util.js";
import { Shader, readShaderFile } from "../util/shader.js";

let isInitialized = false;
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");
let shader;
let cubeVAO;
let finalSunTransform;
let finalEarthTransform;
let finalMoonTransform;
const rotation = {
  sun_rotation: 0,
  earth_rotation: 0,
  earth_revolution: 0,
  moon_rotation: 0,
  moon_revolution: 0,
};
let lastTime = 0;
let axes;

document.addEventListener("DOMContentLoaded", () => {
  if (isInitialized) {
    console.log("Already initialized");
    return;
  }

  main()
    .then((success) => {
      if (!success) {
        console.log("프로그램을 종료합니다.");
        return;
      }
      isInitialized = true;
      requestAnimationFrame(animate);
    })
    .catch((error) => {
      console.error("프로그램 실행 중 오류 발생:", error);
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
  gl.clearColor(0.2, 0.3, 0.4, 1.0);

  return true;
}

function setupCubeBuffers(shader) {
  const cubeVertices = new Float32Array([
    -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5,
  ]);

  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

  cubeVAO = gl.createVertexArray();
  gl.bindVertexArray(cubeVAO);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
  shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  gl.bindVertexArray(null);
}

const genTransformMat = (f, ...rest) => {
  const tmp = mat4.create();
  f(tmp, tmp, ...rest);
  return tmp;
};

function applySunTransform() {
  finalSunTransform = mat4.create();
  [
    [mat4.translate, [0, 0, 0]],
    [mat4.rotate, rotation.sun_rotation, [0, 0, 1]],
    [mat4.scale, [0.2, 0.2, 1]],
  ].forEach((args) => {
    mat4.multiply(
      finalSunTransform,
      genTransformMat(...args),
      finalSunTransform
    );
  });
}

function applyEarthTransform() {
  finalEarthTransform = mat4.create();
  mat4.rotate(
    finalEarthTransform,
    finalEarthTransform,
    rotation.earth_revolution,
    [0, 0, 1]
  );
  mat4.translate(finalEarthTransform, finalEarthTransform, [0.7, 0, 0]);
  mat4.rotate(
    finalEarthTransform,
    finalEarthTransform,
    rotation.earth_rotation,
    [0, 0, 1]
  );
  mat4.scale(finalEarthTransform, finalEarthTransform, [0.1, 0.1, 1]);
  /*
  mat4.rotate(
    finalEarthTransform,
    finalEarthTransform,
    rotation.earth_revolution,
    [0, 0, 1]
  );
  mat4.translate(finalEarthTransform, finalEarthTransform, [0.7, 0, 0]);
  mat4.rotate(
    finalEarthTransform,
    finalEarthTransform,
    rotation.earth_rotation,
    [0, 0, 1]
  );
  mat4.scale(finalEarthTransform, finalEarthTransform, [0.1, 0.1, 1]);
  */
  /*
  [
    [mat4.scale, [0.1, 0.1, 1]],
    [mat4.rotate, rotation.earth_rotation, [0, 0, 1]],
    [mat4.translate, [0.7, 0, 0]],
    [mat4.rotate, rotation.earth_revolution, [0, 0, 1]],
  ].forEach((args) => {
    mat4.multiply(
      finalEarthTransform,
      genTransformMat(...args),
      finalEarthTransform
    );
  });
  */
}

function applyMoonTransform() {
  finalMoonTransform = mat4.create();
  [
    [mat4.scale, [0.05, 0.05, 1]],
    [mat4.rotate, rotation.moon_rotation, [0, 0, 1]],
    [mat4.translate, [0.2, 0, 0]],
    [mat4.rotate, rotation.moon_revolution, [0, 0, 1]],
    [mat4.translate, [0.7, 0, 0]],
    [mat4.rotate, rotation.earth_revolution, [0, 0, 1]],
  ].forEach((args) => {
    mat4.multiply(
      finalMoonTransform,
      genTransformMat(...args),
      finalMoonTransform
    );
  });
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  // 축 그리기
  axes.draw(mat4.create(), mat4.create());
  shader.use();

  // 해 그리기
  shader.setMat4("u_transform", finalSunTransform);
  shader.setVec4("a_color", [1.0, 0.0, 0.0, 1.0]);
  gl.bindVertexArray(cubeVAO);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

  // 지구 그리기
  shader.setMat4("u_transform", finalEarthTransform);
  shader.setVec4("a_color", [0.0, 1.0, 1.0, 1.0]);
  gl.bindVertexArray(cubeVAO);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

  // 달 그리기
  shader.setMat4("u_transform", finalMoonTransform);
  shader.setVec4("a_color", [1.0, 1.0, 0.0, 1.0]);
  gl.bindVertexArray(cubeVAO);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}

function animate(currentTime) {
  if (!lastTime) lastTime = currentTime;
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  rotation.sun_rotation += (Math.PI / 4) * deltaTime;
  rotation.earth_rotation += Math.PI * deltaTime;
  rotation.earth_revolution += (Math.PI / 6) * deltaTime;
  rotation.moon_rotation += Math.PI * deltaTime;
  rotation.moon_revolution += Math.PI * 2 * deltaTime;

  applySunTransform();
  applyEarthTransform();
  applyMoonTransform();

  render();
  requestAnimationFrame(animate);
}

async function initShader() {
  const vertexShaderSource = await readShaderFile("shVert.glsl");
  const fragmentShaderSource = await readShaderFile("shFrag.glsl");
  return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
  try {
    if (!initWebGL()) {
      throw new Error("WebGL 초기화 실패");
    }

    finalSunTransform = mat4.create();

    shader = await initShader();
    setupCubeBuffers(shader);

    axes = new Axes(gl, 0.8);

    return true;
  } catch (error) {
    console.error("Failed to initialize program:", error);
    alert("프로그램 초기화에 실패했습니다.");
    return false;
  }
}
