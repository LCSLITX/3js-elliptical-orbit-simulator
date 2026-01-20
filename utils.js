import * as THREE from 'three';

export const SCENE = new THREE.Scene();

export const X_AXIS = new THREE.Vector3(1, 0, 0);
export const Y_AXIS = new THREE.Vector3(0, 1, 0);
export const Z_AXIS = new THREE.Vector3(0, 0, 1);

export const GRID_HELPER = new THREE.GridHelper(10, 10, 0x444444, 0x444444);
export const AXES_HELPER = new THREE.AxesHelper(2);

export const NUM_POINTS = 50; // number of points that compose each circle/ellipse.

export const WHITE = new THREE.Color(0xffffff);
export const YELLOW = new THREE.Color(0xffff00);

export const MAIN_COLOR = new THREE.Color(0xff0000);
export const SECONDARY_COLOR = new THREE.Color(0xADADAD);
export const TERTIARY_COLOR = new THREE.Color(0x75ff75);
export const QUATERNARY_COLOR = new THREE.Color(0x33ff33);

export const SCENE_BACKGROUND_COLOR = new THREE.Color(0x000000);

export const OPACITY = 0.4;
