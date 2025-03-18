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
  const path = 'public/data/clubs.csv' // Path to the file in the repo
  const branch = 'main' // Branch to commit to

  try {
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

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Allow requests from any origin
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // Allow specific methods
        'Access-Control-Allow-Headers': 'Content-Type' // Allow specific headers
      },
      body: JSON.stringify({ csvContent })
    }
  } catch (error) {
    console.error(error)

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*' // Include CORS headers in the error response as well
      },
      body: JSON.stringify({ error: 'Failed to retrieve the CSV file', details: error.message })
    }
  }
}
