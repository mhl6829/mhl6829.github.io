import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

// scene and cameras
const scene = new THREE.Scene();
const aspect = window.innerWidth / window.innerHeight;
const perspectiveCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 500);
perspectiveCamera.position.set(0, 50, 150);

const frustumSize = 200;
const orthoCamera = new THREE.OrthographicCamera(
  (frustumSize * aspect) / -2,
  (frustumSize * aspect) / 2,
  frustumSize / 2,
  frustumSize / -2,
  0.1,
  500
);
orthoCamera.position.copy(perspectiveCamera.position);

let camera = perspectiveCamera;

// renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// stats
const stats = new Stats();
document.body.appendChild(stats.dom);

// controls
let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;

// GUI
const gui = new GUI();
const cameraFolder = gui.addFolder("Camera");
const camParams = { type: "Perspective" };
cameraFolder
  .add(camParams, "type", ["Perspective", "Orthographic"])
  .name("Type")
  .onChange((val) => {
    // switch cameras
    camera = val === "Perspective" ? perspectiveCamera : orthoCamera;
    controls.dispose();
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
  });
cameraFolder.open();

// lights
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff);
dirLight.position.set(5, 12, 8);
dirLight.castShadow = true;
scene.add(dirLight);

// texture loader
const textureLoader = new THREE.TextureLoader();

// Sun
const sunGeo = new THREE.SphereGeometry(10, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
scene.add(sunMesh);

// planets configuration
const planets = [];
const data = [
  {
    name: "Mercury",
    radius: 1.5,
    distance: 20,
    color: "#a6a6a6",
    texture: "Mercury.jpg",
    rotationSpeed: 0.02,
    orbitSpeed: 0.02,
  },
  {
    name: "Venus",
    radius: 3,
    distance: 35,
    color: "#e39e1c",
    texture: "Venus.jpg",
    rotationSpeed: 0.015,
    orbitSpeed: 0.015,
  },
  {
    name: "Earth",
    radius: 3.5,
    distance: 50,
    color: "#3498db",
    texture: "Earth.jpg",
    rotationSpeed: 0.01,
    orbitSpeed: 0.01,
  },
  {
    name: "Mars",
    radius: 2.5,
    distance: 65,
    color: "#c0392b",
    texture: "Mars.jpg",
    rotationSpeed: 0.008,
    orbitSpeed: 0.008,
  },
];

data.forEach((cfg) => {
  // create orbit group
  const orbitGroup = new THREE.Object3D();
  scene.add(orbitGroup);
  // load texture and create mesh
  const geo = new THREE.SphereGeometry(cfg.radius, 32, 32);
  const tex = textureLoader.load(cfg.texture);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.8,
    metalness: 0.2,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(cfg.distance, 0, 0);
  mesh.castShadow = true;
  orbitGroup.add(mesh);
  // store for animation
  planets.push({
    name: cfg.name,
    mesh,
    orbitGroup,
    color: cfg.color,
    rotationSpeed: cfg.rotationSpeed,
    orbitSpeed: cfg.orbitSpeed,
  });
  // GUI controls
  const folder = gui.addFolder(cfg.name);
  folder
    .add(planets[planets.length - 1], "rotationSpeed", 0, 0.1, 0.001)
    .name("Rotation Speed");
  folder
    .add(planets[planets.length - 1], "orbitSpeed", 0, 0.1, 0.001)
    .name("Orbit Speed");
  folder.open();
});

// handle resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// animation loop
function animate() {
  stats.update();
  controls.update();
  planets.forEach((p) => {
    p.mesh.rotation.y += p.rotationSpeed;
    p.orbitGroup.rotation.y += p.orbitSpeed;
  });
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
