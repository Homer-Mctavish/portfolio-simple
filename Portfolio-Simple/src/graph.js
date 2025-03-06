import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

let camera, scene, renderer, controls;
let nodes = [];
let edges = [];
let zoomTarget = null;
let zoomProgress = 0;

const zoomDistance = 50;
const sphereRadius = 130; // Radius of the sphere where nodes are placed

document.addEventListener("DOMContentLoaded", () => {
    init();
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
    
    // Create Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Generate Graph with evenly spaced nodes
    generateGraph();
    
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('wheel', onScroll);
}

function generateGraph() {
    const numNodes = 10;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Approximately 2.399963
    
    for (let i = 0; i < numNodes; i++) {
        // Fibonacci sphere distribution calculations:
        let y = 1 - (i / (numNodes - 1)) * 2;  // y goes from 1 to -1
        let radiusAtY = Math.sqrt(1 - y * y);   // Radius at this y
        let theta = goldenAngle * i;            // Angle increment
        
        let x = Math.cos(theta) * radiusAtY;
        let z = Math.sin(theta) * radiusAtY;
        
        // Scale to the desired sphere radius
        x *= sphereRadius;
        y *= sphereRadius;
        z *= sphereRadius;
        
        // Create the node element
        let div = document.createElement('div');
        div.className = 'node';
        div.innerHTML = `Node ${i + 1}`;
        div.style.padding = '10px';
        div.style.backgroundColor = 'rgba(255,255,255,0.8)';
        div.style.border = '1px solid black';
        div.style.textAlign = 'center';
        div.style.cursor = 'pointer';
        
        // Create the CSS3D object and set its position
        let obj = new CSS3DObject(div);
        obj.position.set(x, y, z);
        
        // Add event listener to focus this node on click
        div.addEventListener('click', (event) => {
            event.stopPropagation();
            zoomToNode(obj);
        });
        
        scene.add(obj);
        nodes.push(obj);
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

function zoomToNode(node) {
    // Set the OrbitControls target to the node's position so it becomes the focus.
    controls.target.copy(node.position);
    
    // Calculate a new camera position at a fixed distance from the node.
    let direction = camera.position.clone().sub(node.position).normalize();
    zoomTarget = node.position.clone().add(direction.multiplyScalar(zoomDistance));
    zoomProgress = 0;
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
    
    // Make nodes face the camera.
    nodes.forEach(node => {
        node.lookAt(camera.position);
    });
    
    // Smoothly move the camera toward the zoom target.
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
