<template>
  <div class="upload-area" @dragover.prevent @drop.prevent="handleDrop">
    <p>Drag & Drop your CSV file here</p>
  </div>
</template>

<script>
export default {
  methods: {
    handleDrop(event) {
      const file = event.dataTransfer.files[0];

      if (file && file.type === 'text/csv') {
        const reader = new FileReader();

        reader.onload = async (e) => {
          const csvContent = e.target.result;

          try {
            const response = await fetch('/.netlify/functions/update', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ csvContent }),
            });

            const result = await response.json();
            if (response.ok) {
              alert('File updated successfully!');
            } else {
              alert(`Error: ${result.error}`);
            }
          } catch (error) {
            console.error('Error updating file:', error);
            alert('Failed to update the file.');
          }
        };

        reader.readAsText(file);
      } else {
        alert('Please upload a valid CSV file.');
      }
    },
  },
};
</script>

<style scoped>
.upload-area {
  width: 100%;
  height: 200px;
  border: 2px dashed #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin: 20px 0;
}
.upload-area p {
  color: #666;
}
</style>