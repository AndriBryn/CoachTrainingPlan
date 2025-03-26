import { Octokit } from '@octokit/core'
import dotenv from 'dotenv'

dotenv.config()

export async function handler(event) {
  const { clubName, csvContent } = JSON.parse(event.body || '{}')

  if (!clubName || !csvContent) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing clubName or csvContent' })
    }
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  const octokit = new Octokit({ auth: GITHUB_TOKEN })

  const owner = 'AndriBryn'
  const repo = 'website'
  const branch = 'main'
  const path = `public/data/TrainingPlans/${encodeURIComponent(clubName)}.csv`

  try {
    let sha = null

    try {
      const { data: fileData } = await octokit.request(
        'GET /repos/{owner}/{repo}/contents/{path}',
        {
          owner,
          repo,
          path,
          ref: branch
        }
      )
      sha = fileData.sha
    } catch (e) {
      if (e.status !== 404) throw e
    }

    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
      message: `Update training plans for ${clubName}`,
      content: Buffer.from(csvContent).toString('base64'),
      branch,
      ...(sha ? { sha } : {})
    })

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Training plans saved successfully.' })
    }
  } catch (error) {
    console.error('Failed to save training plans:', error)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to save training plans', details: error.message })
    }
  }
}
