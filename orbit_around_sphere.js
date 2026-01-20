import * as THREE from 'three';
import { SCENE, X_AXIS, Y_AXIS, Z_AXIS, GRID_HELPER, AXES_HELPER, NUM_POINTS, SECONDARY_COLOR, YELLOW, MAIN_COLOR, OPACITY } from './utils';
import { gui } from './debug';


const constants = {
    a: 1.0, // semi-major axis
    e: 1.0 / Math.sqrt(2), // eccentricity
    
    // Dependent variables
    b: 0, // semi-minor axis
    c: 0, // distance from the center to a focus
    
    // Rotation angles
    raan: Math.PI / 4,        // Roll, about X; RAAN - Right Ascension of the Ascending Node
    inclination: Math.PI / 5, // Pitch, about Y
    omega: Math.PI / 4,       // Yaw, about Z

    centralBodyColor: YELLOW,
    raanColor: SECONDARY_COLOR,
    focusColor: MAIN_COLOR,

    numPoints: NUM_POINTS,
};

const g = gui.addFolder('Scene 3 - Orbit around Sphere');
g.add(constants, 'a');
g.add(constants, 'e');
g.add(constants, 'b');
g.add(constants, 'c');
g.add(constants, 'raan');
g.add(constants, 'inclination');
g.add(constants, 'omega');
g.add(constants, 'numPoints');
g.addColor(constants, 'centralBodyColor');
g.addColor(constants, 'raanColor');
g.addColor(constants, 'focusColor');
g.close();


// LINES
let raanLine;

// MESHES
let focusMesh;


function OrbitAroundSphereScene() {
    
    constants.b = constants.a * Math.sqrt(1.0 - constants.e * constants.e);
    constants.c = constants.e * constants.a;
  
    const centralBodyGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const centralBodyMaterial = new THREE.MeshBasicMaterial({ color: constants.centralBodyColor });
    const centralBody = new THREE.Mesh(centralBodyGeometry, centralBodyMaterial);
    SCENE.add(centralBody);
  
    const lines = [raanLine];
    for (const line of lines) {
        if (line) {
            SCENE.remove(line);
            line.geometry.dispose();
            line.material.dispose();
        }
    }
    if (focusMesh) {
        SCENE.remove(focusMesh);
        focusMesh.geometry.dispose();
        focusMesh.material.dispose();
    }

    const raanPoints = [];
    
    for (let i = 0; i <= constants.numPoints; i++) {
        const u = -Math.PI + (i / constants.numPoints) * (2 * Math.PI);
        const cos_u = Math.cos(u);
        const sin_u = Math.sin(u);

        const x_ellipse = constants.a * (cos_u - constants.e);
        const y_ellipse = constants.b * sin_u; 
        
        const flatVec = new THREE.Vector3(x_ellipse, y_ellipse, 0);

        // R: # Pitch ~ inclination, tilt about the y axis. (x.inc)
        const inclinedVec = flatVec.clone().applyAxisAngle(Y_AXIS, constants.inclination);

        // R: # Yaw ~ longitude of the ascending node (omega) (x.om)
        const omegaVec = inclinedVec.clone().applyAxisAngle(Z_AXIS, constants.omega);

        // R: # Roll ~ Right ascension of the ascending node (RAAN) (x.raan)
        const raanVec = omegaVec.clone().applyAxisAngle(X_AXIS, constants.raan);
        raanPoints.push(raanVec);
    }

    raanLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(raanPoints),
        new THREE.LineBasicMaterial({ color: constants.raanColor, opacity: OPACITY, transparent: true })
    );
    SCENE.add(raanLine);

    const focusVec = new THREE.Vector3(-constants.c, 0, 0);
    focusVec.applyAxisAngle(Y_AXIS, constants.inclination);
    focusVec.applyAxisAngle(Z_AXIS, constants.omega);
    focusVec.applyAxisAngle(X_AXIS, constants.raan);
    
    const focusGeo = new THREE.SphereGeometry(0.02, 16, 16);
    const focusMat = new THREE.MeshBasicMaterial({ color: constants.focusColor });
    focusMesh = new THREE.Mesh(focusGeo, focusMat);
    focusMesh.position.copy(focusVec);
    SCENE.add(focusMesh);

    // Helpers
    SCENE.add(GRID_HELPER);
    SCENE.add(AXES_HELPER);

    return SCENE;
}


export {
    OrbitAroundSphereScene,
}