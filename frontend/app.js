document.getElementById('processBtn').addEventListener('click', removeBackground);

async function removeBackground() {
  const fileInput = document.getElementById('imageUpload');
  const formData = new FormData();
  formData.append('image', fileInput.files[0]);

  const response = await fetch('http://localhost:3000/remove-bg', {
    method: 'POST',
    body: formData,
  });

  if (response.ok) {
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const outputImage = document.getElementById('outputImage');
    outputImage.src = url;
  } else {
    console.error('Failed to remove background');
  }
}
