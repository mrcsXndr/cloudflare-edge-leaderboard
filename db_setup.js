/**
 * Cloudflare Pages Project Setup Script
 * ======================================
 * Creator: Marcus Arvidsson (mrcsxndr.dev)
 * 
 * Purpose:
 * This script automates the setup process for a new Cloudflare Pages project
 * with integrated D1 database capabilities. It's designed to streamline the
 * creation of a leaderboard system for web applications, handling everything
 * from setting up the D1 database and tables to configuring project bindings
 * and generating necessary configuration files for local development.
 * 
 * Main Features:
 * - Loads environment variables for Cloudflare API interaction.
 * - Provides utility functions for making API requests to Cloudflare's service.
 * - Facilitates the creation of a D1 database and leaderboard table.
 * - Binds the newly created database to a Cloudflare Pages project.
 * - Generates a `wrangler.toml` file for Wrangler CLI, aiding local development.
 * - Includes interactive command-line prompts for user input, enhancing usability.
 * 
 * Usage:
 * Run this script in a Node.js environment with necessary .env configurations set
 * for Cloudflare API credentials and account details. Follow the interactive
 * prompts to specify project, database, and table names.
 * 
 * Note:
 * Ensure that your Cloudflare account credentials and API keys are correctly
 * set in a `.env` file or as environment variables before running this script.
 */
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import readline from 'readline';

dotenv.config();

const CF_API_BASE_URL = process.env.CF_API_BASE_URL;
const CF_API_KEY = process.env.CF_API_KEY;
const CF_API_EMAIL = process.env.CF_API_EMAIL;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;

console.log('Script started. Loading environment variables and preparing API request.');


// =============================================================================
// ==                               SETUP CALLS                               ==
// =============================================================================

async function checkProject(projectName) {
  console.log(`Checking for project: ${projectName}`);
  const endpoint = `accounts/${CF_ACCOUNT_ID}/pages/projects/${projectName}`;
  const url = `${CF_API_BASE_URL}/${endpoint}`;
  const headers = {
    'X-Auth-Email': CF_API_EMAIL,
    'X-Auth-Key': CF_API_KEY,
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios.get(url, { headers });
    console.log('Project check successful:', response.data);
    return response.status === 200;
  } catch (error) {
    console.error('Error checking project existence:', error.message);
    throw error;
  }
}

async function createD1Database(name) {
  console.log(`Attempting to create D1 database: ${name}`);
  const endpoint = `accounts/${CF_ACCOUNT_ID}/d1/database`;
  const url = `${CF_API_BASE_URL}/${endpoint}`;
  const headers = {
    'X-Auth-Email': CF_API_EMAIL,
    'X-Auth-Key': CF_API_KEY,
    'Content-Type': 'application/json',
  };
  const data = { name };

  try {
    const response = await axios.post(url, data, { headers });
    console.log('D1 database creation successful:', response.data);
    return response.data.result.uuid;
  } catch (error) {
    console.error('Failed to create D1 database:', error.message);
    throw error;
  }
}

async function createLeaderboardTable(tblName, dbUuid) {
  console.log('Attempting to create leaderboard table');
  const endpoint = `accounts/${CF_ACCOUNT_ID}/d1/database/${dbUuid}/query`;
  const url = `${CF_API_BASE_URL}/${endpoint}`;
  const headers = {
    'X-Auth-Email': CF_API_EMAIL,
    'X-Auth-Key': CF_API_KEY,
    'Content-Type': 'application/json',
  };
  const data = {
    sql: `
      CREATE TABLE IF NOT EXISTS ${tblName} (
        name TEXT PRIMARY KEY,
        score INTEGER,
        timestamp TEXT
      )
    `,
  };

  try {
    const response = await axios.post(url, data, { headers });
    console.log('Leaderboard table creation successful:', response.data);
  } catch (error) {
    console.error('Failed to create leaderboard table:', error.message, error);
    throw error;
  }
}

async function bindDB(projectName, bindName, dbId) {
  console.log(`Updating Pages project '${projectName}' with D1 binding`);
  const endpoint = `accounts/${CF_ACCOUNT_ID}/pages/projects/${projectName}`;
  const url = `${CF_API_BASE_URL}/${endpoint}`;
  const headers = {
    'X-Auth-Email': CF_API_EMAIL,
    'X-Auth-Key': CF_API_KEY,
    'Content-Type': 'application/json',
  };
  const data = {
    deployment_configs: {
      production: {
        compatibility_date: '2023-06-08',
        compatibility_flags: ['url_standard'],
        d1_databases: {
          [bindName]: { id: dbId, },
        },
      },
    },
  };

  try {
    const response = await axios.patch(url, data, { headers });
    console.log('D1 binding update successful:', response.data);
  } catch (error) {
    console.error('Failed to update Pages project binding:', error.message);
    throw error;
  }
}


// =============================================================================
// ==                                SCRIPT RUNNER                            ==
// =============================================================================


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
  let dbId = '';
  
  console.log('Starting setup process...');

  const projectName = await promptForInput('Enter the Pages project name', 'edge-leaderboard');
  const dbName = await promptForInput('Enter the D1 database name', 'edge-leaderboard-db');
  const tbName = await promptForInput('Enter the D1 table name', 'leaderboard');
  const bindName = await promptForInput('Enter the binding name', 'DB', /^[a-zA-Z0-9-]+$/);

  console.log('Inputs received. Proceeding with the creation of Pages project and D1 database.');

  try {
    if (await checkProject(projectName)) {
      dbId = await createD1Database(dbName);
      console.log(`Database created with ID: ${dbId}`);

      await createLeaderboardTable(tbName, dbId);
      console.log(`Table created with ID: ${dbId}`);

      await bindDB(projectName, bindName, dbId);
      console.log(`Pages project bound to DB: ${dbName}(${bindName})`);

      const wranglerConfig = `# Edge Leaderboard config
[[d1_databases]]
binding = "${bindName}"
database_name = "${dbName}"
database_id = "${dbId}"
preview_database_id = "${bindName}"`;

      fs.writeFileSync('wrangler.toml', wranglerConfig);
      console.log('wrangler.toml written successfully. Setup completed successfully.');
    } else {
      console.log('Project:', projectName, 'does not exist.');
    }
  } catch (error) {
    console.error('An error occurred during setup:', error.message);
    await cleanUp(projectName, bindName, dbId);
  }
}

main();


// =============================================================================
// ==                                CLEANUP SCRIPT                           ==
// =============================================================================

async function deleteD1Database(dbUuid) {
  console.log(`Attempting to delete D1 database with UUID: ${dbUuid}`);
  const endpoint = `accounts/${CF_ACCOUNT_ID}/d1/database/${dbUuid}`;
  const url = `${CF_API_BASE_URL}/${endpoint}`;
  const headers = {
    'X-Auth-Email': CF_API_EMAIL,
    'X-Auth-Key': CF_API_KEY,
    'Content-Type': 'application/json',
  };

  try {
    await axios.delete(url, { headers });
    console.log('D1 database deleted successfully.');
  } catch (error) {
    console.error('Failed to delete D1 database:', error.message);
    throw error;
  }
}

async function removeDBBinding(projectName, bindName) {
  console.log(`Removing D1 binding from Pages project '${projectName}'`);
  const endpoint = `accounts/${CF_ACCOUNT_ID}/pages/projects/${projectName}`;
  const url = `${CF_API_BASE_URL}/${endpoint}`;
  const headers = {
    'X-Auth-Email': CF_API_EMAIL,
    'X-Auth-Key': CF_API_KEY,
    'Content-Type': 'application/json',
  };
  const data = {
    deployment_configs: {
      production: { d1_databases: { [bindName]: null, }, },
    },
  };

  try {
    await axios.patch(url, data, { headers });
    console.log('D1 binding removed successfully.');
  } catch (error) {
    console.error('Failed to remove D1 binding:', error.message);
    throw error;
  }
}

function deleteWranglerToml() {
  const filePath = 'wrangler.toml';

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log('wrangler.toml file deleted successfully.');
  } else {
    console.log('wrangler.toml file not found. Skipping deletion.');
  }
}

async function cleanUp(projectName, bindName, dbUuid) {
  try {
    await deleteD1Database(dbUuid);
    await removeDBBinding(projectName, bindName);
    deleteWranglerToml();
    console.log('Clean-up completed successfully.');
  } catch (error) {
    console.error('An error occurred during clean-up:', error.message);
  }
}