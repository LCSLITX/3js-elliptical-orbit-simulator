import * as THREE from 'three';
import { SCENE, X_AXIS, Y_AXIS, Z_AXIS, GRID_HELPER, AXES_HELPER, NUM_POINTS, SECONDARY_COLOR, MAIN_COLOR, OPACITY, TERTIARY_COLOR, QUATERNARY_COLOR } from './utils';
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

    numPoints: NUM_POINTS,

    flatColor: SECONDARY_COLOR,
    inclinedColor: MAIN_COLOR,
    omegaColor: MAIN_COLOR,
    raanColor: MAIN_COLOR,
};

const g = gui.addFolder('Scene 2 - Transformed Ellipse');
g.add(constants, 'a');
g.add(constants, 'e');
g.add(constants, 'b');
g.add(constants, 'c');
g.add(constants, 'raan');
g.add(constants, 'inclination');
g.add(constants, 'omega');
g.add(constants, 'numPoints');
g.addColor(constants, 'flatColor');
g.addColor(constants, 'inclinedColor');
g.addColor(constants, 'omegaColor');
g.addColor(constants, 'raanColor');
g.close();


// LINES
let flatLine, inclinedLine, omegaLine, raanLine;


function TransformedEllipseScene() {

    constants.b = constants.a * Math.sqrt(1.0 - constants.e * constants.e);
    constants.c = constants.e * constants.a;
    
    const lines = [flatLine, inclinedLine, omegaLine, raanLine];
    for (const line of lines) {
        if (line) {
            SCENE.remove(line);
            line.geometry.dispose();
            line.material.dispose();
        }
    }

    const flatPoints = [];
    const inclinedPoints = [];
    const omegaPoints = [];
    const raanPoints = [];
    
    for (let i = 0; i <= constants.numPoints; i++) {
        const u = -Math.PI + (i / constants.numPoints) * (2 * Math.PI);
        const cos_u = Math.cos(u);
        const sin_u = Math.sin(u);

        const x_ellipse = constants.a * (cos_u - constants.e);
        const y_ellipse = constants.b * sin_u; 
        
        const flatVec = new THREE.Vector3(x_ellipse, y_ellipse, 0);
        flatPoints.push(flatVec);

        // R: # Pitch ~ inclination, tilt about the y axis. (x.inc)
        const inclinedVec = flatVec.clone().applyAxisAngle(Y_AXIS, constants.inclination);
        inclinedPoints.push(inclinedVec);

        // R: # Yaw ~ longitude of the ascending node (omega) (x.om)
        const omegaVec = inclinedVec.clone().applyAxisAngle(Z_AXIS, constants.omega);
        omegaPoints.push(omegaVec);

        // R: # Roll ~ Right ascension of the ascending node (RAAN) (x.raan)
        const raanVec = omegaVec.clone().applyAxisAngle(X_AXIS, constants.raan);
        raanPoints.push(raanVec);
    }

    flatLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(flatPoints),
        new THREE.LineBasicMaterial({ color: constants.flatColor, opacity: OPACITY, transparent: true })
    );
    SCENE.add(flatLine);
    
    inclinedLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(inclinedPoints),
        new THREE.LineBasicMaterial({ color: constants.inclinedColor, opacity: OPACITY, transparent: true })
    );
    SCENE.add(inclinedLine);
    
    omegaLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(omegaPoints),
        new THREE.LineBasicMaterial({ color: constants.omegaColor, opacity: OPACITY, transparent: true })
    );
    SCENE.add(omegaLine);

    raanLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(raanPoints),
        new THREE.LineBasicMaterial({ color: constants.raanColor })
    );
    SCENE.add(raanLine);

    // Helpers
    SCENE.add(GRID_HELPER);
    SCENE.add(AXES_HELPER);

    return SCENE;
}

export {
  TransformedEllipseScene,
}