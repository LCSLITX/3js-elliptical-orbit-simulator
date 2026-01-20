import * as THREE from 'three';
import { SCENE, X_AXIS, Y_AXIS, Z_AXIS, GRID_HELPER, AXES_HELPER, NUM_POINTS, YELLOW, MAIN_COLOR, SECONDARY_COLOR, OPACITY } from './utils';
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
    
    // Propagation Parameters
    T: 120, // Period in seconds
    tau: 0, // Time of pericenter passage
    n: (2.0 * Math.PI) / 120, // Mean motion (n = 2*pi/T)

    centralBodyColor: YELLOW,
    satelliteColor: MAIN_COLOR,
    orbitLineColor: SECONDARY_COLOR,
    focusColor: SECONDARY_COLOR,
    
    numPoints: NUM_POINTS,
};

const g = gui.addFolder('Scene 4 - Orbit propagation');
g.add(constants, 'a');
g.add(constants, 'e');
g.add(constants, 'b');
g.add(constants, 'c');
g.add(constants, 'raan');
g.add(constants, 'inclination');
g.add(constants, 'omega');
g.add(constants, 'numPoints');
g.addColor(constants, 'centralBodyColor');
g.addColor(constants, 'satelliteColor');
g.addColor(constants, 'orbitLineColor');
g.addColor(constants, 'focusColor');
g.close();


// LINES
let orbitLine;

// MESHES
let focusMesh;

// OBJECTS
let satellite;

// CLOCK
let clock = new THREE.Clock(); // Start the clock!

function keplerianOrbitScene() {

    constants.b = constants.a * Math.sqrt(1.0 - constants.e * constants.e);
    constants.c = constants.e * constants.a;

    const centralBodyGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const centralBodyMaterial = new THREE.MeshBasicMaterial({ color: constants.centralBodyColor });
    const centralBody = new THREE.Mesh(centralBodyGeometry, centralBodyMaterial);
    SCENE.add(centralBody);

    const satelliteGeometry = new THREE.SphereGeometry(0.04, 16, 16);
    const satelliteMaterial = new THREE.MeshBasicMaterial({ color: constants.satelliteColor });
    satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
    SCENE.add(satellite);

    const pathPoints = [];
  
    for (let i = 0; i <= constants.numPoints; i++) {
        const E = -Math.PI + (i / constants.numPoints) * (2 * Math.PI); // Eccentric Anomaly
        const cos_E = Math.cos(E);
        const sin_E = Math.sin(E);

        // 2D perifocal coordinates
        const x_p = constants.a * (cos_E - constants.e);
        const y_p = constants.b * sin_E;
        
        const vec = new THREE.Vector3(x_p, y_p, 0);

        // Apply all 3 rotations
        vec.applyAxisAngle(Y_AXIS, constants.inclination);
        vec.applyAxisAngle(Z_AXIS, constants.omega);
        vec.applyAxisAngle(X_AXIS, constants.raan);
        
        pathPoints.push(vec);
    }

    orbitLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pathPoints),
        new THREE.LineBasicMaterial({ color: constants.orbitLineColor, opacity: OPACITY, transparent: true })
    );
    SCENE.add(orbitLine);
    
    const focusVec = new THREE.Vector3(-constants.c, 0, 0);
    focusVec.applyAxisAngle(Y_AXIS, constants.inclination);
    focusVec.applyAxisAngle(Z_AXIS, constants.omega);
    focusVec.applyAxisAngle(X_AXIS, constants.raan);
    
    const focusGeo = new THREE.SphereGeometry(0.02, 16, 16);
    const focusMat = new THREE.MeshBasicMaterial({ color: constants.focusColor, opacity: OPACITY, transparent: true });
    focusMesh = new THREE.Mesh(focusGeo, focusMat);
    focusMesh.position.copy(focusVec);
    SCENE.add(focusMesh);

    // Helpers
    SCENE.add(GRID_HELPER);
    SCENE.add(AXES_HELPER);

    return SCENE;
}


function keplerSolve(e, M) {
    const tol = 1.0e-14;
    const Mnorm = M % (2 * Math.PI);

    // Helper functions nested for clarity (ported from R)
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
 */
function propagate(clockTime) {
    const M = constants.n * (clockTime - constants.tau); // Mean Anomaly
    
    const E = keplerSolve(constants.e, M); // Eccentric Anomaly
    
    const cos_E = Math.cos(E);
    const sin_E = Math.sin(E);

    // R: r = a*(1 - e * cose)
    // Note: The R code calculates 'r' but uses a different formula
    // for x/y. We will use the more standard perifocal formulas
    // which are equivalent.
    
    // R: s.x <- r * ((cose - e)/(1 - e * cose))
    // R: s.y <- r * ((sqrt(1 - e^2)*sin(E))/(1 - e * cose))
    // These simplify to:
    const x_p = constants.a * (cos_E - constants.e);
    const y_p = constants.b * sin_E;
    
    const position = new THREE.Vector3(x_p, y_p, 0);
    
    position.applyAxisAngle(Y_AXIS, constants.inclination);
    
    position.applyAxisAngle(Z_AXIS, constants.omega);
    
    position.applyAxisAngle(X_AXIS, constants.raan);
    
    return position;
}

function animateOrbit() {
    window.requestAnimationFrame(animateOrbit);

    const t = clock.getElapsedTime();
    
    // Get the satellite's position at the current time
    const satellitePosition = propagate(t);
    
    satellite.position.copy(satellitePosition); // Update the green sphere's position
}

export {
  keplerianOrbitScene,
  propagate,
  animateOrbit,
}