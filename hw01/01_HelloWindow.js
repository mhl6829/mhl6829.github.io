// Global constants
const canvas = document.getElementById('glCanvas'); // Get the canvas element 
const gl = canvas.getContext('webgl2'); // Get the WebGL2 context

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}

canvas.width = 500;
canvas.height = 500;

const clearViewport = (x, y, height, width, r, g, b, a) => {
    gl.viewport(x, y, height, width);
    gl.scissor(x, y, height, width);
    gl.enable(gl.SCISSOR_TEST);
    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.SCISSOR_TEST);
}

// Render loop
function render() {
    clearViewport(0, canvas.height / 2, canvas.width / 2, canvas.height / 2, 1, 0, 0, 1);
    clearViewport(canvas.width / 2, canvas.height / 2, canvas.width / 2, canvas.height / 2, 0, 1, 0, 1);
    clearViewport(0, 0, canvas.width / 2, canvas.height / 2, 0, 0, 1, 1);
    clearViewport(canvas.width / 2, 0, canvas.width / 2, canvas.height / 2, 1, 1, 0, 1);
}

// Start rendering
render();

// Resize viewport when window size changes
window.addEventListener('resize', () => {
    tmp = Math.min(window.innerWidth, window.innerHeight)
    canvas.width = tmp;
    canvas.height = tmp;
    gl.viewport(0, 0, canvas.width, canvas.height);
    render();
});