import process from 'node:process'

export function getGitHubConfig() {
  const owner = 'AndriBryn'
  const repo = 'website'

  // Netlify-provided deploy branch for *this* site/repo (e.g. "main" or "dev").
  // For this project: main deploys should target "main" in the other repo,
  // everything else (dev/branch-deploys/previews) should target "testBranch".
  const deployBranch = process.env.BRANCH
  const branch = deployBranch === 'main' ? 'main' : 'testBranch'

  return { owner, repo, branch }
}
