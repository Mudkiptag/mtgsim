const playerCount = 8;
let packs = [];
let currentPack = 0;
let playerHands = Array.from({ length: playerCount }, () => []);
let playerColors = Array.from({ length: playerCount }, () => null);
let deck = [];
let sideboard = [];

const colors = ['W', 'U', 'B', 'R', 'G']; // White, Blue, Black, Red, Green

async function fetchCards() {
    const response = await fetch(`https://api.scryfall.com/cards/search?order=set&q=legal%3Amodern&unique=prints`);
    const data = await response.json();
    return data.data;
}

function getRandomCard(cards, rarity) {
    const filteredCards = cards.filter(card => card.rarity === rarity);
    return filteredCards[Math.floor(Math.random() * filteredCards.length)];
}

function createPack(cards) {
    const pack = [];
    // Add 1 rare or mythic
    let rareOrMythic = getRandomCard(cards, 'mythic') || getRandomCard(cards, 'rare');
    pack.push(rareOrMythic);
    // Add 3 uncommons
    for (let i = 0; i < 3; i++) {
        pack.push(getRandomCard(cards, 'uncommon'));
    }
    // Add 6 commons
    for (let i = 0; i < 6; i++) {
        pack.push(getRandomCard(cards, 'common'));
    }
    // Add 3 cards of any rarity (wildcards)
    for (let i = 0; i < 3; i++) {
        const randomCard = cards[Math.floor(Math.random() * cards.length)];
        pack.push(randomCard);
    }
    // Add 1 basic land
    pack.push(getRandomCard(cards, 'basic'));
    
    // Sort the pack so mythics are first, then rares, then uncommons, then commons
    pack.sort((a, b) => {
        const rarityOrder = ['mythic', 'rare', 'uncommon', 'common', 'basic'];
        return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
    });

    return pack;
}

async function startDraft() {
    const cards = await fetchCards();

    // Create 3 packs for each player
    for (let i = 0; i < playerCount; i++) {
        for (let j = 0; j < 3; j++) {
            packs.push(createPack(cards));
        }
    }

    displayPacks();
}

function displayPacks() {
    const packsDiv = document.getElementById('packs');
    packsDiv.innerHTML = '';

    const packDiv = document.createElement('div');
    packDiv.classList.add('pack');
    packDiv.innerHTML = `<h2>Pack ${currentPack + 1}</h2>`;

    packs[currentPack].forEach(card => {
        const cardImg = document.createElement('img');
        cardImg.src = card.image_uris.small;
        cardImg.alt = card.name;
        cardImg.classList.add('card');
        cardImg.onclick = () => pickCard(card);
        packDiv.appendChild(cardImg);
    });

    packsDiv.appendChild(packDiv);
}

function pickCard(card) {
    moveToDeckOrSideboard(card);

    // Remove card from pack
    packs[currentPack] = packs[currentPack].filter(c => c !== card);

    passPacks();
}

function passPacks() {
    // AI picks cards
    for (let i = 1; i < playerCount; i++) {
        const aiPick = aiPickCard(playerColors[i], packs[(currentPack + i) % packs.length]);
        playerHands[i].push(aiPick);
        packs[(currentPack + i) % packs.length] = packs[(currentPack + i) % packs.length].filter(c => c !== aiPick);
    }

    // Move to the next pack
    currentPack = (currentPack + 1) % packs.length;

    // If all packs have been picked, move to next round
    if (currentPack === 0) {
        // If 3 rounds are completed, end the draft
        if (packs.every(pack => pack.length === 0)) {
            alert('Draft completed!');
            return;
        }
    }

    displayPacks();
}

function aiPickCard(color, pack) {
    // Pick the first rare if any
    for (const card of pack) {
        if (card.rarity === 'rare' || card.rarity === 'mythic') {
            if (!color) {
                const cardColor = card.colors.find(c => colors.includes(c));
                if (cardColor) {
                    playerColors[currentPack % playerCount] = cardColor; // Set AI color if not already set
                }
            }
            return card;
        }
    }

    // Prioritize cards of AI's color
    const colorPriority = ['rare', 'mythic', 'uncommon', 'common'];
    for (const rarity of colorPriority) {
        for (const card of pack) {
            if (card.colors.includes(color) && card.rarity === rarity) {
                return card;
            }
        }
    }

    // Pick a colorless card if no cards of AI's color are available
    for (const card of pack) {
        if (card.colors.length === 0) {
            return card;
        }
    }

    // Pick the highest rarity card available
    for (const rarity of colorPriority) {
        for (const card of pack) {
            if (card.rarity === rarity) {
                return card;
            }
        }
    }

    // Default to the first card if no other options (shouldn't happen)
    return pack[0];
}

function moveToDeckOrSideboard(card) {
    const choice = prompt("Move to (d)eck or (s)ideboard?", "d");
    if (choice === "d") {
        deck.push(card);
        updateDeck();
    } else if (choice === "s") {
        sideboard.push(card);
        updateSideboard();
    }
}

function updateDeck() {
    const deckDiv = document.getElementById('deck');
    deckDiv.innerHTML = '<h2>Deck:</h2>';
    deck.forEach(card => {
        const cardImg = document.createElement('img');
        cardImg.src = card.image_uris.small;
        cardImg.alt = card.name;
        cardImg.classList.add('card');
        deckDiv.appendChild(cardImg);
    });
}

function updateSideboard() {
    const sideboardDiv = document.getElementById('sideboard');
    sideboardDiv.innerHTML = '<h2>Sideboard:</h2>';
    sideboard.forEach(card => {
        const cardImg = document.createElement('img');
        cardImg.src = card.image_uris.small;
        cardImg.alt = card.name;
        cardImg.classList.add('card');
        sideboardDiv.appendChild(cardImg);
    });
}

function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelector(`#tabs .tab[onclick="showTab('${tabName}')"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}