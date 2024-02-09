import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import "./style.css";

const CANVAS = document.getElementById("canvas");
const SIZES = { width: window.innerWidth, height: window.innerHeight };

window.addEventListener("resize", handleResize);

// Create the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  SIZES.width / SIZES.height,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ canvas: CANVAS });

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(SIZES.width, SIZES.height);

camera.position.set(50, -20, -20);
camera.fov = 20; 
camera.updateProjectionMatrix();

// Moon
const moonTexture = new THREE.TextureLoader().load("./images/moon.jpg");
const geometry = new THREE.SphereGeometry(5, 64, 64);
const material = new THREE.MeshStandardMaterial({ map: moonTexture });
const moon = new THREE.Mesh(geometry, material);
scene.add(moon);
moon.position.set(-50, 10, 0);
moon.scale.set(3, 3, 3);
camera.lookAt(moon.position);

// Ambient light
const ambientLight = new THREE.AmbientLight(0x404040, 0.75);
scene.add(ambientLight);

// Directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(12, 4, 4);
scene.add(directionalLight);

// Create OrbitControls for camera movement
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enableRotate = false;
controls.enableDamping = true;
controls.minDistance = 8;
controls.maxDistance = 150;
controls.zoomSpeed = 0.5;

// Stars field
const stars = [];
const starCount = SIZES.width * 6;
for (let i = 0; i < starCount; i++) {
  const x = (Math.random() - 0.5) * 2000;
  const y = (Math.random() - 0.5) * 2000;
  const z = (Math.random() - 0.5) * 2000;
  stars.push(x, y, z);
}
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(stars, 3)
);
const starMaterial = new THREE.PointsMaterial({ size: 2 });
const starField = new THREE.Points(starGeometry, starMaterial);
scene.add(starField);

// Start the animation loop
animate();

function animate() {
  requestAnimationFrame(animate);

  moon.rotation.y += 0.003; 

  /*Floating effect
  let time = Date.now() * 0.0005;
  moon.position.y += Math.sin(time) * 0.02;
  */
  renderer.render(scene, camera);
}


function handleResize() {
  SIZES.width = window.innerWidth;
  SIZES.height = window.innerHeight;

  camera.aspect = SIZES.width / SIZES.height;
  camera.updateProjectionMatrix();
  renderer.setSize(SIZES.width, SIZES.height);
}

// Enable mouse rotation
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isDragging = false;
let previousMousePosition = {
  x: 0,
  y: 0
};

canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
});

document.addEventListener('mouseup', (e) => {
  isDragging = false;
});

document.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(moon);

  canvas.style.cursor = intersects.length > 0 ? 'pointer' : '';

  if (isDragging) {
      let deltaMove = {
          x: e.offsetX - previousMousePosition.x,
          y: e.offsetY - previousMousePosition.y,
      };

      let deltaRotationQuaternion = new THREE.Quaternion()
          .setFromEuler(new THREE.Euler(
              0,
              toRadians(deltaMove.x * 0.3), 
              0,
              'XYZ'
          ));

      moon.quaternion.multiplyQuaternions(deltaRotationQuaternion, moon.quaternion);
  }

  previousMousePosition = {
      x: e.offsetX,
      y: e.offsetY,
  };
});

function toRadians(angle) {
  return angle * (Math.PI / 180);
}




