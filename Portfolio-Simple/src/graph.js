import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { addButtonClickEvent } from './buttonHandler.js'; // separate file for button events
import node1HTML from './node1.html?raw';
import node2HTML from './node2.html?raw';
import node3HTML from './node3.html?raw';
import node4HTML from './node4.html?raw';
import node5HTML from './node5.html?raw';
import node6HTML from './node6.html?raw';
import node7HTML from './node7.html?raw';
import node8HTML from './node8.html?raw';
import node9HTML from './node9.html?raw';

let camera, scene, renderer, controls;
let nodes = [];
let nodePositions = [];
let edges = [];
let zoomTarget = null;
let zoomProgress = 0;

const zoomDistance = 50; // desired distance from the node after zooming in (adjust as needed)
const sphereRadius = 130; // Radius of the sphere where nodes are placed

// Array of raw file paths to external HTML files for node content.
const nodeHTMLContents = [
node1HTML,
node2HTML,
node3HTML,
node4HTML,
node5HTML,
node6HTML,
node7HTML,
node8HTML,
node9HTML,
    // Add additional paths as needed…
  ];

document.addEventListener("DOMContentLoaded", async () => {
    init();
    await generateGraph();
    animate();
});

function init() {
    const container = document.getElementById('container');
    
    // Create Scene
    scene = new THREE.Scene();
    
    // Create Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 150);
    
    // Create CSS3D Renderer
    renderer = new CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    
    // Create OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Generate Graph with evenly spaced nodes
    generateGraph();
    
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('wheel', onScroll);
    
    // Add event listeners for nav-bar buttons (from separate file)
    addButtonClickEvent(nodes, zoomToNode);
}
  
  function createNode(nodeNumber, position) {
    const div = document.createElement('div');
    div.className = 'node';
    
    // Cycle through the imported HTML content if there are more nodes than content files.
    const content = nodeHTMLContents[(nodeNumber - 1) % nodeHTMLContents.length];
    
    // Combine the node number and the custom HTML content.
    div.innerHTML = `<div class="node-number">Node ${nodeNumber}</div>${content}`;
    
    // Basic styling (can be moved to CSS)
    div.style.padding = '10px';
    div.style.backgroundColor = 'rgba(255,255,255,0.8)';
    div.style.border = '1px solid black';
    div.style.textAlign = 'center';
    
    // Wrap in a CSS3DObject and set its position.
    const nodeObject = new CSS3DObject(div);
    nodeObject.position.copy(position);
    return nodeObject;
  }
  

 function generateGraph() {
    const numNodes = 10;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Approximately 2.399963
    
    for (let i = 0; i < numNodes; i++) {
        // Fibonacci sphere distribution calculations:
    // Calculate the Fibonacci sphere distribution for node positions:
    let y = 1 - (i / (numNodes - 1)) * 2;  // y goes from 1 to -1
    let radiusAtY = Math.sqrt(1 - y * y);
    let theta = goldenAngle * i;
    
    // Scale the unit vector to the desired sphere radius
    let x = Math.cos(theta) * radiusAtY * sphereRadius;
    let z = Math.sin(theta) * radiusAtY * sphereRadius;
    // Multiply y by sphereRadius as well if you want uniform scaling:
    let pos = new THREE.Vector3(x, y * sphereRadius, z);
        
        const node = createNode(i + 1, pos);
        scene.add(node);
        nodes.push(node);
    }
    
    generateEdges();
}

function generateEdges() {
    const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
    
    for (let i = 0; i < nodes.length; i++) {
        let j = (i + 1) % nodes.length;
        let points = [nodes[i].position, nodes[j].position];
        let edgeGeometry = new THREE.BufferGeometry().setFromPoints(points);
        let edge = new THREE.Line(edgeGeometry, material);
        scene.add(edge);
        edges.push(edge);
    }
}

/**
 * Zooms in on the node corresponding to the given index.
 * The camera target is set to the node's position, and the camera's new
 * target position is computed so that it is 'zoomDistance' away from the node.
 */
function zoomToNode(index) {
    const node = nodes[index];
    const nodePosition = nodePositions[index];
    if (node && nodePosition) {
        // Set the OrbitControls target to the node's position so the camera will look at it
        controls.target.copy(nodePosition);
        
        // Calculate the direction from the node to the current camera position
        let direction = camera.position.clone().sub(nodePosition).normalize();
        
        // Compute the new camera position so that it ends up 'zoomDistance' away from the node
        zoomTarget = nodePosition.clone().add(direction.multiplyScalar(zoomDistance));
        
        // Reset the interpolation progress for a smooth transition
        zoomProgress = 0;
    }
}

function onScroll(event) {
    let delta = event.deltaY * 0.01;
    let closestNode = nodes.reduce((prev, curr) => {
        return camera.position.distanceTo(curr.position) < camera.position.distanceTo(prev.position) ? curr : prev;
    });
    
    let direction = new THREE.Vector3().subVectors(closestNode.position, camera.position).normalize();
    camera.position.addScaledVector(direction, delta);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Make nodes face the camera
    nodes.forEach(node => {
        node.lookAt(camera.position);
    });
    
    // Smoothly interpolate the camera's position toward the zoom target, if set
    if (zoomTarget) {
        zoomProgress += 0.05;
        camera.position.lerp(zoomTarget, zoomProgress);
        camera.lookAt(controls.target);
        if (zoomProgress >= 1) {
            zoomTarget = null;
        }
    }
    
    controls.update();
    renderer.render(scene, camera);
}
