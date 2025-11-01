import * as THREE from 'three';
import * as lilgui from 'lil-gui';

// LINES
let ellipseLine, circleLine;

const constants = {}
constants.a = 1.0; // semi-major axis
constants.e = 1.0 / Math.sqrt(2); // eccentricity
constants.b = constants.a * Math.sqrt(1.0 - constants.e * constants.e); // semi-minor axis
constants.c = constants.e * constants.a; // distance from the center to a focus
constants.numPoints = 80;
constants.ellipseColor = 0xffffff;
constants.circleColor = 0x00ff00;

// CONTROLS
const gui = new lilgui.GUI();
gui.add(constants, 'a').name('semi-major axis (a)').min(0).max(3).step(0.01).onFinishChange();
gui.add(constants, 'b').name('semi-minor axis (b)').min(-1).max(1).step(0.01).onFinishChange();
gui.add(constants, 'e').name('eccentricity (e)').min(-1).max(1).step(0.01).onFinishChange();
gui.add(constants, 'c').name('center distance (c)').min(-1).max(1).step(0.01).onFinishChange();
gui.add(constants, 'numPoints').min(5).max(100).step(1).onFinishChange();
gui.addColor(constants, 'ellipseColor');
gui.addColor(constants, 'circleColor');

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);


function createLinesGeometry() {
  
  scene.remove(ellipseLine, circleLine)

  const ellipsePoints = [];
  const circlePoints = [];

  for (let i = 0; i < constants.numPoints; i++) {
      const u = -Math.PI + (i / (constants.numPoints - 1)) * (2 * Math.PI); // 'u' is the Eccentric Anomaly
      const cos_u = Math.cos(u);
      const sin_u = Math.sin(u);

      const x_ellipse = constants.a * (cos_u - constants.e);
      const y_ellipse = constants.b * sin_u; 
      ellipsePoints.push(new THREE.Vector3(x_ellipse, y_ellipse, 0));

      const x_circle = constants.a * cos_u - constants.c;
      const y_circle = constants.a * sin_u;
      circlePoints.push(new THREE.Vector3(x_circle, y_circle, 0));
  }

  // Create the Three.js geometry from the points
  const ellipseGeometry = new THREE.BufferGeometry().setFromPoints(ellipsePoints);
  const ellipseMaterial = new THREE.LineBasicMaterial({ color: constants.ellipseColor }); // White
  ellipseLine = new THREE.Line(ellipseGeometry, ellipseMaterial);
  scene.add(ellipseLine);

  const circleGeometry = new THREE.BufferGeometry().setFromPoints(circlePoints);
  const circleMaterial = new THREE.LineBasicMaterial({ color: constants.circleColor }); // Green
  circleLine = new THREE.Line(circleGeometry, circleMaterial);
  scene.add(circleLine);

  // HELPERS
  scene.add(new THREE.GridHelper(10, 10, 0x444444, 0x444444));
  scene.add(new THREE.AxesHelper(1));

  return scene;
}

export {
  scene,
  createLinesGeometry,
}