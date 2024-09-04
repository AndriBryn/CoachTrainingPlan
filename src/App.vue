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
      const rows = csv.split('\n').filter((row) => row.trim()) // Split by lines and remove empty lines
      this.clubsData = rows.slice(1).map((row) => {
        const [clubName, measurements, benchmarks, exercises] = row.split(';')

        return {
          clubName,
          measurements: measurements.split(','),
          benchmarks: benchmarks.split(',').map((benchmark) => parseFloat(benchmark)),
          exercises: exercises.split(',')
        }
      })
    },
    async updateCSV() {
      // Convert the updated data back to CSV format
      const updatedCSV = this.generateCSV()

      try {
        const response = await fetch('/.netlify/functions/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ csvContent: updatedCSV })
        })

        const result = await response.json()
        if (response.ok) {
          alert('CSV updated successfully!')
        } else {
          alert(`Error: ${result.error}`)
        }
      } catch (error) {
        console.error('Error updating file:', error)
        alert('Failed to update the CSV file.')
      }
    },
    generateCSV() {
      // Rebuild the CSV string from the current state of clubsData
      const header = 'clubs;measurements;benchmark;exercises'
      const rows = this.clubsData.map((club) => {
        const clubName = club.clubName
        const measurements = club.measurements.join(',')
        const benchmarks = club.benchmarks.join(',')
        const exercises = club.exercises.join(',')
        return `${clubName};${measurements};${benchmarks};${exercises}`
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
