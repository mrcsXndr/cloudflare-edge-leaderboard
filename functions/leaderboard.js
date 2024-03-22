function createResponse(body = null, options = {}) {
    const { headers, status = 200 } = options;
    const response = new Response(body ? JSON.stringify(body) : null, { status });
    response.headers.set('Access-Control-Allow-Origin', '*');
    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        response.headers.set(key, value);
      }
    }
    return response;
  }
  
  export async function onRequestGet({ env }) {
    try {
      const scores = await getScores(env.DB);
      return createResponse(scores);
    } catch (error) {
      return createResponse({ error: 'Failed to fetch scores.' }, { status: 500 });
    }
  }
  
  export async function onRequestPost({ request, env }) {
    try {
      const { name, score } = await request.json();
      const updated = await updateScore(name, score, env.DB);
      return createResponse({ updated });
    } catch (error) {
      return createResponse({ error: 'Failed to update score.' }, { status: 500 });
    }
  }
  
  export async function onRequestOptions() {
    return createResponse(null, {
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  
  async function getScores(db) {
    const query = 'SELECT name, score, timestamp FROM leaderboard ORDER BY score DESC LIMIT 10';
    const stmt = await db.prepare(query);
    const results = await stmt.all();
    return results ? results.map(({ name, score, timestamp }) => ({
        name,
        score,
        timestamp: formatTimestamp(timestamp)
    })) : [];
}

async function updateScore(name, score, db) {
    const highScores = await getScores(db);
    const lowestScore = highScores[highScores.length - 1]?.score || 0;

    if (score > lowestScore) {
        const timestamp = getTime(); // Generate the current timestamp in the desired format
        const query = 'INSERT INTO leaderboard (name, score, timestamp) VALUES (?, ?, ?)';
        await db.run(query, [name, score, timestamp]);
        return true;
    }

    return false;
}

function formatTimestamp(timestamp) {
    const date = (timestamp instanceof Date) ? timestamp : new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

function getTime() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}