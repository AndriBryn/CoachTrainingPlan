import { Octokit } from '@octokit/core'
import dotenv from 'dotenv'

if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

export const handler = async function (event, context) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  const octokit = new Octokit({ auth: GITHUB_TOKEN })

  const owner = 'AndriBryn'
  const repo = 'website'
  const branch = 'main'

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
    const rows = csvContent.trim().split('\n').slice(1) // Skip header row

    const plans = rows.map((row) => {
      const [name, ability, rawExercises] = row.split(';')

      const plan = {}
      const days = rawExercises.split('-')

      days.forEach((dayBlock) => {
        const [day, ...exerciseParts] = dayBlock.split(',')
        if (!day || exerciseParts.length === 0) return

        plan[day.trim()] = exerciseParts.map((ex) => {
          const match = ex.match(/(.+?)\((Sets:.*)\)/)
          if (match) {
            return {
              exercise: match[1].trim(),
              sets: match[2].replace('Sets:', '').trim()
            }
          } else {
            return {
              exercise: ex.trim(),
              sets: '',
              open: false
            }
          }
        })
      })

      return {
        name: name.trim(),
        ability: ability.trim(),
        plan
      }
    })

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ plans })
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
        body: JSON.stringify({ plans: [] })
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
