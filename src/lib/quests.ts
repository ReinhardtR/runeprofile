import { QuestType } from "@prisma/client";

type QuestTypeMapType = {
  [key: string]: QuestType;
};

export const RFD_QUESTS = {
  "Recipe for Disaster - Another Cook's Quest": QuestType.P2P,
  "Recipe for Disaster - Mountain Dwarf": QuestType.P2P,
  "Recipe for Disaster - Wartface & Bentnoze": QuestType.P2P,
  "Recipe for Disaster - Pirate Pete": QuestType.P2P,
  "Recipe for Disaster - Lumbridge Guide": QuestType.P2P,
  "Recipe for Disaster - Evil Dave": QuestType.P2P,
  "Recipe for Disaster - Skrach Uglogwee": QuestType.P2P,
  "Recipe for Disaster - Sir Amik Varze": QuestType.P2P,
  "Recipe for Disaster - King Awowogei": QuestType.P2P,
  "Recipe for Disaster - Culinaromancer": QuestType.P2P,
};

export const QUEST_TYPE_MAP: QuestTypeMapType = {
  // F2P Quests
  "Below Ice Mountain": QuestType.F2P,
  "Black Knights' Fortress": QuestType.F2P,
  "Cook's Assistant": QuestType.F2P,
  "The Corsair Curse": QuestType.F2P,
  "Demon Slayer": QuestType.F2P,
  "Doric's Quest": QuestType.F2P,
  "Dragon Slayer I": QuestType.F2P,
  "Ernest the Chicken": QuestType.F2P,
  "Goblin Diplomacy": QuestType.F2P,
  "Imp Catcher": QuestType.F2P,
  "The Knight's Sword": QuestType.F2P,
  "Misthalin Mystery": QuestType.F2P,
  "Pirate's Treasure": QuestType.F2P,
  "Prince Ali Rescue": QuestType.F2P,
  "The Restless Ghost": QuestType.F2P,
  "Romeo & Juliet": QuestType.F2P,
  "Rune Mysteries": QuestType.F2P,
  "Sheep Shearer": QuestType.F2P,
  "Shield of Arrav": QuestType.F2P,
  "Vampyre Slayer": QuestType.F2P,
  "Witch's Potion": QuestType.F2P,
  "X Marks the Spot": QuestType.F2P,

  // P2P Quests
  "Animal Magnetism": QuestType.P2P,
  "Another Slice of H.A.M.": QuestType.P2P,
  "The Ascent of Arceuus": QuestType.P2P,
  "Beneath Cursed Sands": QuestType.P2P,
  "Between a Rock...": QuestType.P2P,
  "Big Chompy Bird Hunting": QuestType.P2P,
  Biohazard: QuestType.P2P,
  "Bone Voyage": QuestType.P2P,
  "Cabin Fever": QuestType.P2P,
  "Client of Kourend": QuestType.P2P,
  "Clock Tower": QuestType.P2P,
  "Cold War": QuestType.P2P,
  "Contact!": QuestType.P2P,
  "Creature of Fenkenstrain": QuestType.P2P,
  "Darkness of Hallowvale": QuestType.P2P,
  "Death Plateau": QuestType.P2P,
  "Death to the Dorgeshuun": QuestType.P2P,
  "The Depths of Despair": QuestType.P2P,
  "Desert Treasure I": QuestType.P2P,
  // NOT RELEASED YET
  // "Desert Treasure II": QuestType.P2P,
  "Devious Minds": QuestType.P2P,
  "The Dig Site": QuestType.P2P,
  "Dragon Slayer II": QuestType.P2P,
  "Dream Mentor": QuestType.P2P,
  "Druidic Ritual": QuestType.P2P,
  "Dwarf Cannon": QuestType.P2P,
  "Eadgar's Ruse": QuestType.P2P,
  "Eagles' Peak": QuestType.P2P,
  "Elemental Workshop I": QuestType.P2P,
  "Elemental Workshop II": QuestType.P2P,
  "Enakhra's Lament": QuestType.P2P,
  "Enlightened Journey": QuestType.P2P,
  "The Eyes of Glouphrie": QuestType.P2P,
  "Fairytale I - Growing Pains": QuestType.P2P,
  "Fairytale II - Cure a Queen": QuestType.P2P,
  "Family Crest": QuestType.P2P,
  "The Feud": QuestType.P2P,
  "Fight Arena": QuestType.P2P,
  "Fishing Contest": QuestType.P2P,
  "Forgettable Tale...": QuestType.P2P,
  "The Forsaken Tower": QuestType.P2P,
  "The Fremennik Exiles": QuestType.P2P,
  "The Fremennik Isles": QuestType.P2P,
  "The Fremennik Trials": QuestType.P2P,
  "The Garden of Death": QuestType.P2P,
  "Garden of Tranquillity": QuestType.P2P,
  "Gertrude's Cat": QuestType.P2P,
  "Getting Ahead": QuestType.P2P,
  "Ghosts Ahoy": QuestType.P2P,
  "The Giant Dwarf": QuestType.P2P,
  "The Golem": QuestType.P2P,
  "The Grand Tree": QuestType.P2P,
  "The Great Brain Robbery": QuestType.P2P,
  "Grim Tales": QuestType.P2P,
  "The Hand in the Sand": QuestType.P2P,
  "Haunted Mine": QuestType.P2P,
  "Hazeel Cult": QuestType.P2P,
  "Heroes' Quest": QuestType.P2P,
  "Holy Grail": QuestType.P2P,
  "Horror from the Deep": QuestType.P2P,
  "Icthlarin's Little Helper": QuestType.P2P,
  "In Aid of the Myreque": QuestType.P2P,
  "In Search of the Myreque": QuestType.P2P,
  "Jungle Potion": QuestType.P2P,
  "King's Ransom": QuestType.P2P,
  "A Kingdom Divided": QuestType.P2P,
  "Land of the Goblins": QuestType.P2P,
  "Legends' Quest": QuestType.P2P,
  "Lost City": QuestType.P2P,
  "The Lost Tribe": QuestType.P2P,
  "Lunar Diplomacy": QuestType.P2P,
  "Making Friends with My Arm": QuestType.P2P,
  "Making History": QuestType.P2P,
  "Merlin's Crystal": QuestType.P2P,
  "Monk's Friend": QuestType.P2P,
  "Monkey Madness I": QuestType.P2P,
  "Monkey Madness II": QuestType.P2P,
  "Mountain Daughter": QuestType.P2P,
  "Mourning's End Part I": QuestType.P2P,
  "Mourning's End Part II": QuestType.P2P,
  "Murder Mystery": QuestType.P2P,
  "My Arm's Big Adventure": QuestType.P2P,
  "Nature Spirit": QuestType.P2P,
  "A Night at the Theatre": QuestType.P2P,
  "Observatory Quest": QuestType.P2P,
  "Olaf's Quest": QuestType.P2P,
  "One Small Favour": QuestType.P2P,
  "Plague City": QuestType.P2P,
  "A Porcine of Interest": QuestType.P2P,
  "Priest in Peril": QuestType.P2P,
  "The Queen of Thieves": QuestType.P2P,
  "Rag and Bone Man I": QuestType.P2P,
  "Rag and Bone Man II": QuestType.P2P,
  Ratcatchers: QuestType.P2P,
  "Recipe for Disaster": QuestType.P2P,
  "Recruitment Drive": QuestType.P2P,
  Regicide: QuestType.P2P,
  "Roving Elves": QuestType.P2P,
  "Royal Trouble": QuestType.P2P,
  "Rum Deal": QuestType.P2P,
  "Scorpion Catcher": QuestType.P2P,
  "Sea Slug": QuestType.P2P,
  "Secrets of the North": QuestType.P2P,
  "Shades of Mort'ton": QuestType.P2P,
  "Shadow of the Storm": QuestType.P2P,
  "Sheep Herder": QuestType.P2P,
  "Shilo Village": QuestType.P2P,
  "Sins of the Father": QuestType.P2P,
  "Sleeping Giants": QuestType.P2P,
  "The Slug Menace": QuestType.P2P,
  "Song of the Elves": QuestType.P2P,
  "A Soul's Bane": QuestType.P2P,
  "Spirits of the Elid": QuestType.P2P,
  "Swan Song": QuestType.P2P,
  "Tai Bwo Wannai Trio": QuestType.P2P,
  "A Tail of Two Cats": QuestType.P2P,
  "Tale of the Righteous": QuestType.P2P,
  "A Taste of Hope": QuestType.P2P,
  "Tears of Guthix": QuestType.P2P,
  "Temple of Ikov": QuestType.P2P,
  "Temple of the Eye": QuestType.P2P,
  "Throne of Miscellania": QuestType.P2P,
  "The Tourist Trap": QuestType.P2P,
  "Tower of Life": QuestType.P2P,
  "Tree Gnome Village": QuestType.P2P,
  "Tribal Totem": QuestType.P2P,
  "Troll Romance": QuestType.P2P,
  "Troll Stronghold": QuestType.P2P,
  "Underground Pass": QuestType.P2P,
  "Wanted!": QuestType.P2P,
  Watchtower: QuestType.P2P,
  "Waterfall Quest": QuestType.P2P,
  "What Lies Below": QuestType.P2P,
  "Witch's House": QuestType.P2P,
  "Zogre Flesh Eaters": QuestType.P2P,

  // Mini Quests
  "Alfred Grimhand's Barcrawl": QuestType.MINI,
  "Architectural Alliance": QuestType.MINI,
  "Bear Your Soul": QuestType.MINI,
  "Curse of the Empty Lord": QuestType.MINI,
  "Daddy's Home": QuestType.MINI,
  "The Enchanted Key": QuestType.MINI,
  "Enter the Abyss": QuestType.MINI,
  "Family Pest": QuestType.MINI,
  "The Frozen Door": QuestType.MINI,
  "The General's Shadow": QuestType.MINI,
  "Hopespear's Will": QuestType.MINI,
  "In Search of Knowledge": QuestType.MINI,
  "Into the Tombs": QuestType.MINI,
  "Lair of Tarn Razorlor": QuestType.MINI,
  "Mage Arena I": QuestType.MINI,
  "Mage Arena II": QuestType.MINI,
  "Skippy and the Mogres": QuestType.MINI,
};
