import {
  resizeAspectRatio,
  setupText,
  updateText,
  Axes,
} from "../util/util.js";
import { Shader, readShaderFile } from "../util/shader.js";

// Global variables
let isInitialized = false; // global variable로 event listener가 등록되었는지 확인
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");
let shader;
let vao;
let positionBuffer;
let isDrawing = false;
let startPoint = null;
let tempEndPoint = null;
let lines = [];
let textOverlay;
let textOverlay2;
let textOverlay3;
let axes = new Axes(gl, 0.85);
let intersections;

let circleCenter;
let circleRadius;
let mode = 0;

// mouse 쓸 때 main call 방법
document.addEventListener("DOMContentLoaded", () => {
  if (isInitialized) {
    console.log("Already initialized");
    return;
  }

  main()
    .then((success) => {
      // call main function
      if (!success) {
        console.log("프로그램을 종료합니다.");
        return;
      }
      isInitialized = true;
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

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.7, 0.8, 0.9, 1.0);

  return true;
}

function setupCanvas() {
  canvas.width = 700;
  canvas.height = 700;
  resizeAspectRatio(gl, canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.1, 0.2, 0.3, 1.0);
}

function setupBuffers(shader) {
  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);
}

// 좌표 변환 함수: 캔버스 좌표를 WebGL 좌표로 변환
// 캔버스 좌표: 캔버스 좌측 상단이 (0, 0), 우측 하단이 (canvas.width, canvas.height)
// WebGL 좌표 (NDC): 캔버스 좌측 상단이 (-1, 1), 우측 하단이 (1, -1)
function convertToWebGLCoordinates(x, y) {
  return [(x / canvas.width) * 2 - 1, -((y / canvas.height) * 2 - 1)];
}

/* 
    browser window
    +----------------------------------------+
    | toolbar, address bar, etc.             |
    +----------------------------------------+
    | browser viewport (컨텐츠 표시 영역)       | 
    | +------------------------------------+ |
    | |                                    | |
    | |    canvas                          | |
    | |    +----------------+              | |
    | |    |                |              | |
    | |    |      *         |              | |
    | |    |                |              | |
    | |    +----------------+              | |
    | |                                    | |
    | +------------------------------------+ |
    +----------------------------------------+

    *: mouse click position

    event.clientX = browser viewport 왼쪽 경계에서 마우스 클릭 위치까지의 거리
    event.clientY = browser viewport 상단 경계에서 마우스 클릭 위치까지의 거리
    rect.left = browser viewport 왼쪽 경계에서 canvas 왼쪽 경계까지의 거리
    rect.top = browser viewport 상단 경계에서 canvas 상단 경계까지의 거리

    x = event.clientX - rect.left  // canvas 내에서의 클릭 x 좌표
    y = event.clientY - rect.top   // canvas 내에서의 클릭 y 좌표
*/

function setupMouseEvents() {
  function handleMouseDown(event) {
    event.preventDefault(); // 존재할 수 있는 기본 동작을 방지
    event.stopPropagation(); // event가 상위 요소로 전파되지 않도록 방지

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (!isDrawing) {
      let [glX, glY] = convertToWebGLCoordinates(x, y);
      if (mode == 0) {
        circleCenter = [glX, glY];
        isDrawing = true;
      } else if (mode == 1) {
        startPoint = [glX, glY];
        isDrawing = true;
      }
    }
  }

  function handleMouseMove(event) {
    if (isDrawing) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      let [glX, glY] = convertToWebGLCoordinates(x, y);
      if (mode == 0) {
        circleRadius = Math.sqrt(
          Math.pow(circleCenter[0] - glX, 2) +
            Math.pow(circleCenter[1] - glY, 2)
        );
      } else if (mode == 1) {
        tempEndPoint = [glX, glY];
      }
      render();
    }
  }

  function handleMouseUp() {
    if (isDrawing && (tempEndPoint || circleRadius)) {
      // lines.push([...startPoint, ...tempEndPoint])
      //   : startPoint와 tempEndPoint를 펼쳐서 하나의 array로 합친 후 lines에 추가
      // ex) lines = [] 이고 startPoint = [1, 2], tempEndPoint = [3, 4] 이면,
      //     lines = [[1, 2, 3, 4]] 이 됨
      // ex) lines = [[1, 2, 3, 4]] 이고 startPoint = [5, 6], tempEndPoint = [7, 8] 이면,
      //     lines = [[1, 2, 3, 4], [5, 6, 7, 8]] 이 됨

      // lines.push([...startPoint, ...tempEndPoint]);

      if (mode == 0) {
        for (let i = 0; i < 100; i++) {
          lines.push([
            circleCenter[0] +
              circleRadius * Math.sin(((2 * Math.PI) / 100) * i),
            circleCenter[1] +
              circleRadius * Math.cos(((2 * Math.PI) / 100) * i),
            circleCenter[0] +
              circleRadius * Math.sin(((2 * Math.PI) / 100) * (i + 1)),
            circleCenter[1] +
              circleRadius * Math.cos(((2 * Math.PI) / 100) * (i + 1)),
          ]);
        }
        mode = 1;

        updateText(
          textOverlay,
          "Circle: center (" +
            circleCenter[0].toFixed(2) +
            ", " +
            circleCenter[1].toFixed(2) +
            ") radius = " +
            circleRadius.toFixed(2)
        );
      } else {
        updateText(
          textOverlay2,
          "Line segment: (" +
            lines[1][0].toFixed(2) +
            ", " +
            lines[1][1].toFixed(2) +
            ") ~ (" +
            lines[1][2].toFixed(2) +
            ", " +
            lines[1][3].toFixed(2) +
            ")"
        );
        lines.push([...startPoint, ...tempEndPoint]);

        const dx = tempEndPoint[0] - startPoint[0];
        const dy = tempEndPoint[1] - startPoint[1];

        const fx = startPoint[0] - circleCenter[0];
        const fy = startPoint[1] - circleCenter[1];

        // 선분 파라미터 t에 대한 2차 방정식 계수: a*t^2 + b*t + c = 0
        const a = dx * dx + dy * dy;
        const b = 2 * (fx * dx + fy * dy);
        const c = fx * fx + fy * fy - circleRadius * circleRadius;

        // 판별식
        const discriminant = b * b - 4 * a * c;

        intersections = [];
        if (discriminant >= 0) {
          const sqrtDiscriminant = Math.sqrt(discriminant);

          const t1 = (-b + sqrtDiscriminant) / (2 * a);
          const t2 = (-b - sqrtDiscriminant) / (2 * a);

          if (t1 >= 0 && t1 <= 1) {
            const ix1 = startPoint[0] + t1 * dx;
            const iy1 = startPoint[1] + t1 * dy;
            intersections.push([ix1, iy1]);
          }
          if (t2 >= 0 && t2 <= 1 && t1 !== t2) {
            const ix2 = startPoint[0] + t2 * dx;
            const iy2 = startPoint[1] + t2 * dy;
            intersections.push([ix2, iy2]);
          }
        }
        mode = 2;
      }

      isDrawing = false;
      startPoint = null;
      tempEndPoint = null;
      render();
    }
  }

  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  shader.use();

  // 저장된 선들 그리기
  let num = 0;
  for (let line of lines) {
    if (num < 100) {
      shader.setVec4("u_color", [1.0, 0.0, 1.0, 1.0]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.LINES, 0, 2);
    } else {
      shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.LINES, 0, 2);
    }
    num++;
  }

  // 임시 선 그리기
  if (isDrawing) {
    if (mode == 0 && circleCenter && circleRadius) {
      shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]);
      const tmpCircle = [];
      for (let i = 0; i < 100; i++) {
        tmpCircle.push([
          circleCenter[0] + circleRadius * Math.sin(((2 * Math.PI) / 100) * i),
          circleCenter[1] + circleRadius * Math.cos(((2 * Math.PI) / 100) * i),
          circleCenter[0] +
            circleRadius * Math.sin(((2 * Math.PI) / 100) * (i + 1)),
          circleCenter[1] +
            circleRadius * Math.cos(((2 * Math.PI) / 100) * (i + 1)),
        ]);
      }
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(tmpCircle.flat()),
        gl.STATIC_DRAW
      );
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.LINES, 0, 200);
    }
    if (mode == 1 && startPoint && tempEndPoint) {
      shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); // 임시 선분의 color는 회색
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([...startPoint, ...tempEndPoint]),
        gl.STATIC_DRAW
      );
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.LINES, 0, 2);
    }
  }

  if (mode == 2) {
    if (intersections.length == 0) {
      updateText(textOverlay3, "No intersections");
    } else {
      if (intersections.length == 1) {
        updateText(
          textOverlay3,
          `Intersection Points: 1 Point 1: (${intersections[0][0].toFixed(
            2
          )}, ${intersections[0][1].toFixed(2)})`
        );
      } else {
        updateText(
          textOverlay3,
          `Intersection Points: 2 Point 1: (${intersections[0][0].toFixed(
            2
          )}, ${intersections[0][1].toFixed(
            2
          )}) Point 2: (${intersections[1][0].toFixed(
            2
          )}, ${intersections[1][1].toFixed(2)})`
        );
      }
    }
  }

  // axes 그리기
  axes.draw(mat4.create(), mat4.create());
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

    // 셰이더 초기화
    shader = await initShader();

    // 나머지 초기화
    setupCanvas();
    setupBuffers(shader);
    shader.use();

    // 텍스트 초기화
    textOverlay = setupText(canvas, "", 1);
    textOverlay2 = setupText(canvas, "", 2);
    textOverlay3 = setupText(canvas, "", 3);

    // 마우스 이벤트 설정
    setupMouseEvents();

    // 초기 렌더링
    render();

    return true;
  } catch (error) {
    console.error("Failed to initialize program:", error);
    alert("프로그램 초기화에 실패했습니다.");
    return false;
  }
}
