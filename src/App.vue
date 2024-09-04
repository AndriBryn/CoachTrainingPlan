<template>
  <div class="upload-area" @dragover.prevent @drop.prevent="handleDrop">
    <p>Drag & Drop your CSV file here</p>
  </div>

  <!-- Section to show the measurements list and let users select and set benchmarks -->
  <div v-if="measurements.length > 0">
    <h1>Select Measurements and Set Benchmarks</h1>
    <div v-for="(measurement, index) in measurements" :key="index">
      <label>
        <input type="checkbox" v-model="selectedMeasurements" :value="measurement.name" />
        {{ measurement.exercise }}
      </label>
      <input
        type="number"
        v-if="selectedMeasurements.includes(measurement.name)"
        v-model.number="benchmarks[measurement.name]"
        min="0"
        placeholder="Enter Benchmark"
      />
    </div>

    <!-- Button to submit the selected measurements and benchmarks -->
    <button @click="updateCSV">Update CSV</button>
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
</style>
