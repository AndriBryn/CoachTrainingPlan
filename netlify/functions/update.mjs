import { Octokit } from '@octokit/core'
import { Buffer } from 'node:buffer'
import process from 'node:process'
import dotenv from 'dotenv'
import { getGitHubConfig } from './_githubConfig.mjs'

if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

export const handler = async function (event) {
  // ✅ Handle preflight request for CORS
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

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  const octokit = new Octokit({ auth: GITHUB_TOKEN })

  const { owner, repo, branch } = getGitHubConfig()
  const path = 'public/data/clubs.csv'

  try {
    const { csvContent } = JSON.parse(event.body)

    const { data: commitData } = await octokit.request(
      'GET /repos/{owner}/{repo}/commits/{branch}',
      {
        owner,
        repo,
        branch
      }
    )

    const latestCommitSha = commitData.sha
    const baseTreeSha = commitData.commit.tree.sha

    const contentBuffer = Buffer.from(csvContent, 'utf8').toString('base64')

    const { data: blobData } = await octokit.request('POST /repos/{owner}/{repo}/git/blobs', {
      owner,
      repo,
      content: contentBuffer,
      encoding: 'base64'
    })

    const { data: treeData } = await octokit.request('POST /repos/{owner}/{repo}/git/trees', {
      owner,
      repo,
      base_tree: baseTreeSha,
      tree: [
        {
          path,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha
        }
      ]
    })

    const { data: commitResponse } = await octokit.request(
      'POST /repos/{owner}/{repo}/git/commits',
      {
        owner,
        repo,
        message: 'Update data file via Netlify function',
        tree: treeData.sha,
        parents: [latestCommitSha]
      }
    )

    await octokit.request('PATCH /repos/{owner}/{repo}/git/refs/heads/{branch}', {
      owner,
      repo,
      branch,
      sha: commitResponse.sha,
      force: true
    })

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ message: 'File updated successfully!' })
    }
  } catch (error) {
    console.error(error)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ error: 'Failed to update the file', details: error.message })
    }
  }
}
