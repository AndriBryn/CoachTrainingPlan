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
              Set Measurement Benchmarks
            </button>
            <button
              @click="editingMode = 'exercises'"
              :class="{ active: editingMode === 'exercises' }"
            >
              Select Exercises
            </button>
          </div>

          <!-- Filter options for measurements -->
          <div
            v-if="measurements.length && editingMode === 'measurements'"
            style="background-color: #2f2f3e; border-radius: 5px"
          >
            <h3 style="font-size: xx-large; font-weight: 600">Filter Measurements by Skill</h3>
            <div style="padding: 10px">
              <label>
                <input type="radio" value="all" v-model="selectedSkill" />
                All
              </label>
              <label v-for="skill in uniqueSkills" :key="skill">
                <input type="radio" :value="skill" v-model="selectedSkill" />
                {{ skill }}
              </label>
            </div>
          </div>

          <!-- Filter options for exercises -->
          <div
            v-if="exercises.length && editingMode === 'exercises'"
            style="background-color: #2f2f3e; border-radius: 5px"
          >
            <h3 style="font-size: x-large; font-weight: 600">Exercise Filters</h3>
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
                <label for="abilityFilter">Filter by Skill: </label>
                <select id="abilityFilter" v-model="selectedAbility">
                  <option value="all">All Skills</option>
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
          <div
            v-if="
              !isLoading &&
              editingMode === 'measurements' &&
              filteredClubs.length &&
              measurements.length
            "
          >
            <ul>
              <li v-for="(measurement, i) in club.measurements" :key="i">
                <div
                  style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    text-align: center;
                    margin: 0;
                    font-size: x-large;
                  "
                >
                  <!-- Conditional Checkmark Icon with Tooltip -->
                  <div style="display: flex; justify-content: center; align-items: center">
                    <div class="tooltip">
                      <img
                        :src="
                          measurement.selected
                            ? '/images/checkmark.png'
                            : '/images/checkmark-grey.png'
                        "
                        @click="toggleMeasurementSelection(club, measurement.name)"
                        class="icon"
                        style="cursor: pointer; margin-right: 10px"
                        :alt="measurement.selected ? 'Remove Measurement' : 'Add Measurement'"
                      />
                      <span class="tooltiptext">{{
                        measurement.selected ? 'Remove Measurement' : 'Add Measurement'
                      }}</span>
                    </div>
                    <div>{{ measurement.title }}</div>
                  </div>

                  <!-- Button to edit all age/gender benchmarks -->
                  <div v-if="measurement.selected">
                    <button @click="openBenchmarkEditor(measurement)">Edit Benchmarks</button>
                  </div>
                </div>
                <!-- Table for editing benchmarks for all ages and genders -->
                <div
                  v-if="selectedMeasurement === measurement && showBenchmarkEditor"
                  style="background-color: #2f2f3e"
                >
                  <h3>Edit Benchmarks for {{ selectedMeasurement.title }}</h3>
                  <div
                    style="
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      padding: 10px;
                    "
                  >
                    <table>
                      <thead>
                        <tr>
                          <th>Gender</th>
                          <th v-for="age in ageOptions" :key="age">{{ age }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="gender in genderOptions" :key="gender">
                          <td>{{ gender }}</td>
                          <td v-for="age in ageOptions" :key="age">
                            <input
                              type="number"
                              v-model.number="selectedMeasurement.benchmark[age][gender]"
                              :placeholder="'Enter benchmark for ' + age + '-' + gender"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <button @click="closeBenchmarkEditor">Close</button>
                </div>
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
                padding-bottom: 10px;
                margin-bottom: 10px;
                font-size: x-large;
              "
            >
              <div style="width: 300px; margin-left: 95px; font-weight: 600">Exercise</div>
              <div style="width: 30px"></div>
              <div style="width: 300px; font-weight: 600">Skill</div>
              <div style="width: 30px"></div>
              <div style="width: 300px; font-weight: 600">Focus</div>
              <div style="width: 220px; font-weight: 600">Other Info</div>
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
                    font-size: x-large;
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
      selectedSkill: 'all', // New data property to track selected skill
      selectedAbility: 'all', // Filter for exercises by ability
      selectedFocus: 'all', // Filter for exercises by focus
      selectedClub: 'all', // Filter for which club to display
      editingMode: 'exercises', // Toggle between 'measurements' and 'exercises'
      selectedExercise: null, // Stores the selected exercise for detailed view
      currentExerciseIndex: 0, // Track the index of the selected exercise
      showVideo: false, // Controls the display of the video modal
      modifiedVideoUrl: '', // Stores the modified video URL for autoplay
      isLoading: true, // Single loading state
      selectedAge: '9', // Default age
      selectedGender: 'm', // Default gender
      ageOptions: ['9', '10', '11', '12', '13', '14', '15', '16', '17', '18'], // Age options
      genderOptions: ['m', 'f'], // Gender options
      showBenchmarkEditor: false, // Controls the visibility of the benchmark editor
      selectedMeasurement: null // Stores the measurement currently being edited
    }
  },
  mounted() {
    this.fetchAllData()
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
    uniqueSkills() {
      return [...new Set(this.measurements.map((m) => m.ability))]
    },

    // Get the name of the next exercise
    nextExerciseName() {
      if (this.filteredExercises.length > 0 && this.selectedExercise) {
        const nextIndex = (this.currentExerciseIndex + 1) % this.filteredExercises.length
        return this.filteredExercises[nextIndex]?.exercise || ''
      }
      return ''
    },
    // Filter measurements based on the selected skill
    filteredMeasurements() {
      if (this.selectedSkill === 'all') {
        return this.measurements
      }
      const filtered = this.measurements.filter((m) => m.ability === this.selectedSkill)
      console.log('Selected Skill:', this.selectedSkill) // Debug output
      console.log('Filtered Measurements:', filtered) // Debug output
      return filtered
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
    async fetchAllData() {
      try {
        this.isLoading = true // Set loading to true while fetching

        // Fetch measurements first before fetching club data
        await this.fetchMeasurements()

        // Once measurements are fetched, fetch the club data
        await this.fetchClubData()
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        this.isLoading = false // Set loading to false when data fetching is complete
      }
    },
    async fetchClubData() {
      try {
        const response = await fetch('/.netlify/functions/get-csv-file')
        const result = await response.json()
        const csvContent = result.csvContent

        // Parse the club data
        const rows = csvContent.split('\n').slice(1) // Skip header row
        this.clubsData = rows.map((row) => {
          const [clubName, measurements, benchmarks, exercises] = row.split(';')

          // Convert measurements and benchmarks to arrays
          const measurementsArray = measurements ? measurements.split(',') : []
          const benchmarksArray = benchmarks ? benchmarks.split(',') : []

          // Map measurements with selected status, benchmarks for each age-gender group, and map exercise to title
          const mappedMeasurements = this.measurements.map((measurement) => {
            const existingMeasurementIndex = measurementsArray.indexOf(measurement.name)
            const isSelected = existingMeasurementIndex !== -1

            // Initialize benchmark object
            let benchmark = {}

            // If the measurement is selected and there are existing benchmarks
            if (isSelected && benchmarksArray[existingMeasurementIndex]) {
              // Split benchmark by "/" to get individual age-gender-benchmark groups
              const benchmarkGroups = benchmarksArray[existingMeasurementIndex].split('/')
              benchmarkGroups.forEach((group) => {
                const [age, gender, time] = group.split('-')
                if (!benchmark[age]) benchmark[age] = {}
                benchmark[age][gender] = parseFloat(time) // Retain existing benchmark
              })
            }

            // Ensure that every age-gender pair has a value, defaulting to 0 if missing
            this.ageOptions.forEach((age) => {
              if (!benchmark[age]) benchmark[age] = {}
              this.genderOptions.forEach((gender) => {
                if (!benchmark[age][gender]) {
                  benchmark[age][gender] = 0 // Set to 0 if no benchmark exists
                }
              })
            })

            return {
              name: measurement.name,
              selected: isSelected,
              benchmark: benchmark || {}, // Store benchmarks for each age and gender
              title: measurement.exercise || 'Unknown Title' // Map the global `exercise` to `title`
            }
          })

          return {
            clubName,
            measurements: mappedMeasurements, // Attach measurements with selected status, benchmarks, and title
            exercises: exercises ? exercises.split(',') : [] // Convert exercises to an array
          }
        })

        console.log(this.clubsData)

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
        console.log(this.measurements)
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
        // Get selected measurements
        const selectedMeasurements = club.measurements
          .filter((m) => m.selected)
          .map((m) => m.name)
          .join(',')

        // Get selected benchmarks formatted as 'age-gender-benchmark'
        const selectedBenchmarks = club.measurements
          .filter((m) => m.selected)
          .map((m) => {
            // For each selected measurement, get the benchmarks for all ages and genders
            const benchmarks = []
            Object.keys(m.benchmark).forEach((age) => {
              Object.keys(m.benchmark[age]).forEach((gender) => {
                const time = m.benchmark[age][gender]
                if (time !== undefined && !isNaN(time)) {
                  // Only add valid benchmarks (non-undefined and non-NaN)
                  benchmarks.push(`${age}-${gender}-${time}`)
                }
              })
            })
            return benchmarks.length > 0 ? benchmarks.join('/') : '' // Ensure it doesn't return undefined or NaN
          })
          .join(',')

        // Get selected exercises
        const exercises = club.exercises.join(',')

        return `${club.clubName};${selectedMeasurements};${selectedBenchmarks};${exercises}`
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
      const measurement = club.measurements.find((m) => m.name === measurementName)

      // Toggle the selected status of the measurement
      if (measurement) {
        measurement.selected = !measurement.selected
      }
    },
    onAgeOrGenderChange() {
      // Handle changes to age or gender here
      console.log(`Selected age: ${this.selectedAge}, gender: ${this.selectedGender}`)
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
    },
    getBenchmarkValue(measurement) {
      // Check if the benchmark for the selected age and gender exists
      const age = this.selectedAge
      const gender = this.selectedGender
      if (measurement.benchmark[age] && measurement.benchmark[age][gender]) {
        return measurement.benchmark[age][gender]
      }
      return 0
    },

    updateBenchmark(measurement, value) {
      const selectedAge = this.selectedAge // Ensure selectedAge is available
      const selectedGender = this.selectedGender // Ensure selectedGender is available

      // Ensure the benchmark object exists for the selected age and gender
      if (!measurement.benchmark[selectedAge]) {
        measurement.benchmark[selectedAge] = {} // Vue 3 handles reactivity automatically
      }

      measurement.benchmark[selectedAge][selectedGender] = parseFloat(value)
    },
    openBenchmarkEditor(measurement) {
      this.selectedMeasurement = measurement // Set the measurement to be edited
      this.showBenchmarkEditor = true // Show the benchmark editor
    },

    // Method to close the benchmark editor without saving
    closeBenchmarkEditor() {
      this.showBenchmarkEditor = false // Hide the editor
      this.selectedMeasurement = null // Clear the selected measurement
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
  text-align: center;
  background-color: #222232;
  color: #79e098;
  border: solid #79e098;
  font-size: x-large;
  width: 80px;
  border-radius: 5px;
}
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
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
  font-size: medium;
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
