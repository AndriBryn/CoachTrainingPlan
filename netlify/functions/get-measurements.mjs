import { Octokit } from '@octokit/core'

export const handler = async function (event, context) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN // Use environment variables for the token
  const octokit = new Octokit({ auth: GITHUB_TOKEN })

  const owner = 'AndriBryn' // Replace with your GitHub username
  const repo = 'website' // Replace with your repository name
  const path = 'public/data/exercises.csv' // Path to the file in the repo
  const branch = 'main' // Branch to commit to

  try {
    const { data: fileData } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
      ref: branch
    })

    const csvContent = Buffer.from(fileData.content, 'base64').toString('utf8')

    return {
      statusCode: 200,
      body: JSON.stringify({ csvContent })
    }
  } catch (error) {
    console.error(error)

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve the CSV file', details: error.message })
    }
  }
}
