import MD5 from 'crypto-js/md5';

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

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const scores = await getScores(env.DB);
    console.log('Fetched scores:', scores);
    return createResponse(scores);
  } catch (error) {
    console.error('Failed to fetch scores:', error);
    return createResponse({ error: 'Failed to fetch scores.' }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { name, score, checksum } = await request.json();
    console.log('Received score update:', { name, score, checksum });
    const updated = await updateScore(name, score, checksum, env.DB);
    console.log('Score update result:', updated);
    return createResponse({ updated });
  } catch (error) {
    console.error('Failed to update score:', error);
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
  const response = await stmt.all();
  console.log(response);

  if (!response.results || response.results.length === 0) {
    console.log("No scores found.");
    return [];
  }

  return response.results.map(({ name, score, timestamp }) => ({
    name,
    score,
    timestamp
  }));
}

async function updateScore(name, score, checksum, db) {
  // Check for cheaters
  const expectedChecksum = chk(name, score);
  if (checksum !== expectedChecksum) {
    console.log('Invalid checksum. Score submission rejected.');
    return false;
  }

  const highScores = await getScores(db);

  // Check if the score already exists for the given name
  const existingScore = highScores.find(entry => entry.name === name);

  if (existingScore) {
    // If the new score is not higher than the existing score, don't update
    if (score <= existingScore.score) {
      console.log('Score not higher than the existing record. No update needed.');
      return false;
    }

    const timestamp = getTime();
    const updateQuery = 'UPDATE leaderboard SET score = ?, timestamp = ? WHERE name = ?';
    const updateStmt = await db.prepare(updateQuery);
    await updateStmt.bind(score, timestamp, name).run();
    console.log('Score updated:', { name, score, timestamp });
  } else {
    const timestamp = getTime();
    const insertQuery = 'INSERT INTO leaderboard (name, score, timestamp) VALUES (?, ?, ?)';
    const insertStmt = await db.prepare(insertQuery);
    await insertStmt.bind(name, score, timestamp).run();
    console.log('New score inserted:', { name, score, timestamp });
  }

  return true;
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

// Gotta use this to checksum your submissions at the very least! This prevents easy client side submissions
function chk(txt, val) {
  const data = `${txt},${val}`;
  const checksum = MD5(data).toString();
  return checksum;
}