export default class Leaderboard {
    constructor(container, options = {}, minItems, maxItems, demo = false) {
        this.container = container;
        this.options = options; // New options parameter
        this.minItems = Math.max(1, minItems);
        this.maxItems = Math.max(1, maxItems);
        this.Items = [];
        this.showAll = false;
        this.demo = demo;
        this.init();
    }

    init() {
        if (this.demo) this.generateMockItems();
        this.render();
    }

    addItem(name, score, timestamp) {
        this.Items.push({ name, score, timestamp });
        this.render();
    }

    render() {
        const itemsToShow = this.showAll ? this.Items : this.Items.slice(0, this.minItems);
        let itemsHtml = itemsToShow.map(item => {
            let itemEntries = [];

            if (this.options.fields) {
                // Loop through each specified field and prepare its display string
                this.options.fields.forEach(field => {
                    let value = ''; // Value to be displayed
                    let label = ''; // Label to be displayed

                    switch (field.toLowerCase()) {
                        case "name":
                            value = item.name;
                            label = 'Name';
                            break;
                        case "points":
                            value = item.score;
                            label = 'Points';
                            break;
                        case "timestamp":
                            value = item.timestamp;
                            label = 'Timestamp';
                            break;
                        default:
                            value = '';
                            label = '';
                    }

                    // Only add to itemEntries if value is not empty
                    if (value) itemEntries.push(`${label}: ${value}`);
                });
            } else {
                // Default display format if no fields option is provided
                itemEntries.push(`Name: ${item.name}`, `Score: ${item.score}`, `Timestamp: ${item.timestamp}`);
            }

            // Join all entries with ' - ' and wrap in <li>
            return `<li class="leaderboard-item">${itemEntries.join(' - ')}</li>`;
        }).join('');

        const moreButtonHtml = this.Items.length > this.minItems ? `<button class="more-btn">${this.showAll ? 'Less' : 'More'}</button>` : '';

        this.container.innerHTML = `
            <ul class="leaderboard-list">${itemsHtml}</ul>
            ${moreButtonHtml}
        `;

        this.addMoreButtonListener();
    }


    generateMockItems() {
        for (let i = 1; i <= Math.min(this.maxItems, 10); i++) {
            this.addItem(
                `Player ${i}`,
                Math.floor(Math.random() * 100),
                new Date().toISOString()
            );
        }
    }

    addMoreButtonListener() {
        const moreButton = this.container.querySelector('.more-btn');
        if (moreButton) {
            moreButton.addEventListener('click', () => {
                this.showAll = !this.showAll;
                this.render();
            });
        }
    }
}