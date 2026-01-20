import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import { FlatSurfaceEllipseScene } from './flat_surface_ellipse';
import { TransformedEllipseScene } from './transformed_ellipse';
import { OrbitAroundSphereScene } from './orbit_around_sphere';
import { keplerianOrbitScene, animateOrbit } from './propagate_keplerian_orbit'
import { SCENE_BACKGROUND_COLOR } from './utils';
import { gui } from './debug';


// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);


// CAMERA CONFIGS
const frustumSize = 3; // Defines the visible area
const aspect = window.innerWidth / window.innerHeight;


// CAMERA
const globalCamera = new THREE.OrthographicCamera(
    frustumSize * aspect / -2,
    frustumSize * aspect / 2,
    frustumSize / 2,
    frustumSize / -2,
    0.1,
    100
);
globalCamera.position.set(5, 5, 10);
globalCamera.lookAt(0, 0, 0);


// CAMERA CONTROLS
const cameraControls = new OrbitControls(globalCamera, renderer.domElement);
cameraControls.minZoom = 0.4;
cameraControls.maxZoom = 0.8;
cameraControls.enableDamping = true;


// LISTENERS
const handleResize = () => {
    globalCamera.left = - frustumSize * aspect / 2;
    globalCamera.right = frustumSize * aspect / 2;
    globalCamera.top = frustumSize / 2;
    globalCamera.bottom = - frustumSize / 2;

    globalCamera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

const handleKeyEvents = (event) => {
    if (event.defaultPrevented) {
        return; // Do nothing if the event was already processed
    }

    switch (event.key.toLowerCase()) {
        case "p":
            if (selector > 0) selector--;  
            break;

        case "n":
            if (selector < scenes.length - 1) selector++;  
            break;

        case "d":
            gui.show(gui._hidden)

        default:
            return;
    }

    console.log(selector, event.key)

    event.preventDefault();
}

window.addEventListener('resize', handleResize);
window.addEventListener('keydown', handleKeyEvents);


// SCENES
let globalScene = new THREE.Scene();
const scenes = [ FlatSurfaceEllipseScene, TransformedEllipseScene, OrbitAroundSphereScene, keplerianOrbitScene ]
let selector = 0;


function animate() {
    globalScene.clear();
  
    globalScene.background = SCENE_BACKGROUND_COLOR;

    globalScene = scenes[selector]();

    if (selector === 3) {
        animateOrbit();
    }

    cameraControls.update();
    renderer.render(globalScene, globalCamera);
    window.requestAnimationFrame(animate);
}

animate();