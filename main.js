import Leaderboard from './Leaderboard';

document.addEventListener('DOMContentLoaded', () => {
    const leaderboardElement = document.getElementById('leaderboard');
    // Updated to pass an options object with "fields"
    const options = { fields: ["Name", "Points", "Timestamp"] };
    const leaderboard = new Leaderboard(leaderboardElement, options, 3, 10, true);
});

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('score-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent the default form submission
        
        const name = document.getElementById('name').value;
        const score = document.getElementById('score').value;
        const timestamp = new Date(document.getElementById('timestamp').value).toISOString();
        
        try {
            const response = await fetch('/leaderboard', { // Change this URL to your actual Worker endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, score, timestamp }),
            });
            
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Submission successful:', result);
            // Optionally, refresh the leaderboard or notify the user of success
        } catch (error) {
            console.error('Submission failed:', error);
            // Optionally, notify the user of the failure
        }
    });
});