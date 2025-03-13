export function addButtonClickEvent(nodes, zoomToNode) {
    // Select all buttons in the nav-bar
    const navButtons = document.querySelectorAll('.nav-button');
    
    // Loop through all the buttons and add the click event listener
    navButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            // Get the node index from the button's data-node attribute
            const nodeIndex = parseInt(event.target.getAttribute('data-node'), 10);

            // Log which node is being clicked
            console.log(`Button for Node ${nodeIndex + 1} clicked`);

            // Call the zoomToNode function with the node index
            zoomToNode(nodeIndex);

            // Log when zooming starts
            console.log(`Zooming to Node ${nodeIndex + 1}`);
        });
    });
}
