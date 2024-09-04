import { Octokit } from '@octokit/core'

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

    const csvContent = Buffer.from(fileData.content, 'base64').toString('utf8')

    // Parse the CSV into an array of exercise objects
    const rows = csvContent.split('\n').slice(1) // Remove the header row
    const exercises = rows.map((row) => {
      const [exercise, ability, image, video, description, sets, focus] = row.split(';') // Adjust based on delimiter
      return {
        exercise, // Display now
        ability, // Display now
        focus, // Display now
        image, // Use in future
        video, // Use in future
        description, // Use in future
        sets // Use in future
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
