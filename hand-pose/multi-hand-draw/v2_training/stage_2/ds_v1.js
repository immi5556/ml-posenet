import * as tf from 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core';
import * as handpose from 'https://cdn.jsdelivr.net/npm/@tensorflow-models/handpose';
import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl';

class HandGestureMouseController {
    constructor() {
        this.model = null;
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.isDetecting = false;
        this.lastHandPosition = null;
        this.pinchDistance = null;
        this.isDragging = false;
        this.dragStartPosition = null;
        this.lastClickTime = 0;
        this.clickThreshold = 500; // ms between clicks
        this.pinchThreshold = 40; // pixels
        this.dragThreshold = 10; // pixels

        // Gesture states
        this.gestures = {
            INDEX_POINTING: 'index_pointing',
            PINCH: 'pinch',
            FIST: 'fist',
            OPEN_PALM: 'open_palm',
            TWO_FINGERS: 'two_fingers'
        };
    }

    // Initialize the hand detection
    async initialize(videoElement, canvasElement) {
        try {
            // Load the handpose model
            this.model = await handpose.load();

            // Setup video stream
            this.video = videoElement;
            this.canvas = canvasElement;
            this.ctx = canvasElement.getContext('2d');

            // Get webcam access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });

            this.video.srcObject = stream;

            return new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.video.play();
                    resolve(true);
                };
            });
        } catch (error) {
            console.error('Error initializing hand detection:', error);
            return false;
        }
    }

    // Start hand detection
    startDetection() {
        if (!this.model || !this.video) {
            console.error('Please initialize first');
            return;
        }

        this.isDetecting = true;
        this.detectHands();
    }

    // Stop detection
    stopDetection() {
        this.isDetecting = false;
    }

    // Main detection loop
    async detectHands() {
        if (!this.isDetecting) return;

        // Get hand predictions
        const predictions = await this.model.estimateHands(this.video);

        // Draw hand landmarks (optional)
        this.drawLandmarks(predictions);

        // Process gestures if hand is detected
        if (predictions.length > 0) {
            const hand = predictions[0];
            const landmarks = hand.landmarks;

            // Process gestures
            this.processGestures(landmarks);
        }

        // Continue detection
        requestAnimationFrame(() => this.detectHands());
    }

    // Draw hand landmarks on canvas
    drawLandmarks(predictions) {
        if (!this.canvas || !this.ctx) return;

        // Set canvas dimensions to match video
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (predictions.length > 0) {
            const landmarks = predictions[0].landmarks;

            // Draw landmarks
            this.ctx.fillStyle = 'red';
            landmarks.forEach(point => {
                this.ctx.beginPath();
                this.ctx.arc(point[0], point[1], 5, 0, 2 * Math.PI);
                this.ctx.fill();
            });

            // Draw connections
            this.drawConnections(landmarks);
        }
    }

    // Draw connections between landmarks
    drawConnections(landmarks) {
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8], // Index finger
            [0, 9], [9, 10], [10, 11], [11, 12], // Middle finger
            [0, 13], [13, 14], [14, 15], [15, 16], // Ring finger
            [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
            [5, 9], [9, 13], [13, 17] // Palm
        ];

        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;

        connections.forEach(connection => {
            const [start, end] = connection;
            this.ctx.beginPath();
            this.ctx.moveTo(landmarks[start][0], landmarks[start][1]);
            this.ctx.lineTo(landmarks[end][0], landmarks[end][1]);
            this.ctx.stroke();
        });
    }

    // Process hand gestures and trigger events
    processGestures(landmarks) {
        // Get finger tip positions
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];
        const middleTip = landmarks[12];

        // Calculate distances
        const pinchDist = this.calculateDistance(indexTip, thumbTip);
        const twoFingerDist = this.calculateDistance(indexTip, middleTip);

        // Map hand position to screen coordinates
        const cursorPosition = this.mapToScreen(indexTip);

        // Detect current gesture
        const gesture = this.detectGesture(landmarks, pinchDist, twoFingerDist);

        // Process based on gesture
        switch (gesture) {
            case this.gestures.INDEX_POINTING:
                this.handleCursorMove(cursorPosition);
                break;

            case this.gestures.PINCH:
                this.handlePinchGesture(cursorPosition, pinchDist);
                break;

            case this.gestures.FIST:
                this.handleClick(cursorPosition);
                break;

            case this.gestures.TWO_FINGERS:
                this.handleTwoFingerGesture(cursorPosition, twoFingerDist);
                break;
        }

        this.lastHandPosition = cursorPosition;
    }

    // Map hand position to screen coordinates
    mapToScreen(handPosition) {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const videoWidth = this.video.videoWidth;
        const videoHeight = this.video.videoHeight;

        // Invert X coordinate (mirror effect)
        const x = screenWidth - (handPosition[0] / videoWidth) * screenWidth;
        const y = (handPosition[1] / videoHeight) * screenHeight;

        return { x, y };
    }

    // Calculate distance between two points
    calculateDistance(point1, point2) {
        const dx = point1[0] - point2[0];
        const dy = point1[1] - point2[1];
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Detect current hand gesture
    detectGesture(landmarks, pinchDist, twoFingerDist) {
        const fingerTips = [8, 12, 16, 20]; // Index, middle, ring, pinky tips

        // Check if index finger is extended and others are folded
        let extendedFingers = 0;
        let isIndexExtended = false;

        fingerTips.forEach((tip, index) => {
            const tipY = landmarks[tip][1];
            const pipY = landmarks[tip - 2][1]; // PIP joint

            if (tipY < pipY) { // Finger is extended if tip is above PIP
                extendedFingers++;
                if (index === 0) isIndexExtended = true;
            }
        });

        // Gesture detection logic
        if (extendedFingers === 1 && isIndexExtended) {
            return this.gestures.INDEX_POINTING;
        } else if (pinchDist < this.pinchThreshold) {
            return this.gestures.PINCH;
        } else if (extendedFingers === 0) {
            return this.gestures.FIST;
        } else if (twoFingerDist < this.pinchThreshold && extendedFingers === 2) {
            return this.gestures.TWO_FINGERS;
        } else {
            return this.gestures.OPEN_PALM;
        }
    }

    // Handle cursor movement
    handleCursorMove(position) {
        // Move cursor to position
        this.simulateMouseMove(position.x, position.y);

        // Check for drag
        if (this.isDragging && this.dragStartPosition) {
            this.simulateMouseMove(position.x, position.y);
        }
    }

    // Handle pinch gesture for zoom
    handlePinchGesture(position, pinchDist) {
        if (this.pinchDistance === null) {
            this.pinchDistance = pinchDist;
            return;
        }

        const delta = pinchDist - this.pinchDistance;

        if (Math.abs(delta) > 5) {
            // Simulate zoom
            this.simulateZoom(delta > 0 ? 'zoom-in' : 'zoom-out', position);
        }

        this.pinchDistance = pinchDist;
    }

    // Handle two-finger gesture for right-click or special actions
    handleTwoFingerGesture(position, distance) {
        // You can implement right-click or other two-finger gestures
        const currentTime = Date.now();

        if (currentTime - this.lastClickTime > this.clickThreshold) {
            this.simulateRightClick(position.x, position.y);
            this.lastClickTime = currentTime;
        }
    }

    // Handle click gesture
    handleClick(position) {
        const currentTime = Date.now();

        if (currentTime - this.lastClickTime > this.clickThreshold) {
            if (!this.isDragging) {
                // Start drag
                this.isDragging = true;
                this.dragStartPosition = position;
                this.simulateMouseDown(position.x, position.y);
            } else {
                // End drag
                this.isDragging = false;
                this.dragStartPosition = null;
                this.simulateMouseUp(position.x, position.y);
                this.simulateClick(position.x, position.y);
            }
            this.lastClickTime = currentTime;
        }
    }

    // Simulate mouse events
    simulateMouseMove(x, y) {
        const event = new MouseEvent('mousemove', {
            clientX: x,
            clientY: y,
            bubbles: true,
            cancelable: true,
            view: window
        });

        // Dispatch to element at position or document
        const element = document.elementFromPoint(x, y);
        if (element) {
            element.dispatchEvent(event);
        }

        // Also dispatch to document for global tracking
        document.dispatchEvent(event);
    }

    simulateMouseDown(x, y) {
        const event = new MouseEvent('mousedown', {
            clientX: x,
            clientY: y,
            bubbles: true,
            cancelable: true,
            view: window
        });

        const element = document.elementFromPoint(x, y);
        if (element) {
            element.dispatchEvent(event);
        }
    }

    simulateMouseUp(x, y) {
        const event = new MouseEvent('mouseup', {
            clientX: x,
            clientY: y,
            bubbles: true,
            cancelable: true,
            view: window
        });

        const element = document.elementFromPoint(x, y);
        if (element) {
            element.dispatchEvent(event);
        }
    }

    simulateClick(x, y) {
        const event = new MouseEvent('click', {
            clientX: x,
            clientY: y,
            bubbles: true,
            cancelable: true,
            view: window
        });

        const element = document.elementFromPoint(x, y);
        if (element) {
            element.dispatchEvent(event);
        }
    }

    simulateRightClick(x, y) {
        const event = new MouseEvent('contextmenu', {
            clientX: x,
            clientY: y,
            bubbles: true,
            cancelable: true,
            view: window
        });

        const element = document.elementFromPoint(x, y);
        if (element) {
            element.dispatchEvent(event);
        }
    }

    simulateZoom(type, position) {
        // Create a custom zoom event
        const zoomEvent = new CustomEvent('hand-zoom', {
            detail: {
                type: type,
                x: position.x,
                y: position.y,
                scale: type === 'zoom-in' ? 1.1 : 0.9
            },
            bubbles: true,
            cancelable: true
        });

        document.dispatchEvent(zoomEvent);

        // You can also trigger wheel events for existing zoom handlers
        const wheelEvent = new WheelEvent('wheel', {
            deltaY: type === 'zoom-in' ? -100 : 100,
            clientX: position.x,
            clientY: position.y,
            bubbles: true
        });

        const element = document.elementFromPoint(position.x, position.y);
        if (element) {
            element.dispatchEvent(wheelEvent);
        }
    }

    // Cleanup resources
    cleanup() {
        this.stopDetection();

        if (this.video && this.video.srcObject) {
            const stream = this.video.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
        }
    }
}

// Usage Example
async function setupHandControl() {
    // Create HTML elements
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');

    document.body.appendChild(video);
    document.body.appendChild(canvas);

    video.style.position = 'fixed';
    video.style.top = '10px';
    video.style.right = '10px';
    video.style.width = '200px';
    video.style.border = '2px solid red';
    video.style.opacity = '0.5';

    canvas.style.position = 'fixed';
    canvas.style.top = '10px';
    canvas.style.right = '10px';
    canvas.style.width = '200px';
    canvas.style.border = '2px solid blue';
    canvas.style.opacity = '0.5';

    // Initialize controller
    const controller = new HandGestureMouseController();

    try {
        const initialized = await controller.initialize(video, canvas);

        if (initialized) {
            // Add event listeners for custom zoom events
            document.addEventListener('hand-zoom', (e) => {
                console.log('Zoom event:', e.detail);
                // Implement your zoom logic here
            });

            // Start detection
            controller.startDetection();

            // Return controller for external control
            return controller;
        }
    } catch (error) {
        console.error('Failed to setup hand control:', error);
    }
}

// Start when page loads
window.addEventListener('DOMContentLoaded', () => {
    // Uncomment to start automatically
    // setupHandControl();

    // Or add a start button
    const startButton = document.createElement('button');
    startButton.textContent = 'Start Hand Control';
    startButton.style.position = 'fixed';
    startButton.style.top = '10px';
    startButton.style.left = '10px';
    startButton.style.zIndex = '1000';

    startButton.addEventListener('click', async () => {
        startButton.remove();
        await setupHandControl();
    });

    document.body.appendChild(startButton);
});