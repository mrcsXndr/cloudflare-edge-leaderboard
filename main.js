import Leaderboard from './Leaderboard';

document.addEventListener('DOMContentLoaded', () => {
    const leaderboardElement = document.getElementById('leaderboard');
    // Updated to pass an options object with "fields"
    const options = { fields: ["Name", "Points", "Timestamp"] };
    const leaderboard = new Leaderboard(leaderboardElement, options, 3, 10, true);
});