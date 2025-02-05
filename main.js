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
    // Initial positioning
    gridGroup.position.set(0, 1.6, -1.5);
});

// Create VR button and center button
const vrButton = VRButton.createButton(renderer);
document.body.appendChild(renderer.domElement);
document.body.appendChild(vrButton);

// Add center grid button
const centerButton = document.createElement('button');
centerButton.textContent = 'Center Grid';
centerButton.style.position = 'fixed';
centerButton.style.bottom = '20px';
centerButton.style.right = '20px'; // Position on right side
centerButton.style.padding = '10px 20px';
centerButton.style.backgroundColor = '#00ff00';
centerButton.style.color = 'black';
centerButton.style.border = 'none';
centerButton.style.borderRadius = '5px';
centerButton.style.cursor = 'pointer';
centerButton.style.zIndex = '999';
centerButton.style.fontFamily = 'Arial, sans-serif';
centerButton.style.fontSize = '13px';
centerButton.style.fontWeight = 'bold';

// Style VR button to ensure it stays on the left
vrButton.style.left = '20px';
vrButton.style.right = 'auto';

// Center grid function
function centerGrid() {
    if (renderer.xr.isPresenting) {
        const session = renderer.xr.getSession();
        const viewerPose = renderer.xr.getFrame().getViewerPose(renderer.xr.getReferenceSpace());
        
        if (viewerPose) {
            const view = viewerPose.views[0];
            const viewMatrix = view.transform.matrix;
            
            // Extract position and direction from view matrix
            const position = new THREE.Vector3();
            const quaternion = new THREE.Quaternion();
            const scale = new THREE.Vector3();
            
            // Decompose view matrix
            new THREE.Matrix4().fromArray(viewMatrix).decompose(position, quaternion, scale);
            
            // Position grid 1.5 meters in front of user
            const forward = new THREE.Vector3(0, 0, -1.5);
            forward.applyQuaternion(quaternion);
            
            // Set grid position
            gridGroup.position.copy(position).add(forward);
            gridGroup.position.y = 1.6; // Maintain comfortable height
            
            // Make grid face user
            gridGroup.lookAt(position);
        }
    }
}

centerButton.addEventListener('click', centerGrid);
document.body.appendChild(centerButton);

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

// Animation with grid centering check
function animate() {
    renderer.setAnimationLoop(() => {
        const time = Date.now() * 0.001;
        
        // Very gentle vertical float
        const baseY = gridGroup.position.y;
        gridGroup.position.y = baseY + Math.sin(time * 0.3) * 0.02;
        
        // Extremely subtle rotations
        gridGroup.rotation.x = Math.sin(time * 0.2) * 0.03;
        gridGroup.rotation.y = Math.sin(time * 0.15) * 0.03;
        gridGroup.rotation.z = Math.cos(time * 0.25) * 0.02;
        
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
