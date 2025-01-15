const playerCount = 8;
let packs = [];
let currentPack = 0;
let playerHands = Array.from({ length: playerCount }, () => []);
let deck = [];
let sideboard = [];

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
    pack.push(getRandomCard(cards, 'rare') || getRandomCard(cards, 'mythic'));
    for (let i = 0; i < 3; i++) pack.push(getRandomCard(cards, 'uncommon'));
    for (let i = 0; i < 6; i++) pack.push(getRandomCard(cards, 'common'));
    for (let i = 0; i < 3; i++) pack.push(cards[Math.floor(Math.random() * cards.length)]);
    pack.push(getRandomCard(cards, 'basic'));
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
        const aiPick = packs[(currentPack + i) % packs.length][0];
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