# cloudflare-edge-leaderboard
 A simple leaderboard implementation that can be easily applied to existing projects to report scores

# Setup Instructions
- Make sure you have the latest version of npm installed
- Make sure you have Python 3.6 or later installed
- Run ```pip install requests python-dotenv```

### Install dependencies
1. Run ```npm install``` in your project folder
2. Run setup script

### Configuration
Get your account ID and Global API key from: https://dash.cloudflare.com/%7Baccount_id%7D/workers-and-pages

### Wrangler
You need to modify your wrangler.tom file if this is not done automatically:
[[d1_databases]]
binding = "DB" # Should match preview_database_id
database_name = "YOUR_DB_NAME_HERE"
database_id = "YOUR_DATABASE_NAME" # wrangler d1 info YOUR_DATABASE_NAME
preview_database_id = "DB" # Required for Pages local development