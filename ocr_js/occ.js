const setImageSrc = (image, imageFile) => {
    return new Promise((resolve, reject) => {
        const fr = new FileReader();

        fr.onload = function () {
            if (typeof fr.result !== 'string') {
                return reject(null);
            }
            image.src = fr.result;
            return resolve();
        };

        fr.onerror = reject;

        fr.readAsDataURL(imageFile);
    });
};

const recognitionImageInputElement = document.querySelector(
    '#recognition-image-input',
);
const recognitionConfidenceInputElement = document.querySelector(
    '#recognition-confidence-input',
);
const recognitionProgressElement = document.querySelector('#recognition-progress');
const recognitionTextElement = document.querySelector('#recognition-text');

const originalImageElement = document.querySelector('#original-image');
const labeledImageElement = document.querySelector('#labeled-image');

if (
    !recognitionImageInputElement ||
    !recognitionTextElement ||
    !originalImageElement ||
    !labeledImageElement ||
    !recognitionProgressElement ||
    !recognitionConfidenceInputElement
) {
    throw new Error('Missing elements');
}
var tesseract = await Tesseract.createWorker("eng", 1, {
    workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js'
});
recognitionImageInputElement.addEventListener('change', () => {
    if (!recognitionImageInputElement.files) {
        return null;
    }

    const file = recognitionImageInputElement.files[0];

    return tesseract
        .recognize(file, {
            lang: 'eng',
        })
        //.progress(({ progress, status }) => {
        //    if (!progress || !status || status !== 'recognizing text') {
        //        return null;
        //    }

        //    const p = (progress * 100).toFixed(2);

        //    recognitionProgressElement.textContent = `${status}: ${p}%`;
        //    recognitionProgressElement.value = p;
        //})
        .then(async (res) => {
            originalImageElement.innerHTML = '';
            labeledImageElement.innerHTML = '';
            recognitionTextElement.innerHTML = '';

            const paragraphsElements = res.data.paragraphs.map(({ text }) => {
                const p = document.createElement('p');

                p.textContent = text;

                return p;
            });

            recognitionTextElement.append(...paragraphsElements);

            const originalImage = document.createElement('img');

            await setImageSrc(originalImage, file);

            const labeledImage = originalImage.cloneNode(true);

            const wordsElements = res.data.words
                .filter(({ confidence }) => {
                    return confidence > parseInt(recognitionConfidenceInputElement.value, 10);
                })
                .map((word) => {
                    const div = document.createElement('div');
                    const { x0, x1, y0, y1 } = word.bbox;

                    div.classList.add('word-element');

                    Object.assign(div.style, {
                        top: `${y0}px`,
                        left: `${x0}px`,
                        width: `${x1 - x0}px`,
                        height: `${y1 - y0}px`,
                        border: '1px solid black',
                        position: 'absolute',
                    });

                    return div;
                });

            originalImageElement.appendChild(originalImage);
            labeledImageElement.appendChild(labeledImage);
            labeledImageElement.append(...wordsElements);
        });
});