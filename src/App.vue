<template>
  <div class="page">
    <!-- Display club selection, filters, and content only if no exercise is selected -->
    <div v-if="!selectedExercise">
      <!-- Filter to select which club's data to show -->
      <div v-if="clubsData.length">
        <h3>Select Club</h3>
        <select v-model="selectedClub">
          <option value="all">All Clubs</option>
          <option v-for="(club, index) in clubsData" :key="index" :value="club.clubName">
            {{ club.clubName }}
          </option>
        </select>
      </div>

      <!-- Filter options for measurements -->
      <div v-if="measurements.length && editingMode === 'measurements'">
        <h3>Filter Measurements</h3>
        <label>
          <input type="radio" value="all" v-model="filterType" />
          All
        </label>
        <label>
          <input type="radio" value="withBall" v-model="filterType" />
          With Ball
        </label>
        <label>
          <input type="radio" value="withoutBall" v-model="filterType" />
          Without Ball
        </label>
      </div>

      <!-- Filter options for exercises -->
      <div v-if="exercises.length && editingMode === 'exercises'">
        <h3>Filter Exercises</h3>

        <!-- Ability Filter Dropdown -->
        <label for="abilityFilter">Filter by Ability: </label>
        <select id="abilityFilter" v-model="selectedAbility">
          <option value="all">All Abilities</option>
          <option v-for="ability in uniqueAbilities" :key="ability" :value="ability">
            {{ ability }}
          </option>
        </select>

        <!-- Focus Filter Dropdown -->
        <label for="focusFilter">Filter by Focus: </label>
        <select id="focusFilter" v-model="selectedFocus">
          <option value="all">All Focuses</option>
          <option v-for="focus in uniqueFocuses" :key="focus" :value="focus">
            {{ focus }}
          </option>
        </select>
      </div>

      <!-- Display filtered clubs, measurements, and exercises -->
      <div v-if="filteredClubs.length && measurements.length && exercises.length">
        <div v-for="(club, index) in filteredClubs" :key="index" class="club">
          <h2>{{ club.clubName }}</h2>

          <!-- Toggle between Edit Measurements and Edit Exercises -->
          <div class="edit-toggle">
            <button
              @click="editingMode = 'measurements'"
              :class="{ active: editingMode === 'measurements' }"
            >
              Edit Measurements
            </button>
            <button
              @click="editingMode = 'exercises'"
              :class="{ active: editingMode === 'exercises' }"
            >
              Edit Exercises
            </button>
          </div>

          <!-- Display measurements if the user selected Edit Measurements -->
          <div v-if="editingMode === 'measurements'">
            <h3>Measurements</h3>
            <ul>
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

          <!-- Display exercises if the user selected Edit Exercises -->
          <div v-if="editingMode === 'exercises'">
            <h3>Exercises</h3>
            <ul>
              <li v-for="(exercise, i) in filteredExercises" :key="i">
                <div
                  style="
                    display: flex;
                    justify-content: space-between;
                    text-align: center;
                    border: solid;
                    align-items: center;
                  "
                >
                  <input type="checkbox" v-model="club.exercises" :value="exercise.exercise" />
                  <div>
                    {{ exercise.exercise }}
                  </div>
                  <div>-</div>
                  <div>Ability: {{ exercise.ability }}</div>
                  <div>-</div>
                  <div>Focus: {{ exercise.focus }}</div>
                  <!-- More Info Button -->
                  <div>
                    <button @click="viewExerciseDetails(exercise)">More Info</button>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- Button to submit the updated benchmarks and exercises -->
        <button @click="updateCSV">Update CSV</button>
      </div>
    </div>

    <!-- Display selected exercise details when an exercise is selected -->
    <div v-if="selectedExercise">
      <button @click="clearExerciseSelection">Back</button>

      <h2>{{ selectedExercise.exercise }}</h2>
      <p><strong>Ability:</strong> {{ selectedExercise.ability }}</p>
      <p><strong>Focus:</strong> {{ selectedExercise.focus }}</p>
      <p><strong>Description:</strong> {{ selectedExercise.description }}</p>

      <!-- Display image if available -->
      <div v-if="selectedExercise.image">
        <img :src="selectedExercise.image" alt="Exercise Image" class="exercise-image" />
      </div>

      <!-- Display video if available -->
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
      selectedExercise: null // Stores the selected exercise for detailed view
    }
  },
  mounted() {
    this.fetchClubData() // Fetch the initial club data
    this.fetchMeasurements() // Fetch the measurements
    this.fetchExercises() // Fetch the exercises
  },
  computed: {
    // Filter measurements based on the selected filter type
    filteredMeasurements() {
      if (this.filterType === 'withBall') {
        return this.measurements.filter((m) => m.withball)
      } else if (this.filterType === 'withoutBall') {
        return this.measurements.filter((m) => !m.withball)
      }
      return this.measurements
    },

    // Unique abilities for the dropdown filter
    uniqueAbilities() {
      return [...new Set(this.exercises.map((exercise) => exercise.ability))].filter(Boolean)
    },

    // Unique focuses for the dropdown filter
    uniqueFocuses() {
      return [...new Set(this.exercises.map((exercise) => exercise.focus))].filter(Boolean)
    },

    // Filter exercises based on selected ability and focus
    filteredExercises() {
      return this.exercises.filter((exercise) => {
        const abilityMatch =
          this.selectedAbility === 'all' || exercise.ability === this.selectedAbility
        const focusMatch = this.selectedFocus === 'all' || exercise.focus === this.selectedFocus
        return abilityMatch && focusMatch
      })
    },

    // Filter clubs based on the selected club
    filteredClubs() {
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
    },

    // When the "More Info" button is clicked, store the selected exercise and show details
    viewExerciseDetails(exercise) {
      this.selectedExercise = exercise
    },

    // Clear the selected exercise and return to the full list
    clearExerciseSelection() {
      this.selectedExercise = null
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
input[type='number'] {
  margin-left: 10px;
}
button {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
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
.page {
  width: 100%;
  border: solid;
  justify-content: center;
  text-align: center;
  align-items: center;
  align-content: center;
}
</style>
