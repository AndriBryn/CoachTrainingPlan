<template>
  <div class="upload-area" @dragover.prevent @drop.prevent="handleDrop">
    <p>Drag & Drop your CSV file here</p>
  </div>
  <div>
    <h1>Club Data</h1>

    <div v-if="clubsData.length">
      <div v-for="(club, index) in clubsData" :key="index" class="club">
        <h2>{{ club.clubName }}</h2>
        <h3>Measurements</h3>
        <ul>
          <li v-for="(measurement, i) in club.measurements" :key="i">
            {{ measurement }}
            <input
              type="number"
              v-model.number="club.benchmarks[i]"
              min="0"
              placeholder="Enter Benchmark"
            />
          </li>
        </ul>
        <h3>Exercises</h3>
        <ul>
          <li v-for="(exercise, i) in club.exercises" :key="i">{{ exercise }}</li>
        </ul>
      </div>
      <!-- Update Button -->
      <button @click="updateCSV">Update CSV</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      measurements: [], // List of measurements from the second CSV file
      selectedMeasurements: [], // List of selected measurement names
      benchmarks: {} // Object to store the benchmark for each selected measurement
    }
  },
  mounted() {
    this.fetchMeasurements()
  },
  methods: {
    async fetchMeasurements() {
      try {
        // Fetch the measurements from the Netlify function
        const response = await fetch('/.netlify/functions/get-measurements')
        const result = await response.json()

        // No need to parse CSV; use the measurements directly
        this.measurements = result.measurements
      } catch (error) {
        console.error('Failed to fetch measurements:', error)
      }
    },
    updateCSV() {
      if (this.selectedMeasurements.length === 0) {
        alert('Please select at least one measurement.')
        return
      }

      // Build the CSV data to update
      const updatedCSV = this.generateCSV()

      // Send the updated CSV to the update.mjs Netlify function
      fetch('/.netlify/functions/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ csvContent: updatedCSV })
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.message) {
            alert('CSV updated successfully!')
          } else {
            alert(`Error: ${result.error}`)
          }
        })
        .catch((error) => {
          console.error('Failed to update CSV:', error)
        })
    },
    generateCSV() {
      // Convert the selected measurements and their benchmarks into CSV format
      const header = 'measurements;benchmark'
      const rows = this.selectedMeasurements.map((name) => {
        const benchmark = this.benchmarks[name] || 0 // Default to 0 if not set
        return `${name};${benchmark}`
      })

      return [header, ...rows].join('\n')
    },
    handleDrop(event) {
      const file = event.dataTransfer.files[0]

      if (file && file.type === 'text/csv') {
        const reader = new FileReader()

        reader.onload = async (e) => {
          const csvContent = e.target.result

          try {
            const response = await fetch('/.netlify/functions/update', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ csvContent })
            })

            const result = await response.json()
            if (response.ok) {
              alert('File updated successfully!')
            } else {
              alert(`Error: ${result.error}`)
            }
          } catch (error) {
            console.error('Error updating file:', error)
            alert('Failed to update the file.')
          }
        }

        reader.readAsText(file)
      } else {
        alert('Please upload a valid CSV file.')
      }
    }
  }
}
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
.club {
  border: 1px solid #ccc;
  padding: 10px;
  margin-bottom: 20px;
}
input[type='number'] {
  margin-left: 10px;
}
button {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}
</style>
