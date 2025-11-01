import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls, clock;
let satellite, orbitLine;

// --- Parameters from the R article ---
const a = 1.0; // Semi-major axis
const e = 1.0 / Math.sqrt(2); // Eccentricity
const b = a * Math.sqrt(1.0 - Math.pow(e, 2)); // Semi-minor axis
const c = e * a; // Distance from center to focus

// Rotation angles from the article
// Note: The article's "pitch, yaw, roll" are a specific Y-Z-X rotation
const pitchAngle = Math.PI / 5; // Inclination (around Y)
const yawAngle = Math.PI / 4;   // Longitude of Asc. Node (around Z)
const rollAngle = Math.PI / 4;  // Argument of Periapsis (around X)

// Create the specific Euler rotation order (YZX) used in the R code
const eulerRotation = new THREE.Euler(rollAngle, pitchAngle, yawAngle, 'YZX');

// Animation parameters
const T = 120; // Period in seconds
const n = (2.0 * Math.PI) / T; // Mean motion
const tau = 0; // Time of pericenter passage

init();
animate();

function init() {
    // Scene
    scene = new THREE.Scene();
    clock = new THREE.Clock();

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(1.5, 1.5, 1.5);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lights
    scene.add(new THREE.AmbientLight(0x888888));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    // Helpers
    scene.add(new THREE.AxesHelper(2));
    scene.add(new THREE.GridHelper(10, 10, 0x444444, 0x444444));

    // --- Create the Scene Objects ---

    // 1. Draw the static orbit path
    drawOrbitPath();
    
    // 2. Draw the central body and focus
    drawCentralBody();

    // 3. Create the satellite
    const satelliteGeo = new THREE.SphereGeometry(0.04, 16, 16);
    const satelliteMat = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    satellite = new THREE.Mesh(satelliteGeo, satelliteMat);
    scene.add(satellite);

    // Handle window resizing
    window.addEventListener('resize', onWindowResize);
}

/**
 * Generates the 3D orbit line, replicating the R code's logic.
 */
function drawOrbitPath() {
    const points = [];
    const numPoints = 100;

    for (let i = 0; i <= numPoints; i++) {
        const E = (i / numPoints) * 2 * Math.PI; // Eccentric Anomaly
        const cose = Math.cos(E);
        const sine = Math.sin(E);

        // Position in the 2D orbital (perifocal) plane
        // This logic is from the 'propagate' function, which is the correct
        // physical model (rather than the article's first simple plot)
        const x_p = a * (cose - e);
        const y_p = b * sine; // b = a * sqrt(1 - e*e)
        const z_p = 0;

        const vec = new THREE.Vector3(x_p, y_p, z_p);
        
        // Apply the exact same Y-Z-X rotation as the R code
        vec.applyEuler(eulerRotation);

        points.push(vec);
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    orbitLine = new THREE.Line(geometry, material);
    scene.add(orbitLine);
}

/**
 * Draws the central blue sphere and the red focus point,
 * identical to the R code's 'spheres3d' calls.
 */
function drawCentralBody() {
    // Central Body (at origin)
    const blueGeo = new THREE.SphereGeometry(0.1, 32, 32);
    const blueMat = new THREE.MeshPhongMaterial({ color: 0x0000ff });
    const centralBody = new THREE.Mesh(blueGeo, blueMat);
    scene.add(centralBody);

    // Focus point (at -c, 0, 0) and then rotated
    const focusPoint = new THREE.Vector3(-c, 0, 0);
    focusPoint.applyEuler(eulerRotation); // Apply same rotation

    const redGeo = new THREE.SphereGeometry(0.02, 16, 16);
    const redMat = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const focusMesh = new THREE.Mesh(redGeo, redMat);
    focusMesh.position.copy(focusPoint);
    scene.add(focusMesh);
}

// --- Keplerian Propagation Logic (Ported from R) ---

/**
 * Solves Kepler's equation M = E - e*sin(E) for E.
 * This is a direct JavaScript port of the R code's 'KeplerSolve'
 * and its helper functions (eps3, KeplerStart3).
 */
function keplerSolve(e, M) {
    const tol = 1.0e-14;
    const Mnorm = M % (2 * Math.PI);

    // Helper functions nested for clarity
    function keplerStart3(e, M) {
        const t34 = e * e;
        const t35 = e * t34;
        const t33 = Math.cos(M);
        return M + (-0.5 * t35 + e + (t34 + 1.5 * t33 * t35) * t33) * Math.sin(M);
    }

    function eps3(e, M, x) {
        const t1 = Math.cos(x);
        const t2 = -1 + e * t1;
        const t3 = Math.sin(x);
        const t4 = e * t3;
        const t5 = -x + t4 + M;
        const t6 = t5 / (0.5 * t5 * t4 / t2 + t2);
        return t5 / ((0.5 * t3 - (1/6) * t1 * t6) * e * t6 + t2);
    }

    let E0 = keplerStart3(e, Mnorm);
    let dE = tol + 1;
    let count = 0;

    while (dE > tol) {
        const E = E0 - eps3(e, Mnorm, E0);
        dE = Math.abs(E - E0);
        E0 = E;
        count++;
        if (count == 100) {
            console.error("KeplerSolve failed to converge!");
            break;
        }
    }
    return E0;
}

/**
 * Calculates the 3D position of the satellite at a given time 't'.
 * This is a direct port of the R 'propagate' function.
 */
function propagate(clockTime) {
    const M = n * (clockTime - tau); // Mean Anomaly
    const E = keplerSolve(e, M); // Eccentric Anomaly
    
    const cose = Math.cos(E);
    const sine = Math.sin(E);

    // Position in the 2D orbital (perifocal) plane
    const x_p = a * (cose - e);
    const y_p = b * sine; // b = a * sqrt(1 - e*e)
    const z_p = 0;

    const position = new THREE.Vector3(x_p, y_p, z_p);
    
    // Apply the same Y-Z-X rotation as the R code
    position.applyEuler(eulerRotation);
    
    return position;
}

// --- Animation Loop ---

function animate() {
    requestAnimationFrame(animate);

    const t = clock.getElapsedTime();
    
    // Get the satellite's position at the current time
    const satellitePosition = propagate(t);
    satellite.position.copy(satellitePosition);

    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
