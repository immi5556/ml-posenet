const fileInput = document.querySelector("#upload");

const originalImage = document.querySelector("#originalImage");
const compressedImage = document.querySelector("#compressedImage");

const resizingElement = document.querySelector("#resizingRange");
const qualityElement = document.querySelector("#qualityRange");

let compressedImageBlob;

let resizingFactor = 0.8;
let quality = 0.8;

// initializing the compressed image
compressImage(originalImage, resizingFactor, quality);

fileInput.addEventListener("change", async (e) => {
    const [file] = fileInput.files;
    // storing the original image
    originalImage.src = await fileToDataUri(file);
    // compressing the uplodaded image
    originalImage.addEventListener("load", () => {
        document.querySelector("#orig-size").innerHTML = bytesToSize(file.size);
        document.querySelector("#orig-width").innerHTML = originalImage.naturalWidth;
        document.querySelector("#orig-hgt").innerHTML = originalImage.naturalHeight;
        compressImage(originalImage, resizingFactor, quality);
    });

    return false;
});

resizingElement.oninput = (e) => {
    resizingFactor = parseInt(e.target.value) / 100;
    compressImage(originalImage, resizingFactor, quality);
};

qualityElement.oninput = (e) => {
    quality = parseInt(e.target.value) / 100;
    compressImage(originalImage, resizingFactor, quality);
};

function compressImage(imgToCompress, resizingFactor, quality) {
    // showing the compressed image
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const originalWidth = imgToCompress.width;
    const originalHeight = imgToCompress.height;

    const canvasWidth = originalWidth * resizingFactor;
    const canvasHeight = originalHeight * resizingFactor;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    context.drawImage(
        imgToCompress,
        0,
        0,
        originalWidth * resizingFactor,
        originalHeight * resizingFactor
    );

    // reducing the quality of the image
    canvas.toBlob(
        (blob) => {
            if (blob) {
                compressedImageBlob = blob;
                compressedImage.src = URL.createObjectURL(compressedImageBlob);
                document.querySelector("#size").innerHTML = bytesToSize(blob.size);
                document.querySelector("#width").innerHTML = canvas.width;
                document.querySelector("#hgt").innerHTML = canvas.height;
            }
        },
        "image/jpeg",
        quality
    );
}

function fileToDataUri(field) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            resolve(reader.result);
        });
        reader.readAsDataURL(field);
    });
}

// source: https://stackoverflow.com/a/18650828
function bytesToSize(bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

    if (bytes === 0) {
        return "0 Byte";
    }

    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));

    return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
}
