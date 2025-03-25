// Netlify function: get-training-plans.js

import { Octokit } from '@octokit/rest'
import dotenv from 'dotenv'

// Load environment variables from .env file if running locally
if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

export const handler = async function (event, context) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  const octokit = new Octokit({ auth: GITHUB_TOKEN })

  const owner = 'AndriBryn'
  const repo = 'website'
  const branch = 'main'

  // Get the club name from the query string
  const params = event.queryStringParameters || {}
  const clubName = params.clubName

  if (!clubName) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing clubName parameter' })
    }
  }

  const encodedClubName = encodeURIComponent(clubName)
  const path = `public/data/TrainingPlans/${encodedClubName}.csv`

  try {
    const { data: fileData } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
      ref: branch
    })

    if (!fileData || !fileData.content) {
      throw new Error('File content not found')
    }

    const csvContent = Buffer.from(fileData.content, 'base64').toString('utf8')

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ csvContent })
    }
  } catch (error) {
    if (error.status === 404 || error.message.includes('Not Found')) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({ csvContent: '' })
      }
    }

    console.error(error)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ error: 'Failed to retrieve training plan', details: error.message })
    }
  }
}
