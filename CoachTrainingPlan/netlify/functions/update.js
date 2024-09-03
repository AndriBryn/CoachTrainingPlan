const fetch = require('node-fetch');
const { Octokit } = require("@octokit/core");

exports.handler = async function(event, context) {
  const { GITHUB_TOKEN } = "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";
  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  const owner = 'AndriBryn'; // replace with your GitHub username or organization
  const repo = 'website'; // replace with your repository name
  const path = 'public/data/clubs.csv'; // path to the file in the repo
  const branch = 'main'; // or the branch you want to commit to

  // Get the latest commit SHA and the tree SHA it points to
  const { data: { commit: { sha: latestCommitSha, commit: { tree: { sha: baseTreeSha } } } } } = await octokit.request('GET /repos/{owner}/{repo}/commits/{branch}', {
    owner,
    repo,
    branch,
  });

  // Prepare the new file content
  const newContent = JSON.stringify({ /* your JSON content */ }, null, 2);
  const contentBuffer = Buffer.from(newContent, 'utf8').toString('base64');

  // Create a new tree with the updated file
  const { data: { sha: newBlobSha } } = await octokit.request('POST /repos/{owner}/{repo}/git/blobs', {
    owner,
    repo,
    content: contentBuffer,
    encoding: 'base64'
  });

  const { data: { sha: newTreeSha } } = await octokit.request('POST /repos/{owner}/{repo}/git/trees', {
    owner,
    repo,
    base_tree: baseTreeSha,
    tree: [
      {
        path,
        mode: '100644',
        type: 'blob',
        sha: newBlobSha
      }
    ]
  });

  // Create a new commit
  const { data: { sha: newCommitSha } } = await octokit.request('POST /repos/{owner}/{repo}/git/commits', {
    owner,
    repo,
    message: 'Update data file via Netlify function',
    tree: newTreeSha,
    parents: [latestCommitSha]
  });

  // Update the branch to point to the new commit
  await octokit.request('PATCH /repos/{owner}/{repo}/git/refs/heads/{branch}', {
    owner,
    repo,
    branch,
    sha: newCommitSha
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'File updated successfully!' }),
  };
};
