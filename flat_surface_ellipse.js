import * as THREE from 'three';
import { SCENE, GRID_HELPER, AXES_HELPER, NUM_POINTS, SECONDARY_COLOR, MAIN_COLOR } from './utils';
import { gui } from './debug';


const constants = {
    a: 1.0, // semi-major axis
    e: 1.0 / Math.sqrt(2), // eccentricity
    
    // Dependent variables
    b: 0, // semi-minor axis
    c: 0, // distance from the center to a focus

    numPoints: NUM_POINTS,
    
    circleColor: SECONDARY_COLOR,
    ellipseColor: MAIN_COLOR,
};

const g = gui.addFolder('Scene 1 - Flat Ellipse');
g.add(constants, 'a');
g.add(constants, 'e');
g.add(constants, 'b');
g.add(constants, 'c');
g.add(constants, 'numPoints');
g.addColor(constants, 'circleColor');
g.addColor(constants, 'ellipseColor');
g.close();

// LINES
let ellipseLine, circleLine;


function FlatSurfaceEllipseScene() {

    constants.b = constants.a * Math.sqrt(1.0 - constants.e * constants.e);
    constants.c = constants.e * constants.a;
  
    SCENE.remove(ellipseLine, circleLine);

    const ellipsePoints = [];
    const circlePoints = [];

    for (let i = 0; i < constants.numPoints; i++) {
        const u = -Math.PI + (i / (constants.numPoints - 1)) * (2 * Math.PI); // u is Eccentric Anomaly
        const cos_u = Math.cos(u);
        const sin_u = Math.sin(u);

        const x_ellipse = constants.a * (cos_u - constants.e);
        const y_ellipse = constants.b * sin_u;
        const z_ellipse = 0;
        ellipsePoints.push(new THREE.Vector3(x_ellipse, y_ellipse, z_ellipse));

        const x_circle = constants.a * (cos_u - constants.c);
        const y_circle = constants.a * sin_u;
        const z_circle = 0;
        circlePoints.push(new THREE.Vector3(x_circle, y_circle, z_circle));
    }

    const ellipseGeometry = new THREE.BufferGeometry().setFromPoints(ellipsePoints);
    const ellipseMaterial = new THREE.LineBasicMaterial({ color: constants.ellipseColor });
    ellipseLine = new THREE.Line(ellipseGeometry, ellipseMaterial);
    SCENE.add(ellipseLine);

    const circleGeometry = new THREE.BufferGeometry().setFromPoints(circlePoints);
    const circleMaterial = new THREE.LineBasicMaterial({ color: constants.circleColor });
    circleLine = new THREE.Line(circleGeometry, circleMaterial);
    SCENE.add(circleLine);

    // Helpers
    SCENE.add(GRID_HELPER);
    SCENE.add(AXES_HELPER);

    return SCENE;
}


export {
  FlatSurfaceEllipseScene,
}