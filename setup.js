import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import readline from 'readline';

// Load environment variables from .env file
dotenv.config();

// Get environment variables
const CF_API_BASE_URL = process.env.CF_API_BASE_URL;
const CF_API_KEY = process.env.CF_API_KEY;
const CF_API_EMAIL = process.env.CF_API_EMAIL;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;

console.log('Script started. Loading environment variables and preparing API request.');

async function cfApiRequest(endpoint, method = 'GET', data = null) {
  const url = `${CF_API_BASE_URL}/${endpoint}`;
  const headers = {
    'X-Auth-Email': CF_API_EMAIL,
    'X-Auth-Key': CF_API_KEY,
    'Content-Type': 'application/json',
  };

  console.log(`Making ${method} request to ${url} with data:`, data);

  try {
    const response = await axios({
      method,
      url,
      headers,
      data,
    });
    console.log('API request successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error making API request:', error.message);
    throw error;
  }
}

async function createPagesProject(accountId, projectName) {
  console.log(`Attempting to create Pages project: ${projectName}`);
  const endpoint = `accounts/${accountId}/pages/projects`;

  const data = {
    name: projectName,
    build_config: {
      build_command: 'npm run build',
      destination_dir: 'dist',
      root_dir: '/',
    },
    production_branch: 'main',
  };

  try {
    const response = await cfApiRequest(endpoint, 'POST', data);
    const projectName = response.result.name;
    console.log(`Pages project '${projectName}' created successfully.`);
    return projectName;
  } catch (error) {
    console.error('Failed to create Pages project:', error.message);
    throw error;
  }
}

async function createD1Database(name) {
  console.log(`Attempting to create D1 database: ${name}`);
  const endpoint = `accounts/${CF_ACCOUNT_ID}/d1/database`;
  const data = { name };

  try {
    const response = await cfApiRequest(endpoint, 'POST', data);
    const dbUuid = response.result.uuid;
    console.log(`D1 database created with UUID: ${dbUuid}`);
    return dbUuid;
  } catch (error) {
    console.error('Failed to create D1 database:', error.message);
    throw error;
  }
}

async function createLeaderboardTable(tblName, dbUuid) {
  console.log('Attempting to create leaderboard table');
  const endpoint = `accounts/${CF_ACCOUNT_ID}/d1/databases/${dbUuid}/tables`;
  const data = {
    name: tblName,
    columns: [
      { name: 'name', type: 'TEXT' },
      { name: 'score', type: 'INTEGER' },
      { name: 'timestamp', type: 'TIMESTAMP' },
    ],
  };

  try {
    await cfApiRequest(endpoint, 'POST', data);
    console.log('Leaderboard table created successfully');
  } catch (error) {
    console.error('Failed to create leaderboard table:', error.message);
    throw error;
  }
}

async function promptForInput(prompt, defaultValue = null, pattern = null) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = `${prompt} [${defaultValue}]: `;
  const answer = await new Promise((resolve) => {
    rl.question(question, (input) => {
      rl.close();
      resolve(input.trim());
    });
  });

  console.log(`Input received: ${answer}`);

  if (!answer && defaultValue !== null) {
    console.log(`Using default value: ${defaultValue}`);
    return defaultValue;
  }

  if (pattern && !answer.match(pattern)) {
    console.log('Invalid input. Please try again.');
    return promptForInput(prompt, defaultValue, pattern);
  }

  return answer;
}

async function main() {
  console.log('Starting setup process...');

  const projectName = await promptForInput('Enter the Pages project name', 'edge-leaderboard');
  const dbName = await promptForInput('Enter the D1 database name', 'edge-leaderboard-db');
  const tbName = await promptForInput('Enter the D1 table name', 'leaderboard');
  const bindName = await promptForInput('Enter the binding name', 'DB', /^[a-zA-Z0-9-]+$/);

  console.log('Inputs received. Proceeding with the creation of Pages project and D1 database.');

  try {
    
    const dbId = await createD1Database(dbName);
    console.log(`Database ID: ${dbId}`);
    await createLeaderboardTable(tbName, dbId);

    console.log(`Database ID: ${dbId}`);
    const projectId = await createPagesProject(CF_ACCOUNT_ID, projectName);
    console.log(`Pages project ID: ${projectId}`);

    console.log('Writing configuration to wrangler.toml');
    
    const wranglerConfig = `
# Edge Leaderboard config
[[d1_databases]]
binding = "${bindName}"
database_name = "${dbName}"
database_id = "${dbId}"
preview_database_id = "${bindName}"
`;

    fs.writeFileSync('wrangler.toml', wranglerConfig);
    console.log('wrangler.toml written successfully. Setup completed successfully.');
  } catch (error) {
    console.error('An error occurred during setup:', error.message);
  }
}

main();