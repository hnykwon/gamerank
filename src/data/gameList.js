// Helper function to generate placeholder game image URL
// Used internally when creating the game list
const generatePlaceholderUrl = (gameName) => {
  // For now, using a placeholder service. Replace with actual game cover art URLs
  // You can use services like IGDB, RAWG.io, or host your own images
  const encodedName = encodeURIComponent(gameName);
  return `https://via.placeholder.com/300x400/2d3436/ffffff?text=${encodedName}`;
};

// Popular video games database
export const gameList = [
  // Action-Adventure
  { name: 'The Legend of Zelda: Breath of the Wild', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('The Legend of Zelda: Breath of the Wild') },
  { name: 'The Legend of Zelda: Tears of the Kingdom', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('The Legend of Zelda: Tears of the Kingdom') },
  { name: 'Red Dead Redemption 2', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('Red Dead Redemption 2') },
  { name: 'Grand Theft Auto V', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('Grand Theft Auto V') },
  { name: 'Assassin\'s Creed Valhalla', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('Assassin\'s Creed Valhalla') },
  { name: 'Assassin\'s Creed Odyssey', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('Assassin\'s Creed Odyssey') },
  { name: 'Horizon Zero Dawn', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('Horizon Zero Dawn') },
  { name: 'Horizon Forbidden West', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('Horizon Forbidden West') },
  { name: 'God of War (2018)', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('God of War (2018)') },
  { name: 'God of War Ragnarök', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('God of War Ragnarök') },
  { name: 'Spider-Man (2018)', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('Spider-Man (2018)') },
  { name: 'Spider-Man: Miles Morales', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('Spider-Man: Miles Morales') },
  { name: 'Spider-Man 2', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('Spider-Man 2') },
  { name: 'Ghost of Tsushima', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('Ghost of Tsushima') },
  { name: 'Uncharted 4: A Thief\'s End', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('Uncharted 4: A Thief\'s End') },
  { name: 'The Last of Us', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('The Last of Us') },
  { name: 'The Last of Us Part II', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('The Last of Us Part II') },
  { name: 'Tomb Raider (2013)', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('Tomb Raider (2013)') },
  { name: 'Rise of the Tomb Raider', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('Rise of the Tomb Raider') },
  { name: 'Shadow of the Tomb Raider', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('Shadow of the Tomb Raider') },
  { name: 'Batman: Arkham City', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('Batman: Arkham City') },
  { name: 'Batman: Arkham Knight', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('Batman: Arkham Knight') },
  { name: 'Marvel\'s Guardians of the Galaxy', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('Marvel\'s Guardians of the Galaxy') },
  { name: 'Ratchet & Clank: Rift Apart', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('Ratchet & Clank: Rift Apart') },
  { name: 'Immortals Fenyx Rising', genre: 'Action-Adventure', imageUrl: generatePlaceholderUrl('Immortals Fenyx Rising') },
  
  // RPG
  { name: 'The Witcher 3: Wild Hunt', genre: 'RPG', imageUrl: generatePlaceholderUrl('The Witcher 3: Wild Hunt') },
  { name: 'Elden Ring', genre: 'RPG', imageUrl: generatePlaceholderUrl('Elden Ring') },
  { name: 'Dark Souls III', genre: 'RPG', imageUrl: generatePlaceholderUrl('Dark Souls III') },
  { name: 'Bloodborne', genre: 'RPG', imageUrl: generatePlaceholderUrl('Bloodborne') },
  { name: 'Sekiro: Shadows Die Twice', genre: 'RPG', imageUrl: generatePlaceholderUrl('Sekiro: Shadows Die Twice') },
  { name: 'Baldur\'s Gate 3', genre: 'RPG', imageUrl: generatePlaceholderUrl('Baldur\'s Gate 3') },
  { name: 'Divinity: Original Sin 2', genre: 'RPG', imageUrl: generatePlaceholderUrl('Divinity: Original Sin 2') },
  { name: 'Persona 5 Royal', genre: 'RPG', imageUrl: generatePlaceholderUrl('Persona 5 Royal') },
  { name: 'Final Fantasy VII Remake', genre: 'RPG', imageUrl: generatePlaceholderUrl('Final Fantasy VII Remake') },
  { name: 'Final Fantasy XVI', genre: 'RPG', imageUrl: generatePlaceholderUrl('Final Fantasy XVI') },
  { name: 'Final Fantasy XV', genre: 'RPG', imageUrl: generatePlaceholderUrl('Final Fantasy XV') },
  { name: 'Dragon Age: Inquisition', genre: 'RPG', imageUrl: generatePlaceholderUrl('Dragon Age: Inquisition') },
  { name: 'Mass Effect: Legendary Edition', genre: 'RPG', imageUrl: generatePlaceholderUrl('Mass Effect: Legendary Edition') },
  { name: 'Cyberpunk 2077', genre: 'RPG', imageUrl: generatePlaceholderUrl('Cyberpunk 2077') },
  { name: 'Starfield', genre: 'RPG', imageUrl: generatePlaceholderUrl('Starfield') },
  { name: 'The Elder Scrolls V: Skyrim', genre: 'RPG', imageUrl: generatePlaceholderUrl('The Elder Scrolls V: Skyrim') },
  { name: 'Fallout 4', genre: 'RPG', imageUrl: generatePlaceholderUrl('Fallout 4') },
  { name: 'Fallout: New Vegas', genre: 'RPG', imageUrl: generatePlaceholderUrl('Fallout: New Vegas') },
  { name: 'Monster Hunter: World', genre: 'RPG', imageUrl: generatePlaceholderUrl('Monster Hunter: World') },
  { name: 'Monster Hunter Rise', genre: 'RPG', imageUrl: generatePlaceholderUrl('Monster Hunter Rise') },
  { name: 'Nier: Automata', genre: 'RPG', imageUrl: generatePlaceholderUrl('Nier: Automata') },
  { name: 'Octopath Traveler', genre: 'RPG', imageUrl: generatePlaceholderUrl('Octopath Traveler') },
  { name: 'Xenoblade Chronicles 3', genre: 'RPG', imageUrl: generatePlaceholderUrl('Xenoblade Chronicles 3') },
  { name: 'Fire Emblem: Three Houses', genre: 'RPG', imageUrl: generatePlaceholderUrl('Fire Emblem: Three Houses') },
  
  // FPS
  { name: 'Call of Duty: Modern Warfare II', genre: 'FPS', imageUrl: generatePlaceholderUrl('Call of Duty: Modern Warfare II') },
  { name: 'Call of Duty: Warzone', genre: 'FPS', imageUrl: generatePlaceholderUrl('Call of Duty: Warzone') },
  { name: 'Halo Infinite', genre: 'FPS', imageUrl: generatePlaceholderUrl('Halo Infinite') },
  { name: 'Halo: The Master Chief Collection', genre: 'FPS', imageUrl: generatePlaceholderUrl('Halo: The Master Chief Collection') },
  { name: 'Doom Eternal', genre: 'FPS', imageUrl: generatePlaceholderUrl('Doom Eternal') },
  { name: 'Doom (2016)', genre: 'FPS', imageUrl: generatePlaceholderUrl('Doom (2016)') },
  { name: 'Overwatch 2', genre: 'FPS', imageUrl: generatePlaceholderUrl('Overwatch 2') },
  { name: 'Apex Legends', genre: 'FPS', imageUrl: generatePlaceholderUrl('Apex Legends') },
  { name: 'Valorant', genre: 'FPS', imageUrl: generatePlaceholderUrl('Valorant') },
  { name: 'Counter-Strike 2', genre: 'FPS', imageUrl: generatePlaceholderUrl('Counter-Strike 2') },
  { name: 'Destiny 2', genre: 'FPS', imageUrl: generatePlaceholderUrl('Destiny 2') },
  { name: 'Borderlands 3', genre: 'FPS', imageUrl: generatePlaceholderUrl('Borderlands 3') },
  { name: 'Titanfall 2', genre: 'FPS', imageUrl: generatePlaceholderUrl('Titanfall 2') },
  { name: 'BioShock Infinite', genre: 'FPS', imageUrl: generatePlaceholderUrl('BioShock Infinite') },
  { name: 'Half-Life: Alyx', genre: 'FPS', imageUrl: generatePlaceholderUrl('Half-Life: Alyx') },
  
  // Platformer
  { name: 'Super Mario Odyssey', genre: 'Platformer', imageUrl: generatePlaceholderUrl('Super Mario Odyssey') },
  { name: 'Super Mario Bros. Wonder', genre: 'Platformer', imageUrl: generatePlaceholderUrl('Super Mario Bros. Wonder') },
  { name: 'Super Mario Galaxy', genre: 'Platformer', imageUrl: generatePlaceholderUrl('Super Mario Galaxy') },
  { name: 'Hollow Knight', genre: 'Platformer', imageUrl: generatePlaceholderUrl('Hollow Knight') },
  { name: 'Celeste', genre: 'Platformer', imageUrl: generatePlaceholderUrl('Celeste') },
  { name: 'Ori and the Blind Forest', genre: 'Platformer', imageUrl: generatePlaceholderUrl('Ori and the Blind Forest') },
  { name: 'Ori and the Will of the Wisps', genre: 'Platformer', imageUrl: generatePlaceholderUrl('Ori and the Will of the Wisps') },
  { name: 'Cuphead', genre: 'Platformer', imageUrl: generatePlaceholderUrl('Cuphead') },
  { name: 'Rayman Legends', genre: 'Platformer', imageUrl: generatePlaceholderUrl('Rayman Legends') },
  { name: 'Crash Bandicoot N. Sane Trilogy', genre: 'Platformer', imageUrl: generatePlaceholderUrl('Crash Bandicoot N. Sane Trilogy') },
  { name: 'Spyro Reignited Trilogy', genre: 'Platformer', imageUrl: generatePlaceholderUrl('Spyro Reignited Trilogy') },
  { name: 'Shovel Knight', genre: 'Platformer', imageUrl: generatePlaceholderUrl('Shovel Knight') },
  
  // Strategy
  { name: 'Civilization VI', genre: 'Strategy', imageUrl: generatePlaceholderUrl('Civilization VI') },
  { name: 'XCOM 2', genre: 'Strategy', imageUrl: generatePlaceholderUrl('XCOM 2') },
  { name: 'Total War: Warhammer III', genre: 'Strategy', imageUrl: generatePlaceholderUrl('Total War: Warhammer III') },
  { name: 'Crusader Kings III', genre: 'Strategy', imageUrl: generatePlaceholderUrl('Crusader Kings III') },
  { name: 'Age of Empires IV', genre: 'Strategy', imageUrl: generatePlaceholderUrl('Age of Empires IV') },
  { name: 'StarCraft II', genre: 'Strategy', imageUrl: generatePlaceholderUrl('StarCraft II') },
  { name: 'Company of Heroes 3', genre: 'Strategy', imageUrl: generatePlaceholderUrl('Company of Heroes 3') },
  
  // Racing
  { name: 'Forza Horizon 5', genre: 'Racing', imageUrl: generatePlaceholderUrl('Forza Horizon 5') },
  { name: 'Forza Motorsport', genre: 'Racing', imageUrl: generatePlaceholderUrl('Forza Motorsport') },
  { name: 'Gran Turismo 7', genre: 'Racing', imageUrl: generatePlaceholderUrl('Gran Turismo 7') },
  { name: 'Mario Kart 8 Deluxe', genre: 'Racing', imageUrl: generatePlaceholderUrl('Mario Kart 8 Deluxe') },
  { name: 'F1 23', genre: 'Racing', imageUrl: generatePlaceholderUrl('F1 23') },
  { name: 'Need for Speed Heat', genre: 'Racing', imageUrl: generatePlaceholderUrl('Need for Speed Heat') },
  
  // Fighting
  { name: 'Street Fighter 6', genre: 'Fighting', imageUrl: generatePlaceholderUrl('Street Fighter 6') },
  { name: 'Tekken 8', genre: 'Fighting', imageUrl: generatePlaceholderUrl('Tekken 8') },
  { name: 'Mortal Kombat 1', genre: 'Fighting', imageUrl: generatePlaceholderUrl('Mortal Kombat 1') },
  { name: 'Super Smash Bros. Ultimate', genre: 'Fighting', imageUrl: generatePlaceholderUrl('Super Smash Bros. Ultimate') },
  { name: 'Guilty Gear Strive', genre: 'Fighting', imageUrl: generatePlaceholderUrl('Guilty Gear Strive') },
  
  // Sports
  { name: 'FIFA 24', genre: 'Sports', imageUrl: generatePlaceholderUrl('FIFA 24') },
  { name: 'NBA 2K24', genre: 'Sports', imageUrl: generatePlaceholderUrl('NBA 2K24') },
  { name: 'Madden NFL 24', genre: 'Sports', imageUrl: generatePlaceholderUrl('Madden NFL 24') },
  { name: 'Rocket League', genre: 'Sports', imageUrl: generatePlaceholderUrl('Rocket League') },
  
  // Survival/Horror
  { name: 'Resident Evil 4 (2023)', genre: 'Survival Horror', imageUrl: generatePlaceholderUrl('Resident Evil 4 (2023)') },
  { name: 'Resident Evil Village', genre: 'Survival Horror', imageUrl: generatePlaceholderUrl('Resident Evil Village') },
  { name: 'Resident Evil 2 (2019)', genre: 'Survival Horror', imageUrl: generatePlaceholderUrl('Resident Evil 2 (2019)') },
  { name: 'Dead Space (2023)', genre: 'Survival Horror', imageUrl: generatePlaceholderUrl('Dead Space (2023)') },
  { name: 'Alan Wake 2', genre: 'Survival Horror', imageUrl: generatePlaceholderUrl('Alan Wake 2') },
  { name: 'The Evil Within 2', genre: 'Survival Horror', imageUrl: generatePlaceholderUrl('The Evil Within 2') },
  { name: 'Subnautica', genre: 'Survival', imageUrl: generatePlaceholderUrl('Subnautica') },
  { name: 'The Forest', genre: 'Survival', imageUrl: generatePlaceholderUrl('The Forest') },
  { name: 'Valheim', genre: 'Survival', imageUrl: generatePlaceholderUrl('Valheim') },
  
  // Puzzle
  { name: 'Portal 2', genre: 'Puzzle', imageUrl: generatePlaceholderUrl('Portal 2') },
  { name: 'Portal', genre: 'Puzzle', imageUrl: generatePlaceholderUrl('Portal') },
  { name: 'The Talos Principle', genre: 'Puzzle', imageUrl: generatePlaceholderUrl('The Talos Principle') },
  { name: 'Tetris Effect', genre: 'Puzzle', imageUrl: generatePlaceholderUrl('Tetris Effect') },
  { name: 'Baba Is You', genre: 'Puzzle', imageUrl: generatePlaceholderUrl('Baba Is You') },
  
  // Indie
  { name: 'Stardew Valley', genre: 'Indie', imageUrl: generatePlaceholderUrl('Stardew Valley') },
  { name: 'Hades', genre: 'Indie', imageUrl: generatePlaceholderUrl('Hades') },
  { name: 'Dead Cells', genre: 'Indie', imageUrl: generatePlaceholderUrl('Dead Cells') },
  { name: 'Slay the Spire', genre: 'Indie', imageUrl: generatePlaceholderUrl('Slay the Spire') },
  { name: 'Disco Elysium', genre: 'Indie', imageUrl: generatePlaceholderUrl('Disco Elysium') },
  { name: 'Outer Wilds', genre: 'Indie', imageUrl: generatePlaceholderUrl('Outer Wilds') },
  { name: 'Return of the Obra Dinn', genre: 'Indie', imageUrl: generatePlaceholderUrl('Return of the Obra Dinn') },
  { name: 'Gris', genre: 'Indie', imageUrl: generatePlaceholderUrl('Gris') },
  { name: 'Journey', genre: 'Indie', imageUrl: generatePlaceholderUrl('Journey') },
  { name: 'Limbo', genre: 'Indie', imageUrl: generatePlaceholderUrl('Limbo') },
  { name: 'Inside', genre: 'Indie', imageUrl: generatePlaceholderUrl('Inside') },
  
  // MMO
  { name: 'World of Warcraft', genre: 'MMO', imageUrl: generatePlaceholderUrl('World of Warcraft') },
  { name: 'Final Fantasy XIV', genre: 'MMO', imageUrl: generatePlaceholderUrl('Final Fantasy XIV') },
  { name: 'Guild Wars 2', genre: 'MMO', imageUrl: generatePlaceholderUrl('Guild Wars 2') },
  { name: 'Elder Scrolls Online', genre: 'MMO', imageUrl: generatePlaceholderUrl('Elder Scrolls Online') },
  { name: 'Lost Ark', genre: 'MMO', imageUrl: generatePlaceholderUrl('Lost Ark') },
  
  // Roguelike
  { name: 'The Binding of Isaac: Rebirth', genre: 'Roguelike', imageUrl: generatePlaceholderUrl('The Binding of Isaac: Rebirth') },
  { name: 'Enter the Gungeon', genre: 'Roguelike', imageUrl: generatePlaceholderUrl('Enter the Gungeon') },
  { name: 'Risk of Rain 2', genre: 'Roguelike', imageUrl: generatePlaceholderUrl('Risk of Rain 2') },
  { name: 'Vampire Survivors', genre: 'Roguelike', imageUrl: generatePlaceholderUrl('Vampire Survivors') },
  { name: 'Rogue Legacy 2', genre: 'Roguelike', imageUrl: generatePlaceholderUrl('Rogue Legacy 2') },
];

// Image cache for storing fetched game images
const gameImageCache = new Map();

// Helper function to get image URL for any game name
// Returns a URL synchronously - will use cache if available, otherwise placeholder
export const getGameImageUrl = (gameName) => {
  // Check cache first
  if (gameImageCache.has(gameName)) {
    return gameImageCache.get(gameName);
  }
  
  // First, try to find the game in the list
  const game = gameList.find(g => g.name === gameName);
  if (game && game.imageUrl) {
    // If it's already a real URL (not placeholder), cache and return it
    if (!game.imageUrl.includes('via.placeholder.com')) {
      gameImageCache.set(gameName, game.imageUrl);
      return game.imageUrl;
    }
  }
  
  // Return placeholder for now - will be replaced when image is fetched
  const placeholderUrl = `https://via.placeholder.com/300x400/2d3436/ffffff?text=${encodeURIComponent(gameName)}`;
  return placeholderUrl;
};

// Function to fetch and cache real game image
export const fetchAndCacheGameImage = async (gameName) => {
  // Skip if already cached with a real image
  if (gameImageCache.has(gameName) && !gameImageCache.get(gameName).includes('via.placeholder.com')) {
    return gameImageCache.get(gameName);
  }
  
  try {
    const { fetchGameImageUrl } = await import('../services/gameImageService');
    const imageUrl = await fetchGameImageUrl(gameName);
    // Only cache if it's a real image (not placeholder)
    if (imageUrl && !imageUrl.includes('via.placeholder.com')) {
      gameImageCache.set(gameName, imageUrl);
    }
    return imageUrl;
  } catch (error) {
    console.warn(`Failed to fetch image for ${gameName}:`, error);
    return getGameImageUrl(gameName); // Return placeholder on error
  }
};

// Helper function to search games (local fallback only)
// For API search, use searchGames from gameDatabaseService
export const searchGamesLocal = (query) => {
  if (!query || query.trim() === '') {
    return [];
  }
  const lowerQuery = query.toLowerCase();
  return gameList.filter(game => 
    game.name.toLowerCase().includes(lowerQuery) ||
    game.genre.toLowerCase().includes(lowerQuery)
  );
};

