import { Octokit } from '@octokit/core'
import dotenv from 'dotenv'

// Load environment variables from .env file if running locally
if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

export const handler = async function (event, context) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN // Use environment variables for the token
  const octokit = new Octokit({ auth: GITHUB_TOKEN })

  const owner = 'AndriBryn' // Replace with your GitHub username
  const repo = 'website' // Replace with your repository name
  const path = 'public/data/TrainingPlanCSV.csv' // Path to the file in the repo
  const branch = 'main' // Branch to commit to

  try {
    // Fetch the content of the file from GitHub
    const { data: fileData } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
      ref: branch
    })

    // Check if file content exists
    if (!fileData || !fileData.content) {
      throw new Error('File content not found')
    }

    // Decode the base64 content of the file
    const csvContent = Buffer.from(fileData.content, 'base64').toString('utf8')

    // Parse the CSV into an array of exercise objects
    const rows = csvContent.split('\n').slice(1) // Remove the header row

    // Assuming the intensity is the 8th value, after sets
    const exercises = rows.map((row) => {
      const [exercise, ability, image, video, description, sets, focus, intensity] = row.split(';') // Adjust based on delimiter
      return {
        exercise, // Exercise name
        ability, // Ability
        focus, // Focus
        image, // Image URL
        video, // Video URL
        description, // Description of the exercise
        sets, // Number of sets
        intensity: parseInt(intensity, 10) || 0 // Convert intensity to an integer (default to 0 if missing)
      }
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ exercises })
    }
  } catch (error) {
    console.error('Error retrieving exercises:', error.message)

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to retrieve the CSV file',
        details: error.message
      })
    }
  }
}
