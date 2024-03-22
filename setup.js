import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import readline from 'readline';

// Load environment variables
dotenv.config();

const CF_API_BASE_URL = process.env.CF_API_BASE_URL;
const CF_API_KEY = process.env.CF_API_KEY;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;

async function cfApiRequest(endpoint, method = 'GET', data = null) {
  const url = `${CF_API_BASE_URL}/${endpoint}`;
  const headers = {
    Authorization: `Bearer ${CF_API_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios({
      method,
      url,
      headers,
      data,
    });
    return response.data;
  } catch (error) {
    console.error('Error making API request:', error.message);
    throw error;
  }
}

async function createPagesProject(accountId, projectName) {
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

  if (!answer && defaultValue !== null) {
    return defaultValue;
  }

  if (pattern && !answer.match(pattern)) {
    console.log('Invalid input. Please try again.');
    return promptForInput(prompt, defaultValue, pattern);
  }

  return answer;
}

async function main() {
  const projectName = await promptForInput('Enter the Pages project name', 'edge-leaderboard');
  const dbName = await promptForInput('Enter the D1 database name', 'edge-leaderboard-db');
  const bindingName = await promptForInput('Enter the binding name', 'DB', /^[a-zA-Z0-9-]+$/);

  try {
    const projectId = await createPagesProject(CF_ACCOUNT_ID, projectName);
    const dbId = await createD1Database(dbName);

    const wranglerConfig = `
# Edge Leaderboard config
[[d1_databases]]
binding = "${bindingName}"
database_name = "${dbName}"
database_id = "${dbId}"
preview_database_id = "${dbId}"
`;

    fs.writeFileSync('wrangler.toml', wranglerConfig);
    console.log('Setup completed successfully.');
  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

main();