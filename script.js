const canvas = document.getElementById('simulation');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

let gravity = 0.5;
let enableGravity = true;
let isPaused = false;

let marbles = [];
let obstacles = [];
let draggingMarble = null;

const elasticity = 0.9;  // Bounce factor

// Update marbles count
function updateInfo() {
    document.getElementById('info').textContent = `Marbles: ${marbles.length}`;
}

// Marble class
class Marble {
    constructor(x, y, radius, isStatic = false) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.isStatic = isStatic;  // Static marbles act as obstacles
        this.vx = 0;
        this.vy = 0;
        this.mass = radius;  // Mass proportional to radius
        this.dragging = false;
    }

    update() {
        if (!this.isStatic && !this.dragging) {
            // Apply gravity
            if (enableGravity) {
                this.vy += gravity;
            } else {
                // No gravity: Keep floating
                this.vy *= 0.99;  // Slow down upward motion for realistic floating
            }

            // Update position
            this.x += this.vx;
            this.y += this.vy;

            // Handle wall collisions
            this.handleWallCollisions();
        }
    }

    handleWallCollisions() {
        // Left and right walls
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx *= -elasticity;
        } else if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius;
            this.vx *= -elasticity;
        }

        // Top and bottom walls
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy *= -elasticity;
        } else if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            this.vy *= -elasticity;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isStatic ? 'grey' : 'blue';
        ctx.fill();
        ctx.closePath();
    }
}

// Collision detection and response
function handleCollisions() {
    let allObjects = marbles.concat(obstacles);
    for (let i = 0; i < allObjects.length; i++) {
        let marble1 = allObjects[i];

        for (let j = i + 1; j < allObjects.length; j++) {
            let marble2 = allObjects[j];

            let dx = marble2.x - marble1.x;
            let dy = marble2.y - marble1.y;
            let distance = Math.hypot(dx, dy);
            let minDist = marble1.radius + marble2.radius;

            if (distance < minDist) {
                // Prevent overlap
                let overlap = (minDist - distance) / 2;

                // Calculate displacement
                let offsetX = (overlap * dx) / distance;
                let offsetY = (overlap * dy) / distance;

                if (!marble1.isStatic) {
                    marble1.x -= offsetX;
                    marble1.y -= offsetY;
                }
                if (!marble2.isStatic) {
                    marble2.x += offsetX;
                    marble2.y += offsetY;
                }

                // Collision response
                resolveCollision(marble1, marble2);
            }
        }
    }
}

// Collision resolution function
function resolveCollision(marble1, marble2) {
    const vxDiff = marble1.vx - marble2.vx;
    const vyDiff = marble1.vy - marble2.vy;

    const xDist = marble2.x - marble1.x;
    const yDist = marble2.y - marble1.y;

    // Prevent accidental overlap of marbles
    if (xDist * vxDiff + yDist * vyDiff >= 0) {

        // Angle of collision
        const angle = -Math.atan2(marble2.y - marble1.y, marble2.x - marble1.x);

        // Masses
        const m1 = marble1.mass;
        const m2 = marble2.mass;

        // Velocities before collision
        const u1 = rotate({ x: marble1.vx, y: marble1.vy }, angle);
        const u2 = rotate({ x: marble2.vx, y: marble2.vy }, angle);

        // Velocities after collision (1D collision)
        const v1 = { x: u1.x * (m1 - m2) / (m1 + m2) + u2.x * (2 * m2) / (m1 + m2), y: u1.y };
        const v2 = { x: u2.x * (m2 - m1) / (m1 + m2) + u1.x * (2 * m1) / (m1 + m2), y: u2.y };

        // Rotate velocities back
        const vFinal1 = rotate(v1, -angle);
        const vFinal2 = rotate(v2, -angle);

        // Assign new velocities if not static
        if (!marble1.isStatic) {
            marble1.vx = vFinal1.x * elasticity;
            marble1.vy = vFinal1.y * elasticity;
        }
        if (!marble2.isStatic) {
            marble2.vx = vFinal2.x * elasticity;
            marble2.vy = vFinal2.y * elasticity;
        }
    }
}

// Utility function to rotate velocity components
function rotate(velocity, angle) {
    return {
        x: velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
        y: velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle)
    };
}

// Mouse event handlers for dragging marbles
canvas.addEventListener('mousedown', (e) => {
    let rect = canvas.getBoundingClientRect();
    let mouseX = e.clientX - rect.left;
    let mouseY = e.clientY - rect.top;

    for (let marble of marbles) {
        let dx = mouseX - marble.x;
        let dy = mouseY - marble.y;
        if (Math.hypot(dx, dy) < marble.radius) {
            draggingMarble = marble;
            draggingMarble.dragging = true;
            break;
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (draggingMarble) {
        let rect = canvas.getBoundingClientRect();
        draggingMarble.x = e.clientX - rect.left;
        draggingMarble.y = e.clientY - rect.top;
    }
});

canvas.addEventListener('mouseup', () => {
    if (draggingMarble) {
        draggingMarble.dragging = false;
        draggingMarble = null;
    }
});

// Add marbles
document.getElementById('addMarble').addEventListener('click', () => {
    const radius = Math.random() * 15 + 5;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const y = Math.random() * (canvas.height - radius * 2) + radius;
    marbles.push(new Marble(x, y, radius));
    updateInfo();
});

// Add obstacles
document.getElementById('addObstacle').addEventListener('click', () => {
    const radius = Math.random() * 15 + 5;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const y = Math.random() * (canvas.height - radius * 2) + radius;
    obstacles.push(new Marble(x, y, radius, true)); // isStatic is true
    updateInfo();
});

// Delete last marble
document.getElementById('deleteMarble').addEventListener('click', () => {
    marbles.pop();
    updateInfo();
});

// Delete last obstacle
document.getElementById('deleteObstacle').addEventListener('click', () => {
    obstacles.pop();
    updateInfo();
});

// Toggle gravity
document.getElementById('toggleGravity').addEventListener('click', () => {
    enableGravity = !enableGravity;
    document.getElementById('toggleGravity').textContent = `Gravity: ${enableGravity ? 'On' : 'Off'}`;
});

// Pause or resume simulation
document.getElementById('pauseResume').addEventListener('click', () => {
    isPaused = !isPaused;
    document.getElementById('pauseResume').textContent = isPaused ? 'Resume' : 'Pause';
});

// Animation loop
function animate() {
    if (!isPaused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let marble of marbles) {
            marble.update();
            marble.draw();
        }
        for (let obstacle of obstacles) {
            obstacle.update();
            obstacle.draw();
        }

        handleCollisions();
    }
    requestAnimationFrame(animate);
}

animate();
