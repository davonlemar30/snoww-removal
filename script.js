const alexanderImage = new Image();
alexanderImage.src = 'assets/alexander.png';
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
let gameStarted = false;


let lastShovelTime = 0;
let shootingSpeed = 1;
let shovelCooldown = 1000; // milliseconds
let snowflakesHit = 0;
let superPowerActive = false;
let movementSpeed = 15;
let superPowerActivationThreshold = 10;
let hitsSinceLastSuperPower = 0;
const SNOW_ACCUMULATION_RATE = 50;
let snowAccumulation = 0;
const BUILDING_HEIGHT = 100;
let buildingVisibility = [BUILDING_HEIGHT, BUILDING_HEIGHT, BUILDING_HEIGHT];
let gameDuration = 60000; // 60 seconds
let score = 0; // The player's current score
let belowFreezing = false; // Indicates if the 'belowFreezing' state is active
let belowFreezingStartTime; // The timestamp when 'belowFreezing' state was activated
let iceKing = false; // Indicates if the 'iceKing' state is active
let iceKingStartTime;
let superPowerTimeoutId;
let shootInterval;
// Define Alexander's starting position
let alexanderX = canvas.width / 2; // Replace with your desired starting X coordinate
let alexanderY = canvas.height - 100; // Ensures Alexander is 100px above the bottom of the canvas
let startTime; // Declaration without initialization

const office = new Image();
const SNOWFLAKES_REQUIRED_PER_BUILDING = 15; // Number of snowflakes required to cover a building
const MAX_BUILDINGS = 3; // Total number of office buildings
const shovelImage = new Image();
shovelImage.onload = function () {
    // You can now create shovels because the image is loaded
    // and you know the width and height
};
shovelImage.src = 'assets/shovel.png'; // Adjust path as necessary
const snowflakeImage = new Image();
// Set the 'src' to point to the snowflake image file
snowflakeImage.src = 'assets/snow-flake.png';

function drawInitialScreen() {
    if (!gameStarted) {
        // Clear the canvas first
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // "Snow Removal" text settings
        ctx.font = 'bold 150px Arial';
        ctx.fillStyle = '#f0f8ff'; // Snow-like color
        ctx.textAlign = 'center';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 10;

        // Calculate position for "Snow Removal" to be centered
        const snowRemovalX = canvas.width / 2;
        const snowRemovalY = canvas.height / 2 - 60;

        // Draw "Snow Removal"
        ctx.fillText('Snow Removal', snowRemovalX, snowRemovalY);

        // Reset shadow for the version number
        ctx.shadowBlur = 5;

        // Version number "1.5" settings
        ctx.font = '50px Arial';

        // Measure "Snow Removal" text to position "1.5" correctly
        const metrics = ctx.measureText('Snow Removal');
        const textWidth = metrics.width;

        // Position "1.5" to hang off the right side of "Snow Removal"
        const versionX = snowRemovalX + (textWidth / 2) + 20; // Adjust X to the right
        const versionY = snowRemovalY + 65; // Adjust Y to be slightly below

        // Draw "1.5"
        ctx.fillText('1.5', versionX, versionY);

        // Reset shadow settings for other drawing operations
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        document.getElementById('playAgainBtn').style.display = 'none';


    }
}

window.onload = drawInitialScreen;

office.src = 'assets/office.png'; // Adjust the path to where your image is located
office.onload = drawInitialScreen;

// Keyboard event listeners for movement and action
window.addEventListener('keydown', function (event) {
    if (!gameStarted) return;

    // Movement keys ('ArrowLeft' and 'ArrowRight')
    if (event.key === 'ArrowLeft') {
        alexanderX = Math.max(0, alexanderX - movementSpeed);
    } else if (event.key === 'ArrowRight') {
        alexanderX = Math.min(canvas.width - alexanderImage.width, alexanderX + movementSpeed);
    }

    // Shooting key (' ')
    if (event.key === ' ') {
        // Prevent scrolling the page with space key
        event.preventDefault();

        if (superPowerActive && continuousShootingEnabled && !shootInterval) {
            // Start continuous shooting if not already happening
            shootInterval = setInterval(shootShovel, 100); // Adjust interval as needed
        } else if (!superPowerActive) {
            // Normal mode shooting (ensures one shot per keypress)
            shootShovel();
        }
    }
});


window.addEventListener('keydown', function (event) {
    if (event.key === ' ' && gameStarted && superPowerActive && continuousShootingEnabled) {
        startContinuousShooting();
        event.preventDefault(); // Prevent default to avoid any undesired behavior
    }
});

window.addEventListener('keyup', function (event) {
    if (event.key === ' ' && shootInterval) {
        clearInterval(shootInterval);
        shootInterval = null;
    }
});




function checkCollisions() {
    for (let i = snowflakes.length - 1; i >= 0; i--) {
        const snowflake = snowflakes[i];
        for (let j = shovels.length - 1; j >= 0; j--) {
            const shovel = shovels[j];
            if (shovel.visible && collisionDetection(shovel, snowflake)) {
                snowflakes.splice(i, 1);
                shovels.splice(j, 1);
                snowflakesHit++; // Increment hit counter, but don't modify snow accumulation here
                hitsSinceLastSuperPower++;
                handleCollisionEffects();
                break;
            }
        }
    }
}

function collisionDetection(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.height + obj1.y > obj2.y;
}







function handleCollisionEffects() {
    score++;
    if (hitsSinceLastSuperPower >= superPowerActivationThreshold && !superPowerActive) {
        activateSuperPower();
        hitsSinceLastSuperPower = 0; // Reset the counter to prevent immediate reactivation
    }
}

function activateSuperPower() {
    if (!superPowerActive) { // Only activate if not already active
        superPowerActive = true;
        continuousShootingEnabled = true;
        movementSpeed *= 2; // Double the speed

        if (!shootInterval) {
            shootInterval = setInterval(() => addShovel(alexanderX), shootingSpeed);
        }

        // Ensure the deactivation timeout is not reset unnecessarily
        clearTimeout(superPowerTimeoutId); // Clear any existing timeout as a precaution
        superPowerTimeoutId = setTimeout(deactivateSuperPower, 10000);
    }
}


function deactivateSuperPower() {
    superPowerActive = false;
    continuousShootingEnabled = false;
    movementSpeed /= 2; // Reset the speed back to normal

    // Important: Reset the counter to ensure a fresh count for reactivation criteria.
    hitsSinceLastSuperPower = 0;

    // Stop continuous shooting
    clearInterval(shootInterval);
    shootInterval = null;

    // Reset movement speed or other superpower-related attributes if necessary
}

function areAllBuildingsCovered() {
    // This function checks if all buildings are fully covered with snow
    // Assuming 'buildingVisibility' is an array with the visibility height of each building
    // and a building is considered covered if its visibility is 0
    return buildingVisibility.every(visibility => visibility === 0);
}


function updateGame() {
    if (!gameStarted) return;

    clearCanvas();

    const remainingTime = gameDuration - (Date.now() - startTime);

    // Check for losing condition first
    if (areAllBuildingsCovered()) {
        displayLoseScreen(); // Trigger a lose game screen or similar end game function
        return; // Stop the game loop
    }

    if (remainingTime <= 0) {
        displayWinScreen(); // Display a game over message
        return; // Stop the game loop
    }

    updateTimer();
    updateSnowflakes(); // Update the position of snowflakes
    updateShovels(); // Update the position of shovels
    drawGameElements(); // Draw all game elements including shovels
    handleCollisions(); // Handle any collisions
    checkCollisions();
    handleSpecialGameStates();
    updateSnowAccumulation();
    updateAlexanderPosition();

    displayRemainingTime(gameDuration - (Date.now() - startTime)); // Ensure this is the last drawing command

    requestAnimationFrame(updateGame); // Continue the game loop
}

function updateAlexanderPosition() {
    // The Y-coordinate of Alexander should be the height of the canvas minus the height of his image.
    // If there's snow accumulation, we need to subtract that from the Y-coordinate.
    alexanderY = canvas.height - alexanderImage.height;

    // Make sure Alexander doesn't go below the canvas
    if (alexanderY > canvas.height - alexanderImage.height) {
        alexanderY = canvas.height - alexanderImage.height;
    }
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function updateSnowAccumulation() {
    // Calculate the index of the currently affected building based on snowflakes hit
    let buildingIndex = Math.floor(snowAccumulation / (SNOWFLAKES_REQUIRED_PER_BUILDING * SNOW_ACCUMULATION_RATE));

    // Update the visibility for each building
    buildingVisibility = buildingVisibility.map((visibility, index) => {
        if (index < buildingIndex) {
            // Buildings that are already fully covered
            return 0;
        } else if (index === buildingIndex) {
            // Building currently being covered
            let snowOnCurrentBuilding = snowAccumulation % (SNOWFLAKES_REQUIRED_PER_BUILDING * SNOW_ACCUMULATION_RATE);
            return BUILDING_HEIGHT - (snowOnCurrentBuilding / (SNOWFLAKES_REQUIRED_PER_BUILDING * SNOW_ACCUMULATION_RATE)) * BUILDING_HEIGHT;
        } else {
            // Buildings that have not been covered yet
            return BUILDING_HEIGHT;
        }
    });
}

function updateTimer() {
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(gameDuration - elapsedTime, 0);
    displayRemainingTime(remainingTime);

    if (remainingTime <= 0) {
        displayWinScreen();
    }
}

function drawAlexander() {
    // Ensure the image is loaded before trying to draw
    if (alexanderImage.complete) {
        console.log('Drawing Alexander at', alexanderX, alexanderY); // Debugging line
        ctx.drawImage(alexanderImage, alexanderX, alexanderY);
    } else {
        console.log('Alexander image not loaded'); // Debugging line
        alexanderImage.onload = function () {
            ctx.drawImage(alexanderImage, alexanderX, alexanderY);
        };
    }
}



function drawGameElements() {
    drawSnowOnGround();
    drawBuildings();
    drawSnowflakes();
    drawShovels();
    displayScore();
    displaySuperPowerStatus();
    drawAlexander();
}

function handleCollisions() {
    checkCollisions(); // Assumes checkCollisions only checks and handles collisions
    addSnowflakeConditionally();
    handleSpecialGameStates();
}

// Define Snowflake class
class Snowflake {
    constructor(x, y, speed, image) {
        this.x = x;
        this.y = y;
        this.speed = speed; // Ensure there's a speed property
        this.image = image;
        // Set width and height when the Snowflake instance is created
        this.width = image.width;
        this.height = image.height;
    }

    // Call this method once the image is loaded to update width and height
    setImageDimensions() {
        if (this.image.complete) {
            this.width = this.image.width;
            this.height = this.image.height;
        }
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y);
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.y = -this.height; // Reset snowflake to the top
            snowAccumulation += SNOW_ACCUMULATION_RATE; // Increment snow accumulation
        }
    }


}

snowflakeImage.onload = function () {
    // When the image is loaded, go through each snowflake and set its dimensions
    snowflakes.forEach(snowflake => {
        snowflake.setImageDimensions();
    });
};

class Shovel {
    constructor(x, y, image) {
        this.x = x;
        this.y = y;
        this.image = image;
        this.visible = true;
        this.width = image.width; // Set width when image is loaded
        this.height = image.height; // Set height when image is loaded
    }

    draw(ctx) {
        console.log('Drawing shovel');

        if (this.visible) {
            ctx.drawImage(this.image, this.x, this.y);
        }
    }

    update() {
        if (this.visible) {
            this.y -= 5; // Adjust the speed of the shovel's movement
            if (this.y < -shovelImage.height) {
                shovels.shift();
            }
        }
    }
}






// Function to update all snowflakes
function updateSnowflakes() {
    for (const snowflake of snowflakes) {
        snowflake.update();
    }
}

// Function to create and add new snowflake
function addSnowFlake() {
    const x = Math.random() * canvas.width;
    const speed = 1; // Set a positive speed for the snowflake to fall down
    // Make sure to create snowflakes only after the snowflakeImage has fully loaded
    if (snowflakeImage.complete) {
        const snowflake = new Snowflake(x, -snowflakeImage.height, speed, snowflakeImage);
        snowflakes.push(snowflake);
    }
}

// Initialize the snowflakes array
let snowflakes = [];

// Function to draw all snowflakes
function drawSnowflakes() {
    // Draw each snowflake on the canvas
    snowflakes.forEach(snowflake => snowflake.draw(ctx));
}

// Function to update all shovels
function updateShovels() {
    // Use a separate loop for updating to avoid modifying the array while iterating
    shovels.forEach(shovel => shovel.update());

    // Then remove any shovels that are not visible in a separate loop
    for (let i = shovels.length - 1; i >= 0; i--) {
        if (!shovels[i].visible) {
            shovels.splice(i, 1);
        }
    }
}


// Function to draw all shovels
function drawShovels() {
    console.log('Drawing shovels:', shovels.length);
    for (const shovel of shovels) {
        if (shovel.visible) {
            shovel.draw(ctx);
        }
    }
}


// Function to create and add a new shovel
function addShovel(x) {
    const shovel = new Shovel(x, alexanderY, shovelImage);
    shovel.visible = true;
    shovels.push(shovel);
}

// Initialize the shovels array
let shovels = [];

// Renamed for clarity and now only does one thing - displays the remaining time
function displayRemainingTime(remainingTime) {
    ctx.save(); // Save the current state of the canvas context

    const seconds = Math.floor(remainingTime / 1000);
    const formattedTime = `Time Left: ${Math.floor(seconds / 60)}:${('0' + (seconds % 60)).slice(-2)}`;

    ctx.font = "20px Arial"; // Consider adjusting size for visibility
    ctx.fillStyle = "yellow"; // Ensure this color stands out against your game's background
    ctx.textAlign = 'right'; // Align text to the right for positioning in the top right corner

    // Position the timer on the top right corner of the canvas
    // Adjust the x-coordinate to align text right considering a margin, and y-coordinate for a top margin
    ctx.fillText(formattedTime, canvas.width - 10, 30);

    ctx.restore(); // Restore the canvas context to its previous state
}




// Function to draw snow on the ground only within the building area
function drawSnowOnGround() {
    for (let i = 0; i < MAX_BUILDINGS; i++) {
        let xPosition = 100 + (i * (office.width + 50)); // Position buildings with space between them
        let yPosition = canvas.height - BUILDING_HEIGHT;

        // Draw the snow accumulation only within the area under each building
        ctx.fillStyle = '#FFF'; // Snow color
        ctx.fillRect(xPosition, yPosition + BUILDING_HEIGHT, office.width, snowAccumulation);
    }
}

// Modify the drawBuildings function to draw buildings based on their visibility
function drawBuildings() {
    for (let i = 0; i < MAX_BUILDINGS; i++) {
        let xPosition = 100 + (i * (office.width + 50)); // Position buildings with space between them
        let yPosition = canvas.height - BUILDING_HEIGHT;
        ctx.drawImage(office, xPosition, yPosition, office.width, BUILDING_HEIGHT);

        if (buildingVisibility[i] < BUILDING_HEIGHT) {
            // Draw the snow coverage as a white rectangle starting from the bottom of the building
            ctx.fillStyle = '#FFF';
            let snowHeight = BUILDING_HEIGHT - buildingVisibility[i];
            // Start drawing the snow from the bottom of the building
            ctx.fillRect(xPosition, canvas.height - snowHeight, office.width, snowHeight);
        }
    }
}


function displayScore() {
    ctx.font = "20px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = 'left';
    ctx.fillText("Snowflakes Hit: " + snowflakesHit, 10, 30);
}

function displaySuperPowerStatus() {
    if (superPowerActive) {
        ctx.font = '30px Arial';
        ctx.fillStyle = 'yellow';
        ctx.textAlign = 'center';
        ctx.fillText('SUPERPOWER ACTIVATED!!', canvas.width / 2, 50);
    }
}

function addSnowflakeConditionally() {
    if (Math.floor(Math.random() * 50) === 0 && snowflakes.length < 100) {
        addSnowFlake();
    }
}

function handleSpecialGameStates() {
    // Check for the "belowFreezing" state activation
    if (score >= 30 && !belowFreezing) {
        belowFreezing = true;
        belowFreezingStartTime = Date.now();
        // Additional setup for "belowFreezing" state, if needed
    }

    // Manage the duration and effects of the "belowFreezing" state
    if (belowFreezing) {
        const elapsedTime = Date.now() - belowFreezingStartTime;
        if (elapsedTime >= 5000) { // 5 seconds duration
            belowFreezing = false;
            // Any cleanup or reversion of effects for "belowFreezing" state
        }
    }

    // Check for the "iceKing" state activation
    if (score >= 100 && !iceKing) {
        iceKing = true;
        iceKingStartTime = Date.now();
        // Additional setup for "iceKing" state, if needed
    }

    // Manage the duration and effects of the "iceKing" state
    if (iceKing) {
        const elapsedTime = Date.now() - iceKingStartTime;
        if (elapsedTime >= 5000) { // Assuming 5 seconds duration for consistency
            iceKing = false;
            // Any cleanup or reversion of effects for "iceKing" state
        }
    }

    // Further special game states can be managed in a similar pattern
}

function resetGameState() {
    // Reset all game state variables
    snowflakes = [];
    shovels = [];
    gameStarted = false;
    lastShovelTime = 0;
    snowflakesHit = 0;
    superPowerActive = false;
    hitsSinceLastSuperPower = 0;
    snowAccumulation = 0;
    buildingVisibility = [BUILDING_HEIGHT, BUILDING_HEIGHT, BUILDING_HEIGHT];
    score = 0;
    belowFreezing = false;
    iceKing = false;
    continuousShootingEnabled = false;
    // Ensure to clear intervals and timeouts
    clearInterval(shootInterval);
    clearTimeout(superPowerTimeoutId);
    shootInterval = null;
    superPowerTimeoutId = null;
    // Reset start time for the next game
    startTime = Date.now();
}


function startGame() {

    document.getElementById('startGameBtn').style.display = 'none'; // Hide start button
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the initial screen

    resetGameState(); // Call this function to reset game state variables
    startTime = Date.now();
    gameStarted = true;
    drawAlexander();
    updateGame(); // Start the game loop
}

// Event listener for the 'Start Game' button
document.getElementById('startGameBtn').addEventListener('click', startGame);


// Check if Alexander's image is already loaded to start the game immediately
if (alexanderImage.complete) {
    drawAlexander();
    updateGame();
} else {
    // If not loaded yet, set the onload function
    alexanderImage.onload = function () {
        drawAlexander();
        updateGame();
    };
}
;



// Function to handle key down events, possibly to add shovels
function keyDownHandler(event) {
    if (!gameStarted) {
        return;
    }

    switch (event.key) {
        case 'ArrowLeft':
            // Move Alexander left
            break;
        case 'ArrowRight':
            // Move Alexander right
            break;
        case ' ':
            if (superPowerActive && continuousShootingEnabled) {
                // If continuous shooting isn't already happening, start it
                if (!shootInterval) {
                    shootInterval = setInterval(shootShovel, 100); // Adjust interval as needed
                }
            } else {
                // For normal shooting, just call shootShovel directly
                shootShovel();
            }
            event.preventDefault(); // Prevent the default action (scroll / space action)
            break;
    }
}

function keyUpHandler(event) {
    // When spacebar is released, stop continuous shooting
    if (event.key === ' ' && shootInterval) {
        clearInterval(shootInterval);
        shootInterval = null;
    }
}


function shootShovel() {
    const now = Date.now();
    // Check if superpower is active for continuous shooting
    if (superPowerActive && continuousShootingEnabled) {
        // Implement continuous shooting logic
        const shovelsToShoot = 3; // For example, shoot 3 shovels at once
        for (let i = 0; i < shovelsToShoot; i++) {
            // Offset each shovel's starting x position slightly for visual spread
            addShovel(alexanderX + (i * 10) - ((shovelsToShoot - 1) * 5));
        }
    } else {
        // For normal mode, ensure that shovel is added based on cooldown
        if (now - lastShovelTime >= shovelCooldown) {
            lastShovelTime = now;
            addShovel(alexanderX);
        }
    }
}

function startContinuousShooting() {
    if (!shootInterval) {
        shootShovel(); // Initial shot
        shootInterval = setInterval(shootShovel, shootingSpeed); // Use the global variable
    }
}

function stopContinuousShooting() {
    if (shootInterval) {
        clearInterval(shootInterval);
        shootInterval = null;
    }
}

// ... (Previous code remains the same)

function displayWinScreen() {
    // Stop the game
    gameStarted = false;
    clearTimeout(superPowerTimeoutId);
    if (shootInterval) clearInterval(shootInterval);

    // Make the canvas visible if you want to show the game state when the game ends
    canvas.style.display = 'block';

    // Display the win screen elements
    document.getElementById('winScreen').style.display = 'flex'; // Show the win screen
    document.getElementById('playAgainBtn').style.display = 'block'; // Make play again button visible
    

}

function displayLoseScreen() {
    gameStarted = false;
    clearTimeout(superPowerTimeoutId);
    clearInterval(shootInterval);
    canvas.style.display = 'none'; // Hide the canvas to pause the game

    // Check if the loseScreen already exists
    let loseScreenDiv = document.getElementById('loseScreen');
    if (!loseScreenDiv) {
        // If it doesn't exist, create it
        loseScreenDiv = document.createElement('div');
        loseScreenDiv.id = 'loseScreen';
        document.body.appendChild(loseScreenDiv);
    } else {
        // If it does exist, clear its content
        loseScreenDiv.innerHTML = '';
    }

    // Create the game-over text elements
   
    const gameOverText = document.createElement('h1');
    gameOverText.textContent = 'Game Over!';
    const messageText = document.createElement('h2');
    messageText.textContent = 'Your co-workers are snowed in';

    // Create play again button
    const playAgainButton = document.createElement('button');
    playAgainButton.id = 'playAgainBtn';
    playAgainButton.textContent = 'Play Again';
    playAgainButton.addEventListener('click', resetGame);
    

    // Append the text elements to the loseScreen div
    loseScreenDiv.appendChild(gameOverText);
    loseScreenDiv.appendChild(messageText);
    loseScreenDiv.appendChild(playAgainButton);

    // Add the loseScreen div to the body of the page
    document.body.appendChild(loseScreenDiv);

    // Make the lose screen visible
    loseScreenDiv.style.display = 'flex';
}

// Add event listener for the 'startGameBtn' directly
document.getElementById('startGameBtn').addEventListener('click', startGame);






function resetGame() {
    resetGameState(); // This function resets the game state
    canvas.style.display = 'block'; // This makes the canvas visible again
     // Hide any end-game screens
     const winScreen = document.getElementById('winScreen');
     const loseScreen = document.getElementById('loseScreen');
 
     if (winScreen) {
         winScreen.style.display = 'none'; // Hide the win screen
     }
 
     if (loseScreen && loseScreen.parentNode) {
         loseScreen.parentNode.removeChild(loseScreen); // Remove the lose screen from the DOM
     }
     
    drawInitialScreen(); // Optionally redraw the initial screen, or start the game directly
    // startGame(); // Uncomment if you want to start the game immediately
    document.getElementById('winScreen').style.display = 'none'; // Hide the win screen

    document.getElementById('startGameBtn').style.display = 'block'; // Show start button

}

// Add event listener for the 'playAgainBtn' outside the 'displayWinScreen' function
document.getElementById('playAgainBtn').addEventListener('click', resetGame);





window.addEventListener('DOMContentLoaded', (event) => {
    drawInitialScreen();
    // You could also set up your event listeners here to ensure all elements are available
    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('keyup', keyUpHandler);

});