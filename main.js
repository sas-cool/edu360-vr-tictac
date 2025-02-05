import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

// Scene setup with better background
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x001100); // Very dark green background

// Camera adjustment for VR with better depth precision
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.5, 5);
camera.position.set(0, 1.6, 2.5);

// Renderer with optimized WebXR settings
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    logarithmicDepthBuffer: true, // Better depth precision
    precision: 'highp' // High precision
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;

// Handle VR session start
renderer.xr.addEventListener('sessionstart', () => {
    // Position grid in front of user when VR starts
    gridGroup.position.set(0, 1.6, -1.5);  // Height of average person, closer distance
});

// Create VR button with position reset
const vrButton = VRButton.createButton(renderer);
document.body.appendChild(renderer.domElement);
document.body.appendChild(vrButton);

// Optimize WebXR session settings
renderer.xr.setFramebufferScaleFactor(1.0); // Ensure full resolution

// Adjust reference space type for better stability
renderer.xr.setReferenceSpaceType('local-floor');

// Enhanced lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Brighter ambient
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Full brightness
directionalLight.position.set(0, 2, 4);
scene.add(directionalLight);

// Grid constants
const gridGroup = new THREE.Group();
const cellSize = 0.6;
const gap = 0.05;
const totalSize = (cellSize * 3) + (gap * 2);

// Create grid lines using LineSegments
const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x00ff00,
    linewidth: 2
});

// Create vertices for grid lines
const points = [];

// Vertical lines
for (let i = 0; i <= 3; i++) {
    const x = (i - 1.5) * cellSize;
    points.push(
        x, -cellSize * 1.5 + 1.6, -2,  // Start point
        x, cellSize * 1.5 + 1.6, -2    // End point
    );
}

// Horizontal lines
for (let i = 0; i <= 3; i++) {
    const y = (i - 1.5) * cellSize + 1.6;
    points.push(
        -cellSize * 1.5, y, -2,  // Start point
        cellSize * 1.5, y, -2    // End point
    );
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
const gridLines = new THREE.LineSegments(geometry, lineMaterial);
gridGroup.add(gridLines);
scene.add(gridGroup);

// Simple animation with gentle wobble
function animate() {
    renderer.setAnimationLoop(() => {
        const time = Date.now() * 0.001;
        
        // Very gentle vertical float
        gridGroup.position.y = 1.6 + Math.sin(time * 0.3) * 0.02;
        
        // Extremely subtle rotations
        gridGroup.rotation.x = Math.sin(time * 0.2) * 0.03; // Tilt forward/back
        gridGroup.rotation.y = Math.sin(time * 0.15) * 0.03; // Turn left/right
        gridGroup.rotation.z = Math.cos(time * 0.25) * 0.02; // Roll slightly
        
        renderer.render(scene, camera);
    });
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
