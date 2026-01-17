// HandGestureDrawer.js
class HandGestureDrawer {
    constructor() {
        // Canvas elements
        this.video = null;
        this.canvas = null;
        this.drawingCanvas = null;
        this.ctx = null;
        this.drawingCtx = null;
        
        // Drawing state
        this.isDrawing = false;
        this.lastPoint = null;
        this.drawingColor = '#ff0000';
        this.lineWidth = 5;
        this.isErasing = false;
        
        // Detection state
        this.isDetecting = false;
        this.model = null;
        this.hands = null;
        
        // Gesture states
        this.gestures = {
            DRAWING: 'drawing',
            ERASING: 'erasing',
            CLEAR: 'clear',
            COLOR_CHANGE: 'color_change',
            NONE: 'none'
        };
        
        // UI elements
        this.controls = null;
        this.colorPicker = null;
        
        // Drawing history for undo
        this.drawingHistory = [];
        this.maxHistory = 20;
    }

    // Initialize the drawer
    async initialize() {
        try {
            // Create UI
            this.createUI();
            
            // Load hand detection
            await this.loadHandDetection();
            
            // Initialize webcam
            await this.initializeWebcam();
            
            console.log('Hand Gesture Drawer initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize:', error);
            return false;
        }
    }

    // Create UI elements
    createUI() {
        // Create main container
        const container = document.createElement('div');
        container.id = 'hand-drawer-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #f0f0f0;
            z-index: 1000;
            font-family: Arial, sans-serif;
        `;
        
        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            background: rgba(255, 255, 255, 0.9);
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1002;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        // Create title
        const title = document.createElement('h2');
        title.textContent = '👆 Hand Gesture Drawing Canvas';
        title.style.margin = '0';
        title.style.color = '#333';
        
        // Create controls container
        this.controls = document.createElement('div');
        this.controls.style.cssText = `
            display: flex;
            gap: 10px;
            align-items: center;
        `;
        
        // Create color picker
        this.colorPicker = document.createElement('input');
        this.colorPicker.type = 'color';
        this.colorPicker.value = this.drawingColor;
        this.colorPicker.id = 'drawing-color';
        this.colorPicker.style.cssText = `
            width: 40px;
            height: 40px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;
        
        // Create line width control
        const lineWidthControl = document.createElement('input');
        lineWidthControl.type = 'range';
        lineWidthControl.min = '1';
        lineWidthControl.max = '20';
        lineWidthControl.value = this.lineWidth;
        lineWidthControl.id = 'line-width';
        lineWidthControl.style.cssText = `
            width: 100px;
            cursor: pointer;
        `;
        
        // Create clear button
        const clearBtn = document.createElement('button');
        clearBtn.textContent = '🗑️ Clear';
        clearBtn.style.cssText = `
            padding: 10px 15px;
            border: none;
            background: #ff4444;
            color: white;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        `;
        
        // Create undo button
        const undoBtn = document.createElement('button');
        undoBtn.textContent = '↶ Undo';
        undoBtn.style.cssText = `
            padding: 10px 15px;
            border: none;
            background: #4444ff;
            color: white;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        `;
        
        // Create toggle camera button
        const toggleCamBtn = document.createElement('button');
        toggleCamBtn.textContent = '📹 Toggle Camera';
        toggleCamBtn.style.cssText = `
            padding: 10px 15px;
            border: none;
            background: #44aa44;
            color: white;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        `;
        
        // Add event listeners
        this.colorPicker.addEventListener('input', (e) => {
            this.drawingColor = e.target.value;
            this.isErasing = false;
        });
        
        lineWidthControl.addEventListener('input', (e) => {
            this.lineWidth = parseInt(e.target.value);
        });
        
        clearBtn.addEventListener('click', () => {
            this.clearCanvas();
        });
        
        undoBtn.addEventListener('click', () => {
            this.undo();
        });
        
        toggleCamBtn.addEventListener('click', () => {
            this.toggleCamera();
        });
        
        // Assemble controls
        this.controls.appendChild(this.colorPicker);
        this.controls.appendChild(document.createTextNode('Size:'));
        this.controls.appendChild(lineWidthControl);
        this.controls.appendChild(clearBtn);
        this.controls.appendChild(undoBtn);
        this.controls.appendChild(toggleCamBtn);
        
        // Assemble header
        header.appendChild(title);
        header.appendChild(this.controls);
        
        // Create video container
        const videoContainer = document.createElement('div');
        videoContainer.style.cssText = `
            position: absolute;
            top: 80px;
            right: 20px;
            width: 320px;
            height: 240px;
            z-index: 1001;
        `;
        
        // Create video element
        this.video = document.createElement('video');
        this.video.autoplay = true;
        this.video.playsinline = true;
        this.video.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 10px;
            border: 3px solid #44aa44;
            transform: scaleX(-1); /* Mirror effect */
        `;
        
        // Create hand detection canvas
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 10px;
            pointer-events: none;
        `;
        
        // Create drawing canvas
        this.drawingCanvas = document.createElement('canvas');
        this.drawingCtx = this.drawingCanvas.getContext('2d');
        this.drawingCanvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            cursor: crosshair;
            z-index: 1000;
        `;
        
        // Set canvas dimensions
        this.drawingCanvas.width = window.innerWidth;
        this.drawingCanvas.height = window.innerHeight;
        
        // Initialize drawing context
        this.drawingCtx.lineCap = 'round';
        this.drawingCtx.lineJoin = 'round';
        this.drawingCtx.strokeStyle = this.drawingColor;
        this.drawingCtx.lineWidth = this.lineWidth;
        
        // Create instructions
        const instructions = document.createElement('div');
        instructions.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 10px;
            max-width: 300px;
            z-index: 1001;
        `;
        
        instructions.innerHTML = `
            <h3 style="margin-top: 0;">🎨 Gesture Guide:</h3>
            <ul style="padding-left: 20px; margin-bottom: 0;">
                <li><strong>👆 Pointing:</strong> Draw on canvas</li>
                <li><strong>✊ Fist:</strong> Clear canvas</li>
                <li><strong>✌️ Two fingers:</strong> Erase mode</li>
                <li><strong>🖐️ Open palm:</strong> Color change</li>
                <li><strong>👍 Thumbs up:</strong> Save drawing</li>
            </ul>
        `;
        
        // Assemble everything
        videoContainer.appendChild(this.video);
        videoContainer.appendChild(this.canvas);
        container.appendChild(header);
        container.appendChild(this.drawingCanvas);
        container.appendChild(videoContainer);
        container.appendChild(instructions);
        
        document.body.appendChild(container);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.drawingCanvas.width = window.innerWidth;
            this.drawingCanvas.height = window.innerHeight;
            this.saveCanvasState();
        });
    }

    // Load hand detection
    async loadHandDetection() {
        // Try to load using the correct API
        try {
            // Load TensorFlow.js and handpose from CDN
            await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js');
            await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/handpose@latest/dist/handpose.min.js');
            
            // Check if handpose is available
            if (typeof handpose !== 'undefined') {
                console.log('Loading handpose model...');
                this.model = await handpose.load();
                console.log('Handpose model loaded successfully');
                return true;
            }
        } catch (error) {
            console.warn('Could not load handpose, trying alternative method...', error);
        }
        
        // Fallback to MediaPipe Hands
        try {
            await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands@latest/hands.js');
            
            if (typeof Hands !== 'undefined') {
                console.log('Loading MediaPipe Hands...');
                this.hands = new Hands({
                    locateFile: (file) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@latest/${file}`;
                    }
                });
                
                this.hands.setOptions({
                    maxNumHands: 1,
                    modelComplexity: 1,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });
                
                this.hands.onResults((results) => this.onMediaPipeResults(results));
                console.log('MediaPipe Hands loaded successfully');
                return true;
            }
        } catch (error) {
            console.error('Failed to load any hand detection model:', error);
            throw error;
        }
    }

    // Load script helper
    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Initialize webcam
    async initializeWebcam() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });
            
            this.video.srcObject = stream;
            
            return new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.video.play();
                    
                    // Set canvas dimensions to match video
                    this.canvas.width = this.video.videoWidth;
                    this.canvas.height = this.video.videoHeight;
                    
                    // Start detection
                    this.startDetection();
                    resolve(true);
                };
            });
        } catch (error) {
            console.error('Error accessing webcam:', error);
            throw error;
        }
    }

    // Start hand detection
    startDetection() {
        this.isDetecting = true;
        
        if (this.hands) {
            // Start MediaPipe camera
            this.camera = new Camera(this.video, {
                onFrame: async () => {
                    if (this.hands && this.isDetecting) {
                        await this.hands.send({image: this.video});
                    }
                },
                width: this.video.videoWidth,
                height: this.video.videoHeight
            });
            this.camera.start();
        } else if (this.model) {
            // Start handpose detection loop
            this.detectHandsLoop();
        }
    }

    // Detection loop for handpose
    async detectHandsLoop() {
        if (!this.isDetecting || !this.model) return;
        
        try {
            // Make sure video is ready
            if (this.video.readyState >= 2) {
                // Draw video frame
                this.ctx.save();
                this.ctx.scale(-1, 1); // Mirror
                this.ctx.drawImage(this.video, -this.canvas.width, 0, this.canvas.width, this.canvas.height);
                this.ctx.restore();
                
                // Get predictions
                const predictions = await this.model.estimateHands(this.video);
                
                // Draw landmarks and process gestures
                if (predictions && predictions.length > 0) {
                    const landmarks = predictions[0].landmarks;
                    this.drawHandLandmarks(landmarks);
                    this.processHandGesture(landmarks);
                }
            }
        } catch (error) {
            console.error('Detection error:', error);
        }
        
        // Continue loop
        requestAnimationFrame(() => this.detectHandsLoop());
    }

    // Process MediaPipe results
    onMediaPipeResults(results) {
        if (!this.isDetecting) return;
        
        // Draw video frame
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.scale(-1, 1); // Mirror
        this.ctx.drawImage(results.image, -this.canvas.width, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
        
        // Process landmarks if detected
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            this.drawMediaPipeLandmarks(landmarks);
            this.processMediaPipeGesture(landmarks);
        }
    }

    // Draw hand landmarks for handpose
    drawHandLandmarks(landmarks) {
        if (!landmarks || !this.ctx) return;
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        // Draw all landmarks
        landmarks.forEach((landmark, index) => {
            // Convert to mirrored coordinates
            const x = this.canvas.width - landmark[0];
            const y = landmark[1];
            
            // Draw point
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Highlight index finger tip (landmark 8)
            if (index === 8) {
                this.ctx.fillStyle = '#ff0000';
                this.ctx.beginPath();
                this.ctx.arc(x, y, 8, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.fillStyle = '#00ff00';
            }
        });
    }

    // Draw MediaPipe landmarks
    drawMediaPipeLandmarks(landmarks) {
        if (!landmarks || !this.ctx) return;
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        // Draw all landmarks
        landmarks.forEach((landmark, index) => {
            const x = landmark.x * this.canvas.width;
            const y = landmark.y * this.canvas.height;
            
            // Convert to mirrored coordinates
            const mirroredX = this.canvas.width - x;
            
            // Draw point
            this.ctx.beginPath();
            this.ctx.arc(mirroredX, y, 4, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Highlight index finger tip (landmark 8)
            if (index === 8) {
                this.ctx.fillStyle = '#ff0000';
                this.ctx.beginPath();
                this.ctx.arc(mirroredX, y, 8, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.fillStyle = '#00ff00';
            }
        });
    }

    // Process hand gesture for drawing
    processHandGesture(landmarks) {
        if (!landmarks) return;
        
        // Get index finger tip (landmark 8)
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];
        const middleTip = landmarks[12];
        
        // Map to screen coordinates
        const screenX = (1 - (indexTip[0] / this.video.videoWidth)) * window.innerWidth;
        const screenY = (indexTip[1] / this.video.videoHeight) * window.innerHeight;
        
        // Calculate distances for gesture recognition
        const pinchDist = this.calculateDistance(indexTip, thumbTip);
        const twoFingerDist = this.calculateDistance(indexTip, middleTip);
        
        // Detect gesture
        const gesture = this.detectDrawingGesture(landmarks, pinchDist, twoFingerDist);
        
        // Process based on gesture
        switch(gesture) {
            case this.gestures.DRAWING:
                this.drawAt(screenX, screenY);
                break;
                
            case this.gestures.ERASING:
                this.isErasing = true;
                this.eraseAt(screenX, screenY);
                break;
                
            case this.gestures.CLEAR:
                this.clearCanvas();
                break;
                
            case this.gestures.COLOR_CHANGE:
                this.changeColor();
                break;
                
            case this.gestures.NONE:
                this.stopDrawing();
                break;
        }
    }

    // Process MediaPipe gesture
    processMediaPipeGesture(landmarks) {
        if (!landmarks) return;
        
        // Get index finger tip (landmark 8)
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];
        const middleTip = landmarks[12];
        
        // Map to screen coordinates
        const screenX = (1 - indexTip.x) * window.innerWidth;
        const screenY = indexTip.y * window.innerHeight;
        
        // Calculate distances
        const pinchDist = Math.sqrt(
            Math.pow(indexTip.x - thumbTip.x, 2) + 
            Math.pow(indexTip.y - thumbTip.y, 2)
        ) * this.canvas.width;
        
        const twoFingerDist = Math.sqrt(
            Math.pow(indexTip.x - middleTip.x, 2) + 
            Math.pow(indexTip.y - middleTip.y, 2)
        ) * this.canvas.width;
        
        // Detect gesture (simplified for MediaPipe)
        let gesture = this.gestures.NONE;
        
        // Check finger extensions
        const indexExtended = indexTip.y < landmarks[7].y;
        const middleExtended = middleTip.y < landmarks[11].y;
        const ringExtended = landmarks[16].y < landmarks[15].y;
        const pinkyExtended = landmarks[20].y < landmarks[19].y;
        const thumbExtended = thumbTip.x > landmarks[3].x;
        
        if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
            // Only index finger extended - drawing
            gesture = this.gestures.DRAWING;
        } else if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
            // Two fingers extended - erasing
            gesture = this.gestures.ERASING;
        } else if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
            // All fingers folded - clear
            gesture = this.gestures.CLEAR;
        } else if (indexExtended && middleExtended && ringExtended && pinkyExtended && thumbExtended) {
            // All fingers extended - color change
            gesture = this.gestures.COLOR_CHANGE;
        }
        
        // Process gesture
        switch(gesture) {
            case this.gestures.DRAWING:
                this.drawAt(screenX, screenY);
                break;
                
            case this.gestures.ERASING:
                this.isErasing = true;
                this.eraseAt(screenX, screenY);
                break;
                
            case this.gestures.CLEAR:
                this.clearCanvas();
                break;
                
            case this.gestures.COLOR_CHANGE:
                this.changeColor();
                break;
                
            case this.gestures.NONE:
                this.stopDrawing();
                break;
        }
    }

    // Detect drawing gesture
    detectDrawingGesture(landmarks, pinchDist, twoFingerDist) {
        const fingerTips = [8, 12, 16, 20]; // Index, middle, ring, pinky
        
        // Check finger extensions
        let extendedFingers = 0;
        let isIndexExtended = false;
        let isMiddleExtended = false;
        
        fingerTips.forEach((tip, index) => {
            const tipY = landmarks[tip][1];
            const pipY = landmarks[tip - 2][1];
            
            if (tipY < pipY) {
                extendedFingers++;
                if (index === 0) isIndexExtended = true;
                if (index === 1) isMiddleExtended = true;
            }
        });
        
        // Check thumb
        const thumbTip = landmarks[4];
        const thumbPip = landmarks[2];
        const thumbExtended = thumbTip[0] > thumbPip[0];
        
        // Detect gestures
        if (extendedFingers === 1 && isIndexExtended) {
            return this.gestures.DRAWING;
        } else if (extendedFingers === 2 && isIndexExtended && isMiddleExtended) {
            return this.gestures.ERASING;
        } else if (extendedFingers === 0) {
            return this.gestures.CLEAR;
        } else if (extendedFingers === 4 && thumbExtended) {
            return this.gestures.COLOR_CHANGE;
        }
        
        return this.gestures.NONE;
    }

    // Calculate distance between two points
    calculateDistance(point1, point2) {
        const dx = point1[0] - point2[0];
        const dy = point1[1] - point2[1];
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Draw at position
    drawAt(x, y) {
        if (!this.drawingCtx) return;
        
        // Set drawing style
        if (this.isErasing) {
            this.drawingCtx.globalCompositeOperation = 'destination-out';
            this.drawingCtx.lineWidth = this.lineWidth * 3;
        } else {
            this.drawingCtx.globalCompositeOperation = 'source-over';
            this.drawingCtx.strokeStyle = this.drawingColor;
            this.drawingCtx.lineWidth = this.lineWidth;
        }
        
        if (!this.isDrawing) {
            // Start new path
            this.isDrawing = true;
            this.drawingCtx.beginPath();
            this.drawingCtx.moveTo(x, y);
            this.saveCanvasState();
        } else {
            // Continue path
            this.drawingCtx.lineTo(x, y);
            this.drawingCtx.stroke();
        }
        
        this.lastPoint = { x, y };
    }

    // Erase at position
    eraseAt(x, y) {
        this.drawAt(x, y); // Uses same logic with different composite operation
    }

    // Stop drawing
    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.lastPoint = null;
            this.isErasing = false;
        }
    }

    // Clear canvas
    clearCanvas() {
        if (!this.drawingCtx) return;
        
        // Save current state to history
        this.saveCanvasState();
        
        // Clear canvas
        this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        
        // Reset drawing state
        this.isDrawing = false;
        this.lastPoint = null;
        this.isErasing = false;
    }

    // Change drawing color
    changeColor() {
        // Cycle through colors
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800'];
        const currentIndex = colors.indexOf(this.drawingColor);
        const nextIndex = (currentIndex + 1) % colors.length;
        
        this.drawingColor = colors[nextIndex];
        this.isErasing = false;
        
        // Update color picker
        if (this.colorPicker) {
            this.colorPicker.value = this.drawingColor;
        }
    }

    // Save canvas state for undo
    saveCanvasState() {
        if (!this.drawingCanvas) return;
        
        const imageData = this.drawingCtx.getImageData(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        this.drawingHistory.push(imageData);
        
        // Keep only last n states
        if (this.drawingHistory.length > this.maxHistory) {
            this.drawingHistory.shift();
        }
    }

    // Undo last action
    undo() {
        if (this.drawingHistory.length > 1) {
            // Remove current state
            this.drawingHistory.pop();
            
            // Restore previous state
            const previousState = this.drawingHistory[this.drawingHistory.length - 1];
            this.drawingCtx.putImageData(previousState, 0, 0);
        } else if (this.drawingHistory.length === 1) {
            // Only initial state remains, clear canvas
            this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
            this.drawingHistory = [this.drawingCtx.getImageData(0, 0, this.drawingCanvas.width, this.drawingCanvas.height)];
        }
    }

    // Toggle camera visibility
    toggleCamera() {
        if (this.video) {
            this.video.style.display = this.video.style.display === 'none' ? 'block' : 'none';
            this.canvas.style.display = this.canvas.style.display === 'none' ? 'block' : 'none';
        }
    }

    // Save drawing as image
    saveDrawing() {
        if (!this.drawingCanvas) return;
        
        const link = document.createElement('a');
        link.download = 'hand-drawing.png';
        link.href = this.drawingCanvas.toDataURL('image/png');
        link.click();
    }

    // Cleanup
    destroy() {
        this.isDetecting = false;
        
        // Stop camera
        if (this.video && this.video.srcObject) {
            const stream = this.video.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
        }
        
        // Remove UI
        const container = document.getElementById('hand-drawer-container');
        if (container) {
            container.remove();
        }
    }
}

// Global instance
let handDrawerInstance = null;

// Initialize function
async function initializeHandDrawing() {
    if (handDrawerInstance) {
        handDrawerInstance.destroy();
    }
    
    handDrawerInstance = new HandGestureDrawer();
    const success = await handDrawerInstance.initialize();
    
    if (success) {
        console.log('Hand Drawing Canvas is ready!');
        console.log('Use your pointer finger to draw on the screen.');
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!handDrawerInstance) return;
            
            switch(e.key) {
                case 'Escape':
                    handDrawerInstance.destroy();
                    handDrawerInstance = null;
                    break;
                case 'c':
                    handDrawerInstance.clearCanvas();
                    break;
                case 'z':
                    if (e.ctrlKey || e.metaKey) {
                        handDrawerInstance.undo();
                    }
                    break;
                case 's':
                    handDrawerInstance.saveDrawing();
                    break;
                case 'v':
                    handDrawerInstance.toggleCamera();
                    break;
            }
        });
    }
    
    return handDrawerInstance;
}

// Auto-initialize when page loads (optional)
// window.addEventListener('DOMContentLoaded', () => {
//     // Create a button to start
//     const startBtn = document.createElement('button');
//     startBtn.textContent = '🎨 Start Hand Drawing';
//     startBtn.style.cssText = `
//         position: fixed;
//         top: 50%;
//         left: 50%;
//         transform: translate(-50%, -50%);
//         padding: 20px 40px;
//         font-size: 24px;
//         background: linear-gradient(45deg, #ff3366, #33ccff);
//         color: white;
//         border: none;
//         border-radius: 50px;
//         cursor: pointer;
//         box-shadow: 0 10px 30px rgba(0,0,0,0.3);
//         z-index: 9999;
//     `;
    
//     startBtn.onclick = async () => {
//         startBtn.remove();
//         await initializeHandDrawing();
//     };
    
//     document.body.appendChild(startBtn);
// });