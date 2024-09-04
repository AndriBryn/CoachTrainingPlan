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
            {{ measurement }} (Benchmark: {{ club.benchmarks[i] }})
          </li>
        </ul>
        <h3>Exercises</h3>
        <ul>
          <li v-for="(exercise, i) in club.exercises" :key="i">{{ exercise }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      csvData: '', // Raw CSV data
      clubsData: [] // Parsed CSV data
    }
  },
  mounted() {
    this.fetchCSVData()
  },
  methods: {
    async fetchCSVData() {
      try {
        const response = await fetch('/.netlify/functions/get-csv-file')
        const result = await response.json()
        this.csvData = result.csvContent

        // Parse the CSV data
        this.parseCSV(this.csvData)
      } catch (error) {
        console.error('Failed to fetch CSV data:', error)
      }
    },
    parseCSV(csv) {
      const rows = csv.split('\n').slice(1) // Split by lines and remove header
      this.clubsData = rows.map((row) => {
        const [clubName, measurements, benchmarks, exercises] = row.split(';')

        return {
          clubName,
          measurements: measurements.split(','),
          benchmarks: benchmarks.split(','),
          exercises: exercises.split(',')
        }
      })
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
</style>
