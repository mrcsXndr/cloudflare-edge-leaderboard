import Leaderboard from './Leaderboard';
import { chk } from './functions/leaderboard';

let leaderboard = null;

document.addEventListener('DOMContentLoaded', async () => {
    const leaderboardElement = document.getElementById('leaderboard');
    const options = { fields: ["Name", "Points", "Timestamp"] };
    leaderboard = new Leaderboard(leaderboardElement, options, 3, 10, false);

    getLeaderboard();
});

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('score-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent the default form submission
        
        const name = document.getElementById('name').value;
        const score = parseInt(document.getElementById('score').value);

        // Here we just sign the data, prevent easy cheating
        const checksum = chk(name, score);

        try {
            const response = await fetch('/leaderboard', { 
                method: 'POST',
                headers: {'Content-Type': 'application/json' },
                body: JSON.stringify({ name, score, checksum }),
            });
            
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Submission successful:', result);
            getLeaderboard();
            
        } catch (error) {
            console.error('Submission failed:', error);
        }
    });
});

async function getLeaderboard () {    
    try {
        const response = await fetch('/leaderboard');
        if (!response.ok) {
            throw new Error('Scores could not be fetched.');
        }
        const scores = await response.json();
        
        leaderboard.Items = [];
        scores.forEach(score => {
            leaderboard.addItem(score.name, score.score, score.timestamp);
        });
    } catch (error) {
        console.error('Failed to load scores:', error);
    }
}
