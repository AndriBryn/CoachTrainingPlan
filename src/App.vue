<template>
  <div class="page">
    <!-- Display club selection, filters, and content only if no exercise is selected -->
    <div v-if="!selectedExercise">
      <!-- Filter to select which club's data to show -->
      <div v-if="clubsData.length">
        <h3>Select Club</h3>
        <select v-model="selectedClub">
          <option v-for="(club, index) in clubsData" :key="index" :value="club.clubName">
            {{ club.clubName }}
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
          <div
            v-if="exercises.length && editingMode === 'exercises'"
            style="background-color: #2f2f3e; border-radius: 5px"
          >
            <h3 style="font-size: x-large; font-weight: bold">Exercise Filters</h3>
            <div
              style="
                display: flex;
                justify-content: space-between;
                text-align: center;
                align-items: center;
                font-weight: bold;
                padding-bottom: 10px;
                margin-bottom: 10px;
                font-size: x-large;
              "
            >
              <!-- Ability Filter Dropdown -->
              <div style="width: 50%">
                <label for="abilityFilter">Filter by Ability: </label>
                <select id="abilityFilter" v-model="selectedAbility">
                  <option value="all">All Abilities</option>
                  <option v-for="ability in uniqueAbilities" :key="ability" :value="ability">
                    {{ ability }}
                  </option>
                </select>
              </div>

              <!-- Focus Filter Dropdown -->
              <div style="width: 50%">
                <label for="focusFilter">Filter by Focus: </label>
                <select id="focusFilter" v-model="selectedFocus">
                  <option value="all">All Focuses</option>
                  <option v-for="focus in uniqueFocuses" :key="focus" :value="focus">
                    {{ focus }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Display measurements if the user selected Edit Measurements -->
          <div v-if="editingMode === 'measurements'">
            <ul>
              <li v-for="(measurement, i) in filteredMeasurements" :key="i">
                <div style="display: flex; align-items: center">
                  <!-- Conditional Checkmark Icon with Tooltip -->
                  <div class="tooltip">
                    <img
                      :src="
                        club.measurements.includes(measurement.name)
                          ? '/images/checkmark.png'
                          : '/images/checkmark-grey.png'
                      "
                      @click="toggleMeasurementSelection(club, measurement.name)"
                      class="icon"
                      style="cursor: pointer; margin-right: 10px"
                      :alt="
                        club.measurements.includes(measurement.name)
                          ? 'Remove Measurement'
                          : 'Add Measurement'
                      "
                    />
                    <span class="tooltiptext">{{
                      club.measurements.includes(measurement.name)
                        ? 'Remove Measurement'
                        : 'Add Measurement'
                    }}</span>
                  </div>
                  <label>
                    {{ measurement.exercise }}
                    ({{ measurement.withball ? 'With Ball' : 'Without Ball' }})
                  </label>
                </div>
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
            <!-- Add headers -->
            <div
              style="
                display: flex;
                justify-content: space-between;
                text-align: center;
                align-items: center;
                font-weight: bold;
                padding-bottom: 10px;
                margin-bottom: 10px;
                font-size: x-large;
              "
            >
              <div style="width: 300px; margin-left: 95px">Exercise</div>
              <div style="width: 30px"></div>
              <div style="width: 300px">Ability</div>
              <div style="width: 30px"></div>
              <div style="width: 300px">Focus</div>
              <div style="width: 220px">Other Info</div>
            </div>

            <ul>
              <li v-for="(exercise, i) in filteredExercises" :key="i">
                <div
                  style="
                    display: flex;
                    justify-content: space-between;
                    text-align: center;
                    align-items: center;
                    margin-bottom: 0px;
                    font-size: large;
                  "
                >
                  <!-- Conditional Checkmark Icon with Tooltip for Exercises -->
                  <div class="tooltip">
                    <img
                      :src="
                        club.exercises.includes(exercise.exercise)
                          ? '/images/checkmark.png'
                          : '/images/checkmark-grey.png'
                      "
                      @click="toggleExerciseSelection(club, exercise.exercise)"
                      class="icon"
                      style="cursor: pointer; margin-right: 10px"
                      :alt="
                        club.exercises.includes(exercise.exercise)
                          ? 'Remove Exercise'
                          : 'Add Exercise'
                      "
                    />
                    <span class="tooltiptext">{{
                      club.exercises.includes(exercise.exercise)
                        ? 'Remove Exercise'
                        : 'Add Exercise'
                    }}</span>
                  </div>
                  <div style="width: 250px">{{ exercise.exercise }}</div>
                  <div style="width: 15px">-</div>
                  <div style="width: 250px">{{ exercise.ability }}</div>
                  <div style="width: 15px">-</div>
                  <div style="width: 250px">{{ exercise.focus }}</div>
                  <div style="display: flex">
                    <div class="image-container-2">
                      <img :src="exercise.image" alt="Exercise Image" class="exercise-image-2" />
                    </div>
                    <div style="display: flex; flex-direction: column">
                      <!-- More Info Button -->
                      <div
                        style="
                          display: flex;
                          justify-content: center;
                          align-items: center;
                          height: 100%;
                        "
                      >
                        <button @click="viewExerciseDetails(exercise)">More Info</button>
                      </div>
                      <div style="display: flex; align-items: center; justify-content: center">
                        <!-- Intensity Display with Tooltip -->
                        <div class="tooltip-2">
                          <div
                            v-for="(icon, index) in getIntensityIcons(exercise.intensity)"
                            :key="index"
                          >
                            <img
                              :src="icon"
                              alt="Intensity Lightning Icon"
                              class="icon"
                              style="width: 15px; height: 15px"
                            />
                          </div>
                          <span class="tooltiptext">Intensity: {{ exercise.intensity }}</span>
                        </div>
                      </div>
                    </div>
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
    <div v-if="selectedExercise" class="exercise-details-container">
      <!-- Left Arrow Button for Previous Exercise -->
      <button @click="previousExercise" class="arrow-button left-arrow">
        <span v-if="previousExerciseName" style="color: white"
          >Previous: {{ previousExerciseName }}</span
        >
        <img src="/images/LeftWhite.png" alt="Previous Exercise" class="arrow-image" />
      </button>

      <div class="exercise-details">
        <button @click="clearExerciseSelection" class="back-button">Back to Edit Exercises</button>

        <!-- Add the indicators for "Has Video" and "Has Image" -->
        <div style="justify-content: center; align-items: center">
          <div class="indicators">
            <div></div>
            <!-- Add "Add Exercise" and "Remove Exercise" buttons styled like in Edit Exercises -->
            <div class="tooltip">
              <img
                :src="
                  !currentClub.exercises.includes(selectedExercise.exercise)
                    ? '/images/checkmark-grey.png'
                    : '/images/checkmark.png'
                "
                :alt="
                  !currentClub.exercises.includes(selectedExercise.exercise)
                    ? 'Add Exercise'
                    : 'Remove Exercise'
                "
                class="icon"
                @click="toggleExerciseSelection(currentClub, selectedExercise.exercise)"
                style="cursor: pointer"
              />
              <span class="tooltiptext">
                {{
                  !currentClub.exercises.includes(selectedExercise.exercise)
                    ? 'Add Exercise'
                    : 'Remove Exercise'
                }}
              </span>
            </div>
            <div></div>
          </div>

          <!-- Display image if available -->
          <div class="image-container" style="margin-top: 20px">
            <img :src="selectedExercise.image" alt="Exercise Image" class="exercise-image" />
            <!-- Show play button overlay if a video is available -->
            <img
              v-if="selectedExercise && selectedExercise.video"
              src="/images/PlayButtonGreen.png"
              alt="Play Button"
              class="play-button"
              @click="playVideo(selectedExercise)"
            />
          </div>

          <!-- Intensity Display with Tooltip -->
          <div
            style="display: flex; justify-content: center; align-items: center; margin-top: 20px"
          >
            <div class="tooltip">
              <div
                v-for="(icon, index) in getIntensityIcons(selectedExercise.intensity)"
                :key="index"
              >
                <img
                  :src="icon"
                  alt="Intensity Lightning Icon"
                  class="icon"
                  style="width: 30px; height: 30px"
                />
              </div>
              <span class="tooltiptext">Intensity: {{ selectedExercise.intensity }}</span>
            </div>
          </div>

          <h2>{{ selectedExercise.exercise }}</h2>
          <p>
            Ability: {{ selectedExercise.ability }} - Focus: {{ selectedExercise.focus }} -
            {{ selectedExercise.sets || 'Sets: Not specified' }}
          </p>
          <p>Description: {{ selectedExercise.description }}</p>
        </div>

        <!-- Modal for Vimeo Video -->
        <div v-if="showVideo" class="modal-overlay" @click="closeVideo">
          <div class="modal-content" @click.stop>
            <iframe
              ref="videoIframe"
              v-if="selectedExercise && selectedExercise.video"
              :src="modifiedVideoUrl"
              width="100%"
              height="auto"
              frameborder="0"
              allowfullscreen
            ></iframe>
            <div class="video-controls">
              <button @click="closeVideo">Close Video</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Arrow Button for Next Exercise -->
      <button @click="nextExercise" class="arrow-button right-arrow">
        <span v-if="nextExerciseName" style="color: white">Next: {{ nextExerciseName }}</span>
        <img src="/images/RightWhite.png" alt="Next Exercise" class="arrow-image" />
      </button>
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
      selectedExercise: null, // Stores the selected exercise for detailed view
      currentExerciseIndex: 0, // Track the index of the selected exercise
      showVideo: false, // Controls the display of the video modal
      modifiedVideoUrl: '' // Stores the modified video URL for autoplay
    }
  },
  mounted() {
    this.fetchClubData() // Fetch the initial club data
    this.fetchMeasurements() // Fetch the measurements
    this.fetchExercises() // Fetch the exercises
  },
  computed: {
    previousExerciseName() {
      if (this.filteredExercises.length > 0 && this.selectedExercise) {
        const prevIndex =
          (this.currentExerciseIndex - 1 + this.filteredExercises.length) %
          this.filteredExercises.length
        return this.filteredExercises[prevIndex]?.exercise || ''
      }
      return ''
    },

    // Get the name of the next exercise
    nextExerciseName() {
      if (this.filteredExercises.length > 0 && this.selectedExercise) {
        const nextIndex = (this.currentExerciseIndex + 1) % this.filteredExercises.length
        return this.filteredExercises[nextIndex]?.exercise || ''
      }
      return ''
    },
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
    },
    currentClub() {
      return this.filteredClubs.find((club) => club.clubName === this.selectedClub) || {}
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

        // Set the first club as selected after the data is fetched
        if (this.clubsData.length > 0) {
          this.selectedClub = this.clubsData[0].clubName
        }
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
        this.exercises = result.exercises.map((exercise) => ({
          ...exercise,
          intensity: parseInt(exercise.intensity, 10) || 0 // Ensure intensity is a number, default to 0
        }))
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
    // When the "More Info" button is clicked, store the selected exercise and show details
    viewExerciseDetails(exercise) {
      this.selectedExercise = exercise
      this.currentExerciseIndex = this.filteredExercises.indexOf(exercise)
    },
    // Clear the selected exercise and return to the full list
    clearExerciseSelection() {
      this.selectedExercise = null
    },
    toggleMeasurementSelection(club, measurementName) {
      // Check if club.measurements is defined
      if (!club.measurements) {
        this.$set(club, 'measurements', [])
      }
      const index = club.measurements.indexOf(measurementName)
      if (index === -1) {
        // Add measurement and ensure benchmarks is updated reactively
        club.measurements.push(measurementName)
        if (!club.benchmarks) {
          this.$set(club, 'benchmarks', [])
        }
        club.benchmarks.push(0)
      } else {
        // Remove measurement and the corresponding benchmark
        club.measurements.splice(index, 1)
        club.benchmarks.splice(index, 1)
      }
    },

    // Toggle selection for exercises
    toggleExerciseSelection(club, exerciseName) {
      // Check if club.exercises is defined
      if (!club.exercises) {
        this.$set(club, 'exercises', [])
      }
      const index = club.exercises.indexOf(exerciseName)
      if (index === -1) {
        // Add exercise to the club.exercises array
        club.exercises.push(exerciseName)
      } else {
        // Remove the exercise from the club.exercises array
        club.exercises.splice(index, 1)
      }
    },
    nextExercise() {
      if (this.filteredExercises.length > 0) {
        this.currentExerciseIndex = (this.currentExerciseIndex + 1) % this.filteredExercises.length
        this.selectedExercise = this.filteredExercises[this.currentExerciseIndex]
      }
    },
    previousExercise() {
      if (this.filteredExercises.length > 0) {
        this.currentExerciseIndex =
          (this.currentExerciseIndex - 1 + this.filteredExercises.length) %
          this.filteredExercises.length
        this.selectedExercise = this.filteredExercises[this.currentExerciseIndex]
      }
    },
    playVideo(exercise) {
      if (exercise.video) {
        // Modify the video URL to ensure autoplay and mute
        let videoUrl = exercise.video.replace('autoplay=1', 'autoplay=1&muted=1')
        this.modifiedVideoUrl = videoUrl
        this.showVideo = true
      }
    },
    closeVideo() {
      this.showVideo = false
    },
    getIntensityIcons(intensity) {
      const icons = []
      for (let i = 0; i < 5; i++) {
        // Push green icon for intensity level and grey for the remaining
        if (i < intensity) {
          icons.push('/images/lightning.png') // Green lightning bolt
        } else {
          icons.push('/images/lightning-grey.png') // Grey lightning bolt
        }
      }
      return icons
    }
  }
}
</script>

<style scoped>
select {
  text-align: center;
  padding: 10px 5px;
  font-size: 16px;
  cursor: pointer;
  background-color: #222232;
  font-weight: bold;
  color: #79e098;
  border: 2px solid #79e098;
  border-radius: 5px;
  width: 220px;
}

option {
  background-color: #222232;
  color: #79e098;
}
ul {
  list-style-type: none;
  padding: 0; /* Optional: removes left padding */
}

li {
  list-style-type: none;
  padding: 5px;
  background-color: #2f2f3e;
  margin: 5px;
  border-radius: 5px;
}
.club {
  padding: 10px;
  margin-bottom: 20px;
}
.edit-toggle {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  background-color: #2f2f3e;
  padding: 10px;
  border-radius: 5px;
}
.edit-toggle button {
  width: 48%;
  padding: 10px;
  cursor: pointer;
  background-color: #222232;
  border: 2px solid #79e098;
  border-radius: 5px;
  color: #7a7a84;
}
.edit-toggle button.active {
  background-color: none;
  font-weight: bold;
  color: #79e098;
  border-color: #79e098;
}
input[type='number'] {
  margin-left: 10px;
}
button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background-color: #222232;
  font-weight: bold;
  color: #79e098;
  border-color: #79e098;
  border-radius: 5px;
}
.icon {
  width: 50px;
  height: 50px;
}
.tooltip {
  width: 60px;
  position: relative;
  display: inline-flex; /* Use flexbox to align contents vertically */
  align-items: center; /* Center the content vertically */
  justify-content: center; /* Optionally, center horizontally too */
}

.tooltip img {
  vertical-align: middle; /* Ensures image aligns vertically in the line */
  width: 50px;
  height: 50px;
}
.tooltip .tooltiptext {
  visibility: hidden;
  width: 120px;
  background-color: #555;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px;
  position: absolute;
  z-index: 1;
  bottom: 125%; /* Position above the icon */
  left: 50%;
  margin-left: -60px;
  opacity: 0;
  transition: opacity 0.3s;
}
.tooltip:hover .tooltiptext {
  visibility: visible;
  opacity: 1;
}

.tooltip-2 {
  width: 60px;
  position: relative;
  display: inline-flex; /* Use flexbox to align contents vertically */
  align-items: center; /* Center the content vertically */
  justify-content: center; /* Optionally, center horizontally too */
}

.tooltip-2 img {
  vertical-align: middle; /* Ensures image aligns vertically in the line */
  width: 50px;
  height: 50px;
}
.tooltip-2 .tooltiptext {
  visibility: hidden;
  width: 120px;
  background-color: #555;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px;
  position: absolute;
  z-index: 1;
  bottom: 125%; /* Position above the icon */
  left: 50%;
  margin-left: -60px;
  opacity: 0;
  transition: opacity 0.3s;
}

.tooltip-2:hover .tooltiptext {
  visibility: visible;
  opacity: 1;
}
.exercise-details-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  text-align: center;
}

.exercise-details {
  width: 80%; /* Adjust as needed */
  padding: 20px;
}

.arrow-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  width: 20%; /* Adjust as needed */
}

.arrow-image {
  margin-top: 10px;
  width: 50px; /* Adjust size of the arrow */
  height: auto;
}

.image-container {
  position: relative;
  width: 100%; /* Takes up 100% of its parent container */
  max-width: 400px; /* Set a maximum width for the image container */
  margin: 0 auto; /* This centers the container horizontally */
  border-radius: 10px;
  text-align: center; /* Optional, to center the contents */
}

.image-container-2 {
  position: relative;
  width: 75px;
  height: 100%; /* Takes up 100% of its parent container */
  max-height: 80px;
  margin-right: 10px;
  margin-top: 0px;
  border-radius: 5px;
  text-align: center; /* Optional, to center the contents */
}

.exercise-image {
  width: 100%;
  max-height: 100%;
  border-radius: 10px;
}

.exercise-image-2 {
  width: 100%;
  max-height: 100%;
  border-radius: 5px;
}

.play-button {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover; /* Ensures the play button scales with the image */
  cursor: pointer; /* Changes the cursor to indicate the button is clickable */
  opacity: 0.8; /* Optional: make the play button slightly transparent */
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: rgba(0, 0, 0, 0);
  padding: 0; /* Remove padding to avoid affecting the iframe size */
  border-radius: 10px;
  width: 100%; /* Ensure full width */
  height: 100%; /* Ensure full height */
  max-width: 100%; /* Prevent overflow */
  max-height: 100%; /* Prevent overflow */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  display: flex; /* Flexbox to center iframe */
  justify-content: center;
  align-items: center;
  position: relative;
}

iframe {
  border: none;
  width: 100%;
  height: 100%;
}

.video-controls {
  position: absolute;
  bottom: 10vh;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  display: flex;
  justify-content: center;
  padding: 10px 0;
  background-color: rgba(0, 0, 0, 0);
}

.video-controls button {
  background-color: #76e09a;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}

.video-controls button:hover {
  background-color: #68c288;
}

.video-container {
  margin-top: 20px;
}
.page {
  width: 100%;
  justify-content: center;
  text-align: center;
  align-items: center;
  align-content: center;
}
.indicators {
  display: flex;
  justify-content: space-between;
  text-align: center;
  align-items: center;
  margin-top: 10px;
  font-size: large;
}
.icon {
  margin-right: 5px;
}
</style>
