let my_cam;
let posenet;
let noseX, noseY;
let reyeX, reyeY;
let leyeX, leyeY;
let singlePose, skeleton;
let actor_img;
let specs, smoke;

function setup() {
    createCanvas(1600, 700);
    let constraints = {
        video: {
            mandatory: {
                minWidth: 1600,
                minHeight: 700
            }
        }
    };
    my_cam = createCapture(VIDEO)
    my_cam.hide();

    posenet = ml5.poseNet(my_cam, modelLoaded);
    posenet.on('pose', receivedPoses);


}

function receivedPoses(poses) {
    console.log(poses);

    if (poses.length > 0) {
        singlePose = poses[0].pose;
        skeleton = poses[0].skeleton;
    }
}

function modelLoaded() {
    console.log('Model has loaded');
}

function draw() {

    // images and videos(webcam)
    image(my_cam, 0, 0);
    fill(255, 0, 0);

    if (singlePose) {
        for (let i = 0; i < singlePose.keypoints.length; i++) {
            ellipse(singlePose.keypoints[i].position.x, singlePose.keypoints[i].position.y, 20);
        }
        stroke(255, 255, 0);
        strokeWeight(3);
        for (let j = 0; j < skeleton.length; j++) {
            line(skeleton[j][0].position.x, skeleton[j][0].position.y, skeleton[j][1].position.x, skeleton[j][1].position.y)
        }


    }



}