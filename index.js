import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createLinesGeometry } from './flat_surface_ellipse';

let globalScene = new THREE.Scene();

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// CAMERA CONFIGS
const frustumSize = 3; // Defines the visible area
const aspect = window.innerWidth / window.innerHeight;

// CAMERA
const camera = new THREE.OrthographicCamera(
  // To replicate R's 2D plot, we use an OrthographicCamera
  frustumSize * aspect / -2,
  frustumSize * aspect / 2,
  frustumSize / 2,
  frustumSize / -2,
  0.1,
  100
);
camera.position.set(0, 0, 10);
camera.lookAt(0, 0, 0);
// CAMERA CONTROLS
const cameraControls = new OrbitControls(camera, renderer.domElement);
cameraControls.enableDamping = true;

// LISTENERS
const handleResize = () => {
  camera.left = - frustumSize * aspect / 2;
  camera.right = frustumSize * aspect / 2;
  camera.top = frustumSize / 2;
  camera.bottom = - frustumSize / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

const handleSceneChange = (event) => {
  if (event.defaultPrevented) {
    return; // Do nothing if the event was already processed
  }


  switch (event.key) {
    case "ArrowLeft":
      console.log(event.key)
      break;

    case "ArrowRight":
      console.log(event.key)
      break;

    default:
      return;
  }

  event.preventDefault();
}

window.addEventListener('resize', handleResize);

//
window.addEventListener('keydown', handleSceneChange);


function animate() {
  globalScene.clear();
  globalScene = createLinesGeometry();
  cameraControls.update();
  renderer.render(globalScene, camera);
  window.requestAnimationFrame(animate);
}


animate();