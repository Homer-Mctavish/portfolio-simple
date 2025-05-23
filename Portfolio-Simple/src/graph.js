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

const urlList =["https://github.com/Homer-Mctavish/projects/blob/main/Deep%20Learning%20Project/Tensorflow%20Project.ipynb",
  "https://github.com/Homer-Mctavish/phoenix-liveview-blog",
  "https://github.com/Homer-Mctavish/polars-express",
  "https://github.com/Homer-Mctavish/FASTAPI-SpaCy-API",
  "https://github.com/Homer-Mctavish/3jspencilshader",
  "https://github.com/Homer-Mctavish/Voter-HMM-Simulation",
  "https://github.com/Homer-Mctavish/DatingApp",
  "https://github.com/Homer-Mctavish/Realm-Sheet-Bot",
  "https://github.com/Homer-Mctavish/MissMambaChatbot"
];


let camera, scene, renderer, controls;
let nodes = [];
let nodePositions = [];
let edges = [];
const sphereRadius = 130; // Radius of the sphere where nodes are placed
let initialFov, currentZoomFactor = 1; // currentZoomFactor is 1 at start
const targetNodeIndex = 5; // Change this to the index of the node you want to focus on initially
const mouse = new THREE.Vector2(); 
var raycaster = new THREE.Raycaster();



function highlightCSS3DObjects() {
  const color='red';
  scene.traverse(o => {
    if (o instanceof CSS3DObject) {
      // Use `outline` so you don't change layout
      o.element.style.outline        = `2px solid ${color}`;
      o.element.style.outlineOffset  = '-2px';
      // Ensure it’s on top
      o.element.style.zIndex         = '999';
      // And make sure pointer events are on
      o.element.style.pointerEvents  = 'auto';
    }
  });
  console.log("fb")
}

document.addEventListener("DOMContentLoaded", async () => {
    init();
    await generateGraph();
    addButtonClickEvent(nodes, faceNode); // Set up button events
    animate();
});



// then in init(), after controls etc:

function init() {
    const container = document.getElementById('container');
    
    // Create Scene
    scene = new THREE.Scene();
    
    // Create Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);
    initialFov = camera.fov;
    
    // Create CSS3D Renderer
    renderer = new CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    
    // Create OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);

  // Set the camera's initial target to the first node (or any node you choose)
  if (nodes.length > 0) {
    controls.target.copy(nodePositions[targetNodeIndex]);
    camera.lookAt(nodePositions[targetNodeIndex]);
  }
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.dampingFactor = 0.05; 
    window.addEventListener('resize', onWindowResize);
    
    window.addEventListener('wheel', onScroll, { passive: false });
    adjustTextScale(currentZoomFactor);
}
  
/**
 * Adjusts the CSS scale of text (or any content) inside node elements to counteract
 * any scaling effects caused by camera zoom, so that text remains crisp.
 * @param {number} zoomFactor - The current zoom factor (1 means no zoom, less than 1 means zoom in).
 */
function adjustTextScale(zoomFactor) {
  // Inverse scale: if zoomFactor < 1 (zoomed in), scale text by 1/zoomFactor to keep it crisp.
  document.querySelectorAll('.node').forEach(el => {
    el.style.transform = `scale(${1/zoomFactor})`;
    el.style.transformOrigin = 'center center';
  });
}

/**
 * Example zoom function that updates camera FOV and adjusts text scale.
 * Call this function when the zoom factor changes.
 * @param {number} newZoomFactor - New zoom factor (e.g., 0.5 to zoom in by 50%).
 */

function createNode(nodeNumber, position) {
  // 1) Build the DIV
  const div = document.createElement('div');
  div.className = 'node';
  div.style.width = '150px';
  div.style.height = '50px';
  div.style.pointerEvents = 'auto';

  // 2) Inject your raw HTML
    // div.dataset.url = urlList[nodeNumber - 1];

  const content = nodeHTMLContents[(nodeNumber - 1) % nodeHTMLContents.length];
    const url     = urlList[nodeNumber - 1] || '#';
  div.innerHTML = `
    <a href="${url}" target="_blank" rel="noopener noreferrer" style="display:block; width:100%; height:100%; text-decoration:none; color:inherit;">
      ${content}
    </a>
  `;

  // 4) Listen for clicks on the DIV itself
  div.addEventListener('click', e => {
    e.stopPropagation();  // don’t let CSS3DRenderer swallow it
    // 4a) If your content has an <a>, just open that:
    const a = div.querySelector('a[href]');
    if (a) {
      window.open(a.href, '_blank');
      return;
    }
    // 4b) Otherwise, use your stored data-url
    if (div.dataset.url) {
      window.open(div.dataset.url, '_blank');
    }
  });

  // 5) Wrap in CSS3DObject, position, name, etc.
  const nodeObject = new CSS3DObject(div);
  nodeObject.position.copy(position);
  nodeObject.name = `node-${nodeNumber}`;
  return nodeObject;
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

function faceNode(index) {
  // Check for a valid index.
  if (index < 0 || index >= nodes.length) return;
  // Get the target position from the node.
  const target = nodes[index].position;
  
  // Update the camera's rotation to face the target without moving its position.
  camera.lookAt(target);

  // If you are using OrbitControls, update its target as well,
  // so the controls reflect the new orientation.
  controls.target.copy(target);
  controls.update();
}
  
  function onScroll(event) {
    // In this locked-camera version, we do not translate the camera.
    // You could allow FOV adjustments here as well, but for now we ignore scrolling.
    event.preventDefault();
  }
  

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseDown(event) {
  // 1) Get raw mouse coords
  const x = event.clientX, y = event.clientY;
  console.log('MouseDown at', x, y);

  // 2) Find the actual DOM element under the cursor
  const clickedEl = document.elementFromPoint(x, y);
  console.log('elementFromPoint →', clickedEl);

  // 3) Walk up to the nearest .node container
  const nodeDiv = clickedEl && clickedEl.closest('.node');
  if (!nodeDiv) {
    console.log('Clicked outside any .node');
    return;
  }
  
  console.log('Clicked inside node:', nodeDiv);

  // 4) Find all <a> tags anywhere inside that node
  const links = Array.from(nodeDiv.querySelectorAll('a[href]'));
  if (links.length === 0) {
    console.log('No <a> links found in this node');
    return;
  }

  // 5) Log each link href
  links.forEach((a, idx) => {
    console.log(`Link #${idx + 1}:`, a.href);
  });

  // 6) Open the first link (optional)
  const firstLink = links[0];
  window.open(firstLink.href, '_blank');
}




function printAllCSS3DObjects() {
  console.log('Listing all CSS3DObjects in scene:');
  scene.traverse(obj => {
    if (obj instanceof CSS3DObject) {
      console.log(obj);
    }
  });
}

window.addEventListener('keydown', e => {
  if (e.key === 'p' || e.key === 'P') printAllCSS3DObjects();
});


window.addEventListener('keydown', e => {
  if (e.key === 'w' || e.key === 'W') highlightCSS3DObjects();
});


function animate() {
    requestAnimationFrame(animate);
  
    // Ensure nodes always face the camera.
    nodes.forEach((node) => {
      node.lookAt(camera.position);
    });

    document.addEventListener('mousedown', onDocumentMouseDown, true);

    
    controls.update();
    renderer.render(scene, camera);

  }
