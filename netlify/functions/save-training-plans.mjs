import { Octokit } from '@octokit/core'
import dotenv from 'dotenv'
import { getGitHubConfig } from './_githubConfig.mjs'

if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

export const handler = async function (event) {
  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: 'Preflight OK'
    }
  }

  console.log('[TrainingPlan] Function triggered')

  const { clubName, csvContent } = JSON.parse(event.body || '{}')
  console.log('[TrainingPlan] Received clubName:', clubName)
  console.log('[TrainingPlan] Received CSV Content:', csvContent)

  if (!clubName || !csvContent) {
    console.warn('[TrainingPlan] Missing clubName or csvContent')
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing clubName or csvContent' })
    }
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  const octokit = new Octokit({ auth: GITHUB_TOKEN })

  const { owner, repo, branch } = getGitHubConfig()
  const path = `public/data/TrainingPlans/${encodeURIComponent(clubName)}.csv`

  try {
    let sha = null
    let fileExists = false

    // Step 1: Try to fetch the existing file to get the sha (if exists)
    try {
      const { data: fileData } = await octokit.request(
        'GET /repos/{owner}/{repo}/contents/{path}',
        { owner, repo, path, ref: branch }
      )
      sha = fileData.sha
      fileExists = true
      console.log(`[TrainingPlan] File exists. SHA: ${sha}`)
    } catch (e) {
      if (e.status === 404) {
        console.log('[TrainingPlan] File does not exist. A new file will be created.')
      } else {
        console.error('[TrainingPlan] Failed to fetch file info:', e)
        throw e
      }
    }

    // Step 2: Encode content and prepare request
    const encodedContent = Buffer.from(csvContent, 'utf8').toString('base64')

    const putRequest = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
      message: fileExists
        ? `Update training plans for ${clubName}`
        : `Create training plans for ${clubName}`,
      content: encodedContent,
      branch,
      ...(sha ? { sha } : {})
    })

    console.log('[TrainingPlan] File saved successfully:', putRequest.status)

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ message: 'Training plans saved successfully.' })
    }
  } catch (error) {
    console.error('[TrainingPlan] Error saving file:', error)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ error: 'Failed to save training plans', details: error.message })
    }
  }
}
