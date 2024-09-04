import { Octokit } from '@octokit/core'

export const handler = async function (event, context) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN // Use environment variables for the token
  const octokit = new Octokit({ auth: GITHUB_TOKEN })

  const owner = 'AndriBryn' // Replace with your GitHub username or organization
  const repo = 'website' // Replace with your repository name
  const path = 'public/data/clubs.csv' // Path to the file in the repo
  const branch = 'main' // Branch to commit to

  try {
    const { csvContent } = JSON.parse(event.body)

    // Get the latest commit SHA and the tree SHA it points to
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

    // Create a new blob for the updated file
    const { data: blobData } = await octokit.request('POST /repos/{owner}/{repo}/git/blobs', {
      owner,
      repo,
      content: contentBuffer,
      encoding: 'base64'
    })

    // Create a new tree with the updated file
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

    // Create a new commit
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

    // Update the branch to point to the new commit
    await octokit.request('PATCH /repos/{owner}/{repo}/git/refs/heads/{branch}', {
      owner,
      repo,
      ref: `heads/${branch}`, // Ensure this is correct
      sha: commitResponse.sha,
      force: true // Add force option if needed
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'File updated successfully!' })
    }
  } catch (error) {
    console.error(error)

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update the file', details: error.message })
    }
  }
}
