import { Octokit } from '@octokit/core'

export const handler = async function (event, context) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  const octokit = new Octokit({ auth: GITHUB_TOKEN })

  const owner = 'AndriBryn'
  const repo = 'website'
  const path = 'public/data/TrainingPlanCSV.csv' // Path to the exercises file
  const branch = 'main'

  try {
    const { data: fileData } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
      ref: branch
    })

    const csvContent = Buffer.from(fileData.content, 'base64').toString('utf8')

    // Parse the CSV into an array of exercise objects
    const rows = csvContent.split('\n').slice(1) // Remove the header row
    const exercises = rows.map((row) => {
      const [exercise, ability, image, video, description, sets, focus] = row.split(';') // Adjust based on delimiter
      return { exercise, ability, focus }
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ exercises })
    }
  } catch (error) {
    console.error(error)

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve the CSV file', details: error.message })
    }
  }
}
