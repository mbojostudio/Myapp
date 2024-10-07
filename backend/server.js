const express = require('express');
const multer = require('multer');
const canvas = require('canvas');
const tf = require('@tensorflow/tfjs-node');

// Setup Express
const app = express();
const port = 3000;

// Set up Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Load DeepLabV3 model
let model;
async function loadModel() {
  model = await tf.loadGraphModel('https://tfhub.dev/tensorflow/tfjs-model/deeplab/resnet_v1_101/1/default/1', {fromTFHub: true});
}
loadModel();

// Route to handle file upload and background removal
app.post('/remove-bg', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  try {
    // Load image from uploaded file
    const img = await canvas.loadImage(req.file.buffer);
    const imgCanvas = canvas.createCanvas(img.width, img.height);
    const ctx = imgCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Convert the image into a tensor
    const imageTensor = tf.browser.fromPixels(imgCanvas).expandDims(0);

    // Run inference with DeepLab model
    const result = await model.executeAsync(imageTensor);
    
    // Get segmentation map from result
    const segmentationMap = result[0].squeeze();
    
    // Get the raw pixel data from the canvas
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;
    
    // Apply the segmentation map to remove the background
    const segmentationData = segmentationMap.dataSync();
    for (let i = 0; i < segmentationData.length; i++) {
      if (segmentationData[i] !== 15) { // 15 is the background class
        data[i * 4 + 3] = 0; // Set transparency for background
      }
    }
    
    // Put modified image data back to canvas
    ctx.putImageData(imageData, 0, 0);

    // Convert the canvas back to a buffer and send the response
    imgCanvas.toBuffer((err, buffer) => {
      if (err) throw err;
      res.set('Content-Type', 'image/png');
      res.send(buffer);
    });
  } catch (error) {
    res.status(500).send('Error processing image: ' + error.message);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
