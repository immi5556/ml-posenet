// Copyright 2023 The MediaPipe Authors.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//      http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
    HandLandmarker,
    FilesetResolver
} from "./mediapipe_tasks-vision.js";

const demosSection = document.getElementById("demos");

let handLandmarker = undefined;
let runningMode = "IMAGE";
//let enableWebcamButton: HTMLButtonElement;
//let webcamRunning: Boolean = false;
let enableWebcamButton;
let webcamRunning = false;

// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
const createHandLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `./hand_landmarker.task`,
            delegate: "GPU"
        },
        runningMode: runningMode,
        numHands: 2
    });
    demosSection.classList.remove("invisible");
};
createHandLandmarker();


/********************************************************************
// Demo 2: Continuously grab image from webcam stream and detect it.
********************************************************************/

const video = document.getElementById("webcam");
const canvasElement = document.getElementById(
    "output_canvas"
);
const canvasCtx = canvasElement.getContext("2d");

// Check if webcam access is supported.
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    enableWebcamButton.addEventListener("click", enableCam);
} else {
    console.warn("getUserMedia() is not supported by your browser");
}

// Enable the live webcam view and start detection.
function enableCam(event) {
    if (!handLandmarker) {
        console.log("Wait! objectDetector not loaded yet.");
        return;
    }

    if (webcamRunning === true) {
        webcamRunning = false;
        enableWebcamButton.innerText = "Enable Drawing";
    } else {
        webcamRunning = true;
        enableWebcamButton.innerText = "Disable Drawing";
    }

    // getUsermedia parameters.
    const constraints = {
        video: true
    };
    var vid_wid = document.documentElement.offsetWidth;
    var vid_hgt = document.documentElement.offsetHeight;
    //video.videoHeight = vid_hgt;
    //video.videoWidth = vid_wid;
    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
    });
    //video.requestFullscreen();
}

let lastVideoTime = -1;
let results = undefined;
console.log(video);
//var canvas_draw = document.getElementById("drawPlace");
async function predictWebcam() {
    var videoRatio = video.videoWidth / video.videoHeight;
    var width = video.offsetWidth, height = video.offsetHeight;
    var elementRatio = width / height;
    if (elementRatio > videoRatio) width = height * videoRatio;
    else height = width / videoRatio;
    canvasElement.style.width = width;
    canvasElement.style.height = height;
    canvasElement.width = width;
    canvasElement.height = height;
    setsize();
    // canvas_draw.style.width = width;
    // canvas_draw.style.height = height;
    // canvas_draw.width = width;
    // canvas_draw.height = height;
    // canvasElement.style.width = video.videoWidth;
    // canvasElement.style.height = video.videoHeight;
    // canvasElement.width = video.videoWidth;
    // canvasElement.height = video.videoHeight;
    console.log('w, h', video.videoWidth, video.videoHeight, width, height);
    // Now let's start detecting the stream.
    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await handLandmarker.setOptions({ runningMode: "VIDEO" });
    }
    let startTimeMs = performance.now();
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        results = handLandmarker.detectForVideo(video, startTimeMs);
    }
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    if (results.landmarks) {
        for (const landmarks of results.landmarks) {
            console.log('landmarks', landmarks);
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                color: "#00FF00",
                lineWidth: 5
            });
            drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 2 });
        }
    }
    canvasCtx.restore();

    // Call this function again to keep predicting when the browser is ready.
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}