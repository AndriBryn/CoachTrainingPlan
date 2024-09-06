<template>
  <div class="upload-area" @dragover.prevent @drop.prevent="handleDrop">
    <p>Drag & Drop your CSV file here</p>
  </div>

  <div>
    <h1>Club Data</h1>

    <!-- Club selection and editing mode filter -->
    <div v-if="filteredClubs.length && !selectedExercise">
      <div v-if="clubsData.length">
        <h3>Select Club</h3>
        <select v-model="selectedClub">
          <option value="all">All Clubs</option>
          <option v-for="(club, index) in clubsData" :key="index" :value="club.clubName">
            {{ club.clubName }}
          </option>
        </select>
      </div>

      <!-- Toggle between Edit Measurements and Edit Exercises -->
      <div class="edit-toggle">
        <button
          @click="editingMode = 'measurements'"
          :class="{ active: editingMode === 'measurements' }"
        >
          Edit Measurements
        </button>
        <button @click="editingMode = 'exercises'" :class="{ active: editingMode === 'exercises' }">
          Edit Exercises
        </button>
      </div>

      <!-- Display filtered measurements or exercises based on editingMode -->
      <div v-if="editingMode === 'measurements'">
        <h3>Measurements</h3>
        <ul v-if="club && club.measurements && club.measurements.length">
          <li v-for="(measurement, i) in filteredMeasurements" :key="i">
            <label>
              <input
                type="checkbox"
                v-model="club.measurements"
                :value="measurement.name"
                @change="ensureBenchmark(club, measurement.name)"
              />
              {{ measurement.exercise }}
              ({{ measurement.withball ? 'With Ball' : 'Without Ball' }})
            </label>
            <input
              type="number"
              v-if="club.measurements.includes(measurement.name)"
              v-model.number="club.benchmarks[club.measurements.indexOf(measurement.name)]"
              placeholder="Enter Benchmark"
            />
          </li>
        </ul>
      </div>

      <div v-if="editingMode === 'exercises'">
        <h3>Exercises</h3>
        <ul v-if="filteredExercises.length">
          <li v-for="(exercise, i) in filteredExercises" :key="i">
            <label>
              <input type="checkbox" v-model="club.exercises" :value="exercise.exercise" />
              {{ exercise.exercise }} - Ability: {{ exercise.ability }} - Focus:
              {{ exercise.focus }}
            </label>
            <button @click="viewExerciseDetails(exercise)">More Information</button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Display the selected exercise details if selectedExercise is set -->
    <div v-if="selectedExercise" class="exercise-details">
      <button @click="selectedExercise = null">Back</button>

      <h2>{{ selectedExercise.exercise }}</h2>
      <p><strong>Ability:</strong> {{ selectedExercise.ability }}</p>
      <p><strong>Focus:</strong> {{ selectedExercise.focus }}</p>
      <p><strong>Description:</strong> {{ selectedExercise.description }}</p>

      <!-- If there's an image, display it -->
      <div v-if="selectedExercise.image">
        <img :src="selectedExercise.image" alt="Exercise Image" class="exercise-image" />
      </div>

      <!-- If there's a video, display it -->
      <div v-if="selectedExercise.video">
        <iframe
          :src="selectedExercise.video"
          width="100%"
          height="400"
          frameborder="0"
          allowfullscreen
        ></iframe>
      </div>
    </div>

    <!-- Button to submit the updated benchmarks and exercises -->
    <div
      v-if="filteredClubs.length && measurements.length && exercises.length && !selectedExercise"
    >
      <button @click="updateCSV">Update CSV</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      measurements: [], // List of all measurements from get-measurements
      exercises: [], // List of all exercises from get-exercises
      clubsData: [], // List of clubs and their data from get-csv-file
      filterType: 'all', // Filter for withBall or withoutBall or all
      selectedAbility: 'all', // Filter for exercises by ability
      selectedFocus: 'all', // Filter for exercises by focus
      selectedClub: 'all', // Filter for which club to display
      editingMode: 'measurements', // Toggle between 'measurements' and 'exercises'
      selectedExercise: null // Store the selected exercise for more information
    }
  },
  mounted() {
    this.fetchClubData() // Fetch the initial club data
    this.fetchMeasurements() // Fetch the measurements
    this.fetchExercises() // Fetch the exercises
  },
  computed: {
    filteredMeasurements() {
      // Filter measurements based on the selected filter type
      if (this.filterType === 'withBall') {
        return this.measurements.filter((m) => m.withball)
      } else if (this.filterType === 'withoutBall') {
        return this.measurements.filter((m) => !m.withball)
      }
      return this.measurements
    },
    filteredExercises() {
      // Filter exercises based on selected ability and focus
      return this.exercises.filter((exercise) => {
        const abilityMatch =
          this.selectedAbility === 'all' || exercise.ability === this.selectedAbility
        const focusMatch = this.selectedFocus === 'all' || exercise.focus === this.selectedFocus
        return abilityMatch && focusMatch
      })
    },
    filteredClubs() {
      // Filter clubs based on the selected club
      if (this.selectedClub === 'all') {
        return this.clubsData
      }
      return this.clubsData.filter((club) => club.clubName === this.selectedClub)
    }
  },
  methods: {
    async fetchClubData() {
      try {
        const response = await fetch('/.netlify/functions/get-csv-file')
        const result = await response.json()
        const csvContent = result.csvContent

        // Parse the club data
        const rows = csvContent.split('\n').slice(1) // Skip header row
        this.clubsData = rows.map((row) => {
          const [clubName, measurements, benchmarks, exercises] = row.split(';')
          return {
            clubName,
            measurements: measurements ? measurements.split(',') : [],
            benchmarks: benchmarks ? benchmarks.split(',').map(Number) : [],
            exercises: exercises ? exercises.split(',') : []
          }
        })
      } catch (error) {
        console.error('Failed to fetch club data:', error)
      }
    },

    async fetchMeasurements() {
      try {
        const response = await fetch('/.netlify/functions/get-measurements')
        const result = await response.json()
        this.measurements = result.measurements // Use measurements from backend
      } catch (error) {
        console.error('Failed to fetch measurements:', error)
      }
    },

    async fetchExercises() {
      try {
        const response = await fetch('/.netlify/functions/get-exercises')
        const result = await response.json()
        this.exercises = result.exercises // Use exercises from backend
      } catch (error) {
        console.error('Failed to fetch exercises:', error)
      }
    },

    // Ensure a benchmark is set for each added measurement
    ensureBenchmark(club, measurementName) {
      const measurementIndex = club.measurements.indexOf(measurementName)

      // If the benchmark doesn't exist for this measurement, set it to 0
      if (measurementIndex === -1) {
        club.benchmarks.push(0)
      } else if (!club.benchmarks[measurementIndex]) {
        club.benchmarks[measurementIndex] = 0
      }
    },

    generateCSV() {
      const header = 'clubs;measurements;benchmark;exercises'
      const rows = this.clubsData.map((club) => {
        const measurements = club.measurements.join(',')
        const benchmarks = club.benchmarks.join(',')
        const exercises = club.exercises.join(',')
        return `${club.clubName};${measurements};${benchmarks};${exercises}`
      })
      return [header, ...rows].join('\n') // Combine header and rows into CSV format
    },

    async updateCSV() {
      try {
        const updatedCSV = this.generateCSV()

        // Send the updated CSV to Netlify function to update the file
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
        console.error('Failed to update CSV:', error)
      }
    },

    // When the "More Information" button is clicked, set the selectedExercise to show details
    viewExerciseDetails(exercise) {
      this.selectedExercise = exercise
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
              this.fetchClubData() // Re-fetch updated club data
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
.edit-toggle {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}
.edit-toggle button {
  width: 48%;
  padding: 10px;
  cursor: pointer;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 5px;
}
.edit-toggle button.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}
.exercise-details {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
.exercise-image {
  width: 100%;
  max-width: 400px;
  height: auto;
  margin-bottom: 20px;
}
button {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}
</style>
