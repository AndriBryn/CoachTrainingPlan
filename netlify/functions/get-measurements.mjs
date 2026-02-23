import { Octokit } from '@octokit/core'
import dotenv from 'dotenv'
import { getGitHubConfig } from './_githubConfig.mjs'

if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

export const handler = async function (event, context) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  const octokit = new Octokit({ auth: GITHUB_TOKEN })

  const { owner, repo, branch } = getGitHubConfig()
  const path = 'public/data/exercises.csv'

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
    const lines = csvContent.trim().split('\n')

    const headers = lines[0].split(';')
    const dataRows = lines.slice(1)

    const measurements = dataRows.map((row) => {
      const values = row.split(';')
      const base = {
        exercise: values[0],
        name: values[1],
        withball: values[2],
        ability: values[3],
        allStddev: {},
        allAges: {}
      }

      for (let i = 4; i < headers.length; i++) {
        const header = headers[i]
        const value = parseFloat(values[i])
        if (header.endsWith('mean')) {
          const key = header.replace('mean', '') // e.g., m9
          const gender = key[0]
          const age = key.slice(1)
          if (!base.allAges[age]) base.allAges[age] = {}
          base.allAges[age][gender] = value
        } else if (header.endsWith('std.dev')) {
          const key = header.replace('std.dev', '') // e.g., m9
          const gender = key[0]
          const age = key.slice(1)
          if (!base.allStddev[age]) base.allStddev[age] = {}
          base.allStddev[age][gender] = value
        }
      }

      return base
    })

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ measurements })
    }
  } catch (error) {
    console.error(error)

    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to retrieve the CSV file', details: error.message })
    }
  }
}
