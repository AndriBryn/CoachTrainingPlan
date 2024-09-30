<template>
  <div class="page">
    <!-- Password input section -->
    <div v-if="!selectedClub || passwordError">
      <h3>Enter Club Password</h3>
      <div style="display: flex; flex-direction: column">
        <div>
          <input
            :type="passwordVisible ? 'text' : 'password'"
            v-model="enteredPassword"
            placeholder="Enter password"
            @keyup.enter="validatePassword"
          />
          <button @click="validatePassword">Submit</button>
        </div>
        <div>
          <button @click="togglePasswordVisibility" type="button">
            {{ passwordVisible ? 'Hide Password' : 'Show Password' }}
          </button>
        </div>
      </div>
      <p v-if="passwordError" style="color: red">{{ passwordError }}</p>
    </div>
    <!-- Display club selection, filters, and content only if no exercise is selected -->
    <div v-if="!selectedExercise && selectedClub">
      <!-- Display filtered clubs, measurements, and exercises -->
      <div v-if="filteredClubs.length && measurements.length && exercises.length">
        <!-- Button to submit the updated benchmarks and exercises -->
        <button @click="updateCSV">Save Changes</button>
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
            <h3 style="font-size: xx-large; font-weight: 600">Filter Measurements</h3>
            <div style="padding: 10px">
              <select v-model="selectedMeasurementAbility">
                <option value="all">All skills</option>
                <option
                  v-for="ability in uniqueMeasurementAbilities"
                  :key="ability"
                  :value="ability"
                >
                  {{ ability }}
                </option>
              </select>
            </div>
          </div>

          <!-- Age and Gender Selection -->
          <div
            style="
              background-color: #2f2f3e;
              border-radius: 5px;
              display: flex;
              justify-content: space-between;
              padding: 10px;
              margin-bottom: 10px;
            "
            v-if="exercises.length && editingMode === 'exercises'"
          >
            <div style="width: 50%">
              <label for="ageSelect">Select Age: </label>
              <select v-model="selectedAge" id="ageSelect" style="width: 80px">
                <option v-for="age in ageOptions" :key="age" :value="age">{{ age }}</option>
              </select>
            </div>

            <div style="width: 50%">
              <label for="genderSelect">Select Gender: </label>
              <select v-model="selectedGender" id="genderSelect" style="width: 80px">
                <option value="m">Male</option>
                <option value="f">Female</option>
              </select>
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
              <div style="width: 25%">
                <label for="selectionFilter">Filter by Selection: </label>
                <select id="selectionFilter" v-model="selectedExerciseStatus">
                  <option value="all">All Exercises</option>
                  <option value="selected">Selected Exercises</option>
                  <option value="notSelected">Not Selected Exercises</option>
                </select>
              </div>

              <!-- Ability Filter Dropdown -->
              <div style="width: 25%">
                <label for="abilityFilter">Filter by Skill: </label>
                <select id="abilityFilter" v-model="selectedAbility">
                  <option value="all">All Skills</option>
                  <option v-for="ability in uniqueAbilities" :key="ability" :value="ability">
                    {{ ability }}
                  </option>
                </select>
              </div>

              <!-- Focus Filter Dropdown -->
              <div style="width: 25%">
                <label for="focusFilter">Filter by Focus: </label>
                <select id="focusFilter" v-model="selectedFocus">
                  <option value="all">All Focuses</option>
                  <option v-for="focus in uniqueFocuses" :key="focus" :value="focus">
                    {{ focus }}
                  </option>
                </select>
              </div>
              <!-- Intensity Level Filter Dropdown -->
              <div style="width: 25%">
                <label for="intensityFilter">Filter by Intensity: </label>
                <select id="intensityFilter" v-model="selectedIntensity">
                  <option value="all">All Intensities</option>
                  <option v-for="level in uniqueIntensities" :key="level" :value="level">
                    {{ level }}
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
              <li v-for="(measurement, i) in filteredClubMeasurements(club.measurements)" :key="i">
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
                    <div style="width: 500px; text-align: left">{{ measurement.title }}</div>
                    <div style="position: absolute; left: 50%; transform: translateX(-50%)">
                      {{ measurement.ability }}
                    </div>
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
              <!-- Selection Sort Buttons -->
              <div
                style="
                  width: 50px;
                  margin-left: 25px;
                  font-weight: 600;
                  display: flex;
                  flex-direction: column;
                "
              >
                <button
                  @click="sortExercises('selected', 'asc')"
                  style="cursor: pointer; width: 25px; padding: 0; border: none"
                >
                  ▲
                </button>
                <button
                  @click="sortExercises('selected', 'desc')"
                  style="cursor: pointer; width: 25px; padding: 0; border: none"
                >
                  ▼
                </button>
              </div>
              <div
                style="
                  width: 300px;
                  margin-left: 10px;
                  font-weight: 600;
                  display: flex;
                  justify-content: center;
                "
              >
                Exercise
                <!-- Sort Buttons -->
                <div style="display: flex; flex-direction: column">
                  <button
                    @click="sortExercises('exercise', 'asc')"
                    style="cursor: pointer; width: 25px; padding: 0; border: none"
                  >
                    ▲
                  </button>
                  <button
                    @click="sortExercises('exercise', 'desc')"
                    style="cursor: pointer; width: 25px; padding: 0; border: none"
                  >
                    ▼
                  </button>
                </div>
              </div>
              <div style="width: 30px"></div>
              <div
                style="
                  width: 300px;
                  font-weight: 600;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "
              >
                Skill
                <!-- Sort Buttons for Skill -->
                <div style="display: flex; flex-direction: column">
                  <button
                    @click="sortExercises('ability', 'asc')"
                    style="cursor: pointer; width: 25px; padding: 0; border: none"
                  >
                    ▲
                  </button>
                  <button
                    @click="sortExercises('ability', 'desc')"
                    style="cursor: pointer; width: 25px; padding: 0; border: none"
                  >
                    ▼
                  </button>
                </div>
              </div>
              <div style="width: 30px"></div>
              <div
                style="
                  width: 300px;
                  font-weight: 600;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "
              >
                Focus
                <!-- Sort Buttons for Focus -->
                <div style="display: flex; flex-direction: column">
                  <button
                    @click="sortExercises('focus', 'asc')"
                    style="cursor: pointer; width: 25px; padding: 0; border: none"
                  >
                    ▲
                  </button>
                  <button
                    @click="sortExercises('focus', 'desc')"
                    style="cursor: pointer; width: 25px; padding: 0; border: none"
                  >
                    ▼
                  </button>
                </div>
              </div>
              <div
                style="
                  width: 220px;
                  font-weight: 600;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "
              >
                Other Info
                <!-- Sort Buttons for Intensity Level -->
                <div style="display: flex; flex-direction: column">
                  <button
                    @click="sortExercises('intensity', 'asc')"
                    style="cursor: pointer; width: 25px; padding: 0; border: none"
                  >
                    ▲
                  </button>
                  <button
                    @click="sortExercises('intensity', 'desc')"
                    style="cursor: pointer; width: 25px; padding: 0; border: none"
                  >
                    ▼
                  </button>
                </div>
              </div>
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
                        club.exercisesByAgeGender[`${selectedAge}-${selectedGender}`]?.includes(
                          exercise.exercise
                        )
                          ? '/images/checkmark.png'
                          : '/images/checkmark-grey.png'
                      "
                      @click="toggleExerciseSelection(club, exercise.exercise)"
                      class="icon"
                      style="cursor: pointer; margin-right: 10px"
                      :alt="
                        club.exercisesByAgeGender[`${selectedAge}-${selectedGender}`]?.includes(
                          exercise.exercise
                        )
                          ? 'Remove Exercise'
                          : 'Add Exercise'
                      "
                    />
                    <span class="tooltiptext">{{
                      club.exercisesByAgeGender[`${selectedAge}-${selectedGender}`]?.includes(
                        exercise.exercise
                      )
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
            <div class="tooltip" v-if="selectedExercise.exercise">
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
              <span class="tooltiptext" v-if="selectedExercise.exercise">
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
      selectedIntensity: 'all', // Filter property for intensity levels
      selectedExerciseStatus: 'all', // Default to showing all exercises
      selectedClub: null, // Filter for which club to display
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
      selectedMeasurement: null, // Stores the measurement currently being edited
      selectedMeasurementAbility: 'all', // Default to 'all' to show all abilities initially
      passwordError: '', // Error message for invalid password
      enteredPassword: '',
      passwordVisible: false,
      sortField: 'exercise', // Default sorting field
      sortOrder: 'asc' // Default sorting order
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
      let filtered = this.measurements

      // Filter by selected ability if it's not 'all'
      if (this.selectedMeasurementAbility !== 'all') {
        filtered = filtered.filter((m) => m.ability === this.selectedMeasurementAbility)
      }

      return filtered
    },
    uniqueMeasurementAbilities() {
      return [...new Set(this.measurements.map((m) => m.ability))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
    },

    // Unique abilities for the dropdown filter
    uniqueAbilities() {
      return [...new Set(this.exercises.map((exercise) => exercise.ability))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
    },

    // Unique focuses for the dropdown filter
    uniqueFocuses() {
      return [...new Set(this.exercises.map((exercise) => exercise.focus))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
    },
    // Unique intensity levels for the filter
    uniqueIntensities() {
      return [...new Set(this.exercises.map((exercise) => exercise.intensity))]
        .filter(Boolean)
        .sort((a, b) => a - b) // Sort numerically from low to high
    },

    // Filter and sort exercises based on selected criteria and sorting order
    filteredExercises() {
      const age = this.selectedAge // Get the selected age
      const gender = this.selectedGender // Get the selected gender

      // Ensure the current club and its exercises are accessed safely
      const selectedExercises = [
        ...(this.currentClub.exercisesByAgeGender?.[`${age}-${gender}`] || [])
      ]

      // Apply filters first
      let exercises = this.exercises.filter((exercise) => {
        const abilityMatch =
          this.selectedAbility === 'all' || exercise.ability === this.selectedAbility
        const focusMatch = this.selectedFocus === 'all' || exercise.focus === this.selectedFocus
        const intensityMatch =
          this.selectedIntensity === 'all' ||
          exercise.intensity === parseFloat(this.selectedIntensity)

        // Check if the exercise is selected for the current age and gender
        const isSelected = selectedExercises.includes(exercise.exercise)

        // Filter based on selected status
        let statusMatch = true
        if (this.selectedExerciseStatus === 'selected') {
          statusMatch = isSelected
        } else if (this.selectedExerciseStatus === 'notSelected') {
          statusMatch = !isSelected
        }

        return abilityMatch && focusMatch && intensityMatch && statusMatch
      })

      // Sorting logic remains the same
      exercises.sort((a, b) => {
        let fieldA = a[this.sortField]
        let fieldB = b[this.sortField]

        // Handle sorting by 'selected' field as a special case
        if (this.sortField === 'selected') {
          fieldA = selectedExercises.includes(a.exercise) ? 1 : 0
          fieldB = selectedExercises.includes(b.exercise) ? 1 : 0
          return this.sortOrder === 'asc' ? fieldA - fieldB : fieldB - fieldA
        }

        // Convert undefined or null to empty strings to prevent errors
        if (fieldA === undefined || fieldA === null) fieldA = ''
        if (fieldB === undefined || fieldB === null) fieldB = ''

        // Explicit type checks for sorting
        if (typeof fieldA === 'string' && typeof fieldB === 'string') {
          // Use localeCompare for string fields
          return this.sortOrder === 'asc'
            ? fieldA.localeCompare(fieldB)
            : fieldB.localeCompare(fieldA)
        } else if (typeof fieldA === 'number' && typeof fieldB === 'number') {
          // Numeric comparison for numbers
          return this.sortOrder === 'asc' ? fieldA - fieldB : fieldB - fieldA
        } else {
          // Fallback for other types, compare as generic objects
          if (fieldA > fieldB) return this.sortOrder === 'asc' ? 1 : -1
          if (fieldA < fieldB) return this.sortOrder === 'asc' ? -1 : 1
          return 0
        }
      })

      return exercises
    },

    // Filter clubs based on the selected club
    filteredClubs() {
      console.log(this.clubsData.filter((club) => club.clubName === this.selectedClub))
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

        // Parse the club data by splitting CSV content into rows
        const rows = csvContent.split('\n').slice(1) // Skip header row
        this.clubsData = rows.map((row) => {
          const [clubName, measurements, benchmarks, exercises, password] = row.split(';')

          // Convert measurements and benchmarks to arrays
          const measurementsArray = measurements ? measurements.split(',') : []
          const benchmarksArray = benchmarks ? benchmarks.split(',') : []

          // Initialize an object to store exercises by age and gender
          const exercisesByAgeGender = {}

          // Parse exercises based on the new format: "age-gender-exercise1,exercise2,.../age-gender-exercise1,exercise2,..."
          if (exercises) {
            // Split by "/" to get each age-gender group
            const ageGenderGroups = exercises.split('/')

            ageGenderGroups.forEach((group) => {
              // Split each group by "-" to separate age, gender, and exercise list
              const [age, gender, exerciseList] = group.split('-', 3)

              // Create the key in the format age-gender
              const key = `${age}-${gender}`

              // Initialize the key as an array if it does not exist
              if (!exercisesByAgeGender[key]) {
                exercisesByAgeGender[key] = []
              }

              // Split the exerciseList by commas to get the individual exercises and add them to the key
              if (exerciseList) {
                const exercisesArray = exerciseList.split(',')
                exercisesByAgeGender[key].push(...exercisesArray)
              }
            })
          }

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

            // Add ability mapping from measurements fetched
            const measurementAbility = this.measurements.find(
              (m) => m.name === measurement.name
            )?.ability

            return {
              name: measurement.name,
              selected: isSelected,
              benchmark: benchmark || {}, // Store benchmarks for each age and gender
              title: measurement.exercise || 'Unknown Title', // Map the global `exercise` to `title`
              ability: measurementAbility || '' // Assign the ability to the measurement
            }
          })

          return {
            clubName,
            measurements: mappedMeasurements, // Attach measurements with selected status, benchmarks, and ability
            exercisesByAgeGender, // Correctly store exercises by age and gender
            password: password.trim() // Ensure the password is trimmed
          }
        })
      } catch (error) {
        console.error('Failed to fetch club data:', error)
      }
    },
    togglePasswordVisibility() {
      this.passwordVisible = !this.passwordVisible
    },
    validatePassword() {
      const matchingClub = this.clubsData.find(
        (club) => club.password === this.enteredPassword.trim()
      )

      if (matchingClub) {
        this.selectedClub = matchingClub.clubName
        this.passwordError = ''
      } else {
        this.passwordError = 'Incorrect password. Please try again.'
        // Ensure selectedClub is reset to null to prevent the rest of the UI from showing
        this.selectedClub = null
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
      const header = 'clubs;measurements;benchmark;exercises;password'

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

        // Get exercises for every age and gender
        const exercisesByAgeGender = Object.entries(club.exercisesByAgeGender)
          .map(([key, exercises]) => {
            // Key format is 'age-gender'
            const [age, gender] = key.split('-')
            // Join exercises with commas and format as 'age-gender-exercise1,exercise2,...'
            return `${age}-${gender}-${exercises.join(',')}`
          })
          .join('/') // Join all age-gender groups with a slash

        return `${club.clubName};${selectedMeasurements};${selectedBenchmarks};${exercisesByAgeGender};${club.password.trim()}`
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
      // Create a key for the selected age and gender combination
      const key = `${this.selectedAge}-${this.selectedGender}`

      // Check if the exercises array exists for the selected age and gender; if not, create it
      if (!club.exercisesByAgeGender[key]) {
        this.$set(club.exercisesByAgeGender, key, [])
      }

      // Find the index of the exercise in the correct array
      const index = club.exercisesByAgeGender[key].indexOf(exerciseName)

      // Add or remove the exercise based on its current presence
      if (index === -1) {
        club.exercisesByAgeGender[key].push(exerciseName)
      } else {
        club.exercisesByAgeGender[key].splice(index, 1)
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
    // Toggle sorting order
    sortExercises(field, order) {
      this.sortField = field // Set the field to sort by (exercise, ability, focus, intensity, or selected)
      this.sortOrder = order // Set the sorting order (asc or desc)

      this.exercises.sort((a, b) => {
        let fieldA = a[field]
        let fieldB = b[field]

        // Check if the field is 'intensity', and handle it as a number
        if (field === 'intensity') {
          fieldA = parseFloat(fieldA) || 0 // Ensure fieldA is a number
          fieldB = parseFloat(fieldB) || 0 // Ensure fieldB is a number
          return order === 'asc' ? fieldA - fieldB : fieldB - fieldA // Numeric comparison
        }

        // Special case: Sorting by selection status
        if (field === 'selected') {
          // Check if the exercises are selected in the current club
          const isSelectedA = this.currentClub.exercises.includes(a.exercise)
          const isSelectedB = this.currentClub.exercises.includes(b.exercise)

          // Convert selection status to numeric values: selected as 1, not selected as 0
          fieldA = isSelectedA ? 1 : 0
          fieldB = isSelectedB ? 1 : 0

          // Sort by selection status
          return order === 'asc' ? fieldA - fieldB : fieldB - fieldA
        }

        // Convert undefined, null, or other non-string values to empty strings
        if (fieldA === undefined || fieldA === null) fieldA = ''
        if (fieldB === undefined || fieldB === null) fieldB = ''

        // Check if both fields are strings before using localeCompare
        if (typeof fieldA === 'string' && typeof fieldB === 'string') {
          // Sort alphabetically using localeCompare
          return order === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA)
        }

        // If the fields are not strings, convert them to strings before comparison
        if (typeof fieldA !== 'string') fieldA = String(fieldA)
        if (typeof fieldB !== 'string') fieldB = String(fieldB)

        // Ensure comparison fallback does not cause localeCompare errors
        return order === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA)
      })
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
    },
    filteredClubMeasurements(measurements) {
      if (this.selectedMeasurementAbility === 'all') {
        return measurements
      }
      return measurements.filter(
        (measurement) => measurement.ability === this.selectedMeasurementAbility
      )
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
input[type='password'] {
  text-align: center;
  background-color: #222232;
  color: #79e098;
  border: solid #79e098;
  font-size: x-large;
  width: 200px;
  border-radius: 5px;
  margin: 20px;
  height: 40px;
}
input[type='text'] {
  text-align: center;
  background-color: #222232;
  color: #79e098;
  border: solid #79e098;
  font-size: x-large;
  width: 200px;
  border-radius: 5px;
  margin: 20px;
  height: 40px;
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
