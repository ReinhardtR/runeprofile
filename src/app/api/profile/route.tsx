import {
  AccountNotFoundError,
  getProfilFullWithHash,
} from "~/lib/data/get-profile";
import { readFile } from "fs/promises";
import {
  PlayerDataSchema,
  getFormattedPluginData,
} from "~/lib/domain/plugin-data-schema";
import { NextResponse } from "next/server";
import { getChangedData } from "~/lib/get-changed-data";
import { updateProfile } from "~/lib/data/update-profile";
import { ProfileFullWithHash } from "~/lib/domain/profile-data-types";

export async function GET(request: Request) {
  console.log("Updating profile...", request.url);
  const parsedPluginData = PlayerDataSchema.parse(data);
  const newData = getFormattedPluginData(parsedPluginData);
  let oldData: ProfileFullWithHash | null = null;

  try {
    oldData = await getProfilFullWithHash({
      accountHash: newData.accountHash,
    });
  } catch (e) {
    if (!(e instanceof AccountNotFoundError)) {
      throw e;
    }
  }

  const changedData = getChangedData(oldData, newData);

  await updateProfile({
    accountHash: newData.accountHash,
    username: newData.username,
    accountType: newData.accountType,
    questPoints: newData.questList.points,
    changedData,
  });

  return NextResponse.json({ success: true });
}

const data = {
  "accountHash": "123",
  "username": "PGN",
  "accountType": "IRONMAN",
  "combatLevel": 125,
  "description": "Preparing for the Raids grind.",
  "skills": [
    {
      "index": 0,
      "name": "Attack",
      "xp": 18165013
    },
    {
      "index": 1,
      "name": "Hitpoints",
      "xp": 35143846
    },
    {
      "index": 2,
      "name": "Mining",
      "xp": 13034450
    },
    {
      "index": 3,
      "name": "Strength",
      "xp": 30159842
    },
    {
      "index": 4,
      "name": "Agility",
      "xp": 11297935
    },
    {
      "index": 5,
      "name": "Smithing",
      "xp": 5017017
    },
    {
      "index": 6,
      "name": "Defence",
      "xp": 17607175
    },
    {
      "index": 7,
      "name": "Herblore",
      "xp": 9025172
    },
    {
      "index": 8,
      "name": "Fishing",
      "xp": 13038178
    },
    {
      "index": 9,
      "name": "Ranged",
      "xp": 21386833
    },
    {
      "index": 10,
      "name": "Thieving",
      "xp": 18153080
    },
    {
      "index": 11,
      "name": "Cooking",
      "xp": 13203772
    },
    {
      "index": 12,
      "name": "Prayer",
      "xp": 5401812
    },
    {
      "index": 13,
      "name": "Crafting",
      "xp": 13287331
    },
    {
      "index": 14,
      "name": "Firemaking",
      "xp": 25683760
    },
    {
      "index": 15,
      "name": "Magic",
      "xp": 19418120
    },
    {
      "index": 16,
      "name": "Fletching",
      "xp": 13047461
    },
    {
      "index": 17,
      "name": "Woodcutting",
      "xp": 13214238
    },
    {
      "index": 18,
      "name": "Runecraft",
      "xp": 3787146
    },
    {
      "index": 19,
      "name": "Slayer",
      "xp": 11288256
    },
    {
      "index": 20,
      "name": "Farming",
      "xp": 14659094
    },
    {
      "index": 21,
      "name": "Construction",
      "xp": 13043870
    },
    {
      "index": 22,
      "name": "Hunter",
      "xp": 10110889
    }
  ],
  "collectionLog": {
    "tabs": {
      "Bosses": {
        "Abyssal Sire": {
          "index": 0,
          "items": [
            {
              "index": 0,
              "id": 13262,
              "name": "Abyssal orphan",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 25624,
              "name": "Unsired",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 7979,
              "name": "Abyssal head",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 13274,
              "name": "Bludgeon spine",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 13275,
              "name": "Bludgeon claw",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 13276,
              "name": "Bludgeon axon",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 13277,
              "name": "Jar of miasma",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 13265,
              "name": "Abyssal dagger",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 4151,
              "name": "Abyssal whip",
              "quantity": 11
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Abyssal Sire kills",
              "count": 50
            }
          ]
        },
        "Alchemical Hydra": {
          "index": 1,
          "items": [
            {
              "index": 0,
              "id": 22746,
              "name": "Ikkle hydra",
              "quantity": 1
            },
            {
              "index": 1,
              "id": 22966,
              "name": "Hydra's claw",
              "quantity": 2
            },
            {
              "index": 2,
              "id": 22988,
              "name": "Hydra tail",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 22983,
              "name": "Hydra leather",
              "quantity": 2
            },
            {
              "index": 4,
              "id": 22971,
              "name": "Hydra's fang",
              "quantity": 1
            },
            {
              "index": 5,
              "id": 22973,
              "name": "Hydra's eye",
              "quantity": 1
            },
            {
              "index": 6,
              "id": 22969,
              "name": "Hydra's heart",
              "quantity": 1
            },
            {
              "index": 7,
              "id": 22804,
              "name": "Dragon knife",
              "quantity": 150
            },
            {
              "index": 8,
              "id": 20849,
              "name": "Dragon thrownaxe",
              "quantity": 122
            },
            {
              "index": 9,
              "id": 23064,
              "name": "Jar of chemicals",
              "quantity": 3
            },
            {
              "index": 10,
              "id": 23077,
              "name": "Alchemical hydra heads",
              "quantity": 4
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Alchemical Hydra kills",
              "count": 1132
            }
          ]
        },
        "Barrows Chests": {
          "index": 2,
          "items": [
            {
              "index": 0,
              "id": 4732,
              "name": "Karil's coif",
              "quantity": 4
            },
            {
              "index": 1,
              "id": 4708,
              "name": "Ahrim's hood",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 4716,
              "name": "Dharok's helm",
              "quantity": 3
            },
            {
              "index": 3,
              "id": 4724,
              "name": "Guthan's helm",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 4745,
              "name": "Torag's helm",
              "quantity": 7
            },
            {
              "index": 5,
              "id": 4753,
              "name": "Verac's helm",
              "quantity": 4
            },
            {
              "index": 6,
              "id": 4736,
              "name": "Karil's leathertop",
              "quantity": 1
            },
            {
              "index": 7,
              "id": 4712,
              "name": "Ahrim's robetop",
              "quantity": 5
            },
            {
              "index": 8,
              "id": 4720,
              "name": "Dharok's platebody",
              "quantity": 1
            },
            {
              "index": 9,
              "id": 4728,
              "name": "Guthan's platebody",
              "quantity": 2
            },
            {
              "index": 10,
              "id": 4749,
              "name": "Torag's platebody",
              "quantity": 4
            },
            {
              "index": 11,
              "id": 4757,
              "name": "Verac's brassard",
              "quantity": 1
            },
            {
              "index": 12,
              "id": 4738,
              "name": "Karil's leatherskirt",
              "quantity": 3
            },
            {
              "index": 13,
              "id": 4714,
              "name": "Ahrim's robeskirt",
              "quantity": 2
            },
            {
              "index": 14,
              "id": 4722,
              "name": "Dharok's platelegs",
              "quantity": 5
            },
            {
              "index": 15,
              "id": 4730,
              "name": "Guthan's chainskirt",
              "quantity": 3
            },
            {
              "index": 16,
              "id": 4751,
              "name": "Torag's platelegs",
              "quantity": 9
            },
            {
              "index": 17,
              "id": 4759,
              "name": "Verac's plateskirt",
              "quantity": 6
            },
            {
              "index": 18,
              "id": 4734,
              "name": "Karil's crossbow",
              "quantity": 2
            },
            {
              "index": 19,
              "id": 4710,
              "name": "Ahrim's staff",
              "quantity": 7
            },
            {
              "index": 20,
              "id": 4718,
              "name": "Dharok's greataxe",
              "quantity": 4
            },
            {
              "index": 21,
              "id": 4726,
              "name": "Guthan's warspear",
              "quantity": 4
            },
            {
              "index": 22,
              "id": 4747,
              "name": "Torag's hammers",
              "quantity": 2
            },
            {
              "index": 23,
              "id": 4755,
              "name": "Verac's flail",
              "quantity": 3
            },
            {
              "index": 24,
              "id": 4740,
              "name": "Bolt rack",
              "quantity": 666
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Barrows Chests opened",
              "count": 1001
            }
          ]
        },
        "Callisto": {
          "index": 4,
          "items": [
            {
              "index": 0,
              "id": 13178,
              "name": "Callisto cub",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 12603,
              "name": "Tyrannical ring",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 11920,
              "name": "Dragon pickaxe",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 7158,
              "name": "Dragon 2h sword",
              "quantity": 3
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Callisto kills",
              "count": 14
            }
          ]
        },
        "Bryophyta": {
          "index": 3,
          "items": [
            {
              "index": 0,
              "id": 22372,
              "name": "Bryophyta's essence",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Bryophyta kills",
              "count": 6
            }
          ]
        },
        "Chaos Fanatic": {
          "index": 7,
          "items": [
            {
              "index": 0,
              "id": 11995,
              "name": "Pet chaos elemental",
              "quantity": 2
            },
            {
              "index": 1,
              "id": 11928,
              "name": "Odium shard 1",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 11931,
              "name": "Malediction shard 1",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Chaos Fanatic kills",
              "count": 25
            }
          ]
        },
        "Commander Zilyana": {
          "index": 8,
          "items": [
            {
              "index": 0,
              "id": 12651,
              "name": "Pet zilyana",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 11785,
              "name": "Armadyl crossbow",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 11814,
              "name": "Saradomin hilt",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 11838,
              "name": "Saradomin sword",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 13256,
              "name": "Saradomin's light",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 11818,
              "name": "Godsword shard 1",
              "quantity": 5
            },
            {
              "index": 6,
              "id": 11820,
              "name": "Godsword shard 2",
              "quantity": 5
            },
            {
              "index": 7,
              "id": 11822,
              "name": "Godsword shard 3",
              "quantity": 7
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Commander Zilyana kills",
              "count": 1
            }
          ]
        },
        "Corporeal Beast": {
          "index": 9,
          "items": [
            {
              "index": 0,
              "id": 12816,
              "name": "Pet dark core",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 12819,
              "name": "Elysian sigil",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 12823,
              "name": "Spectral sigil",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 12827,
              "name": "Arcane sigil",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 12833,
              "name": "Holy elixir",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 12829,
              "name": "Spirit shield",
              "quantity": 17
            },
            {
              "index": 6,
              "id": 25521,
              "name": "Jar of spirits",
              "quantity": 1
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Corporeal Beast kills",
              "count": 700
            }
          ]
        },
        "Dagannoth Kings": {
          "index": 11,
          "items": [
            {
              "index": 0,
              "id": 12644,
              "name": "Pet dagannoth prime",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 12643,
              "name": "Pet dagannoth supreme",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 12645,
              "name": "Pet dagannoth rex",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 6737,
              "name": "Berserker ring",
              "quantity": 3
            },
            {
              "index": 4,
              "id": 6733,
              "name": "Archers ring",
              "quantity": 1
            },
            {
              "index": 5,
              "id": 6731,
              "name": "Seers ring",
              "quantity": 2
            },
            {
              "index": 6,
              "id": 6735,
              "name": "Warrior ring",
              "quantity": 2
            },
            {
              "index": 7,
              "id": 6739,
              "name": "Dragon axe",
              "quantity": 6
            },
            {
              "index": 8,
              "id": 6724,
              "name": "Seercull",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 6562,
              "name": "Mud battlestaff",
              "quantity": 1
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Dagannoth Rex kills",
              "count": 282
            },
            {
              "index": 1,
              "name": "Dagannoth Prime kills",
              "count": 122
            },
            {
              "index": 2,
              "name": "Dagannoth Supreme kills",
              "count": 133
            }
          ]
        },
        "Crazy Archaeologist": {
          "index": 10,
          "items": [
            {
              "index": 0,
              "id": 11929,
              "name": "Odium shard 2",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 11932,
              "name": "Malediction shard 2",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 11990,
              "name": "Fedora",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Crazy Archaeologist kills",
              "count": 50
            }
          ]
        },
        "The Gauntlet": {
          "index": 13,
          "items": [
            {
              "index": 0,
              "id": 23757,
              "name": "Youngllef",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 23956,
              "name": "Crystal armour seed",
              "quantity": 6
            },
            {
              "index": 2,
              "id": 4207,
              "name": "Crystal weapon seed",
              "quantity": 4
            },
            {
              "index": 3,
              "id": 25859,
              "name": "Enhanced crystal weapon seed",
              "quantity": 2
            },
            {
              "index": 4,
              "id": 23859,
              "name": "Gauntlet cape",
              "quantity": 1
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Gauntlet completion count",
              "count": 8
            },
            {
              "index": 1,
              "name": "Corrupted Gauntlet completion count",
              "count": 166
            }
          ]
        },
        "Zalcano": {
          "index": 41,
          "items": [
            {
              "index": 0,
              "id": 23760,
              "name": "Smolcano",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 23953,
              "name": "Crystal tool seed",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 23908,
              "name": "Zalcano shard",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 6571,
              "name": "Uncut onyx",
              "quantity": 1
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Zalcano kills",
              "count": 314
            }
          ]
        },
        "Zulrah": {
          "index": 42,
          "items": [
            {
              "index": 0,
              "id": 12921,
              "name": "Pet snakeling",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 13200,
              "name": "Tanzanite mutagen",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 13201,
              "name": "Magma mutagen",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 12936,
              "name": "Jar of swamp",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 12932,
              "name": "Magic fang",
              "quantity": 1
            },
            {
              "index": 5,
              "id": 12927,
              "name": "Serpentine visage",
              "quantity": 1
            },
            {
              "index": 6,
              "id": 12922,
              "name": "Tanzanite fang",
              "quantity": 1
            },
            {
              "index": 7,
              "id": 12938,
              "name": "Zul-andra teleport",
              "quantity": 416
            },
            {
              "index": 8,
              "id": 6571,
              "name": "Uncut onyx",
              "quantity": 1
            },
            {
              "index": 9,
              "id": 12934,
              "name": "Zulrah's scales",
              "quantity": 65535
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Zulrah kills",
              "count": 832
            }
          ]
        },
        "Kraken": {
          "index": 22,
          "items": [
            {
              "index": 0,
              "id": 12655,
              "name": "Pet kraken",
              "quantity": 1
            },
            {
              "index": 1,
              "id": 12004,
              "name": "Kraken tentacle",
              "quantity": 2
            },
            {
              "index": 2,
              "id": 11905,
              "name": "Trident of the seas (full)",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 12007,
              "name": "Jar of dirt",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Kraken kills",
              "count": 657
            }
          ]
        },
        "General Graardor": {
          "index": 15,
          "items": [
            {
              "index": 0,
              "id": 12650,
              "name": "Pet general graardor",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 11832,
              "name": "Bandos chestplate",
              "quantity": 2
            },
            {
              "index": 2,
              "id": 11834,
              "name": "Bandos tassets",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 11836,
              "name": "Bandos boots",
              "quantity": 5
            },
            {
              "index": 4,
              "id": 11812,
              "name": "Bandos hilt",
              "quantity": 3
            },
            {
              "index": 5,
              "id": 11818,
              "name": "Godsword shard 1",
              "quantity": 6
            },
            {
              "index": 6,
              "id": 11820,
              "name": "Godsword shard 2",
              "quantity": 6
            },
            {
              "index": 7,
              "id": 11822,
              "name": "Godsword shard 3",
              "quantity": 7
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "General Graardor kills",
              "count": 1005
            }
          ]
        },
        "Kalphite Queen": {
          "index": 19,
          "items": [
            {
              "index": 0,
              "id": 12647,
              "name": "Kalphite princess",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 7981,
              "name": "Kq head",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 12885,
              "name": "Jar of sand",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 7158,
              "name": "Dragon 2h sword",
              "quantity": 3
            },
            {
              "index": 4,
              "id": 3140,
              "name": "Dragon chainbody",
              "quantity": 1
            },
            {
              "index": 5,
              "id": 11920,
              "name": "Dragon pickaxe",
              "quantity": 2
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Kalphite Queen kills",
              "count": 96
            }
          ]
        },
        "Phantom Muspah": {
          "index": 29,
          "items": [
            {
              "index": 0,
              "id": 27590,
              "name": "Muphin",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 27614,
              "name": "Venator shard",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 27627,
              "name": "Ancient icon",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 27643,
              "name": "Charged ice",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 27622,
              "name": "Frozen cache",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 27616,
              "name": "Ancient essence",
              "quantity": 14618
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Phantom Muspah kills",
              "count": 15
            }
          ]
        },
        "Sarachnis": {
          "index": 28,
          "items": [
            {
              "index": 0,
              "id": 23495,
              "name": "Sraracha",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 23525,
              "name": "Jar of eyes",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 23517,
              "name": "Giant egg sac(full)",
              "quantity": 5
            },
            {
              "index": 3,
              "id": 23528,
              "name": "Sarachnis cudgel",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Sarachnis kills",
              "count": 64
            }
          ]
        },
        "Vet'ion and Calvar'ion": {
          "index": 38,
          "items": [
            {
              "index": 0,
              "id": 13179,
              "name": "Vet'ion jr.",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 12601,
              "name": "Ring of the gods",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 11920,
              "name": "Dragon pickaxe",
              "quantity": 2
            },
            {
              "index": 3,
              "id": 7158,
              "name": "Dragon 2h sword",
              "quantity": 4
            },
            {
              "index": 4,
              "id": 27673,
              "name": "Skull of vet'ion",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 27684,
              "name": "Voidwaker blade",
              "quantity": 1
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Vet'ion kills",
              "count": 1
            },
            {
              "index": 1,
              "name": "Calvar'ion kills",
              "count": 367
            }
          ]
        },
        "Venenatis and Spindel": {
          "index": 37,
          "items": [
            {
              "index": 0,
              "id": 13177,
              "name": "Venenatis spiderling",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 12605,
              "name": "Treasonous ring",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 11920,
              "name": "Dragon pickaxe",
              "quantity": 2
            },
            {
              "index": 3,
              "id": 7158,
              "name": "Dragon 2h sword",
              "quantity": 4
            },
            {
              "index": 4,
              "id": 27670,
              "name": "Fangs of venenatis",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 27687,
              "name": "Voidwaker gem",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Venenatis kills",
              "count": 41
            },
            {
              "index": 1,
              "name": "Spindel kills",
              "count": 24
            }
          ]
        },
        "Callisto and Artio": {
          "index": 4,
          "items": [
            {
              "index": 0,
              "id": 13178,
              "name": "Callisto cub",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 12603,
              "name": "Tyrannical ring",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 11920,
              "name": "Dragon pickaxe",
              "quantity": 2
            },
            {
              "index": 3,
              "id": 7158,
              "name": "Dragon 2h sword",
              "quantity": 3
            },
            {
              "index": 4,
              "id": 27667,
              "name": "Claws of callisto",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 27681,
              "name": "Voidwaker hilt",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Callisto kills",
              "count": 15
            },
            {
              "index": 1,
              "name": "Artio kills",
              "count": 95
            }
          ]
        },
        "Chaos Elemental": {
          "index": 6,
          "items": [
            {
              "index": 0,
              "id": 11995,
              "name": "Pet chaos elemental",
              "quantity": 2
            },
            {
              "index": 1,
              "id": 11920,
              "name": "Dragon pickaxe",
              "quantity": 2
            },
            {
              "index": 2,
              "id": 7158,
              "name": "Dragon 2h sword",
              "quantity": 3
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Chaos Elemental kills",
              "count": 302
            }
          ]
        },
        "Tempoross": {
          "index": 33,
          "items": [
            {
              "index": 0,
              "id": 25602,
              "name": "Tiny tempor",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 25559,
              "name": "Big harpoonfish",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 25592,
              "name": "Spirit angler headband",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 25594,
              "name": "Spirit angler top",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 25596,
              "name": "Spirit angler waders",
              "quantity": 1
            },
            {
              "index": 5,
              "id": 25598,
              "name": "Spirit angler boots",
              "quantity": 1
            },
            {
              "index": 6,
              "id": 25576,
              "name": "Tome of water (empty)",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 25578,
              "name": "Soaked page",
              "quantity": 250
            },
            {
              "index": 8,
              "id": 25580,
              "name": "Tackle box",
              "quantity": 1
            },
            {
              "index": 9,
              "id": 25582,
              "name": "Fish barrel",
              "quantity": 1
            },
            {
              "index": 10,
              "id": 21028,
              "name": "Dragon harpoon",
              "quantity": 1
            },
            {
              "index": 11,
              "id": 25588,
              "name": "Spirit flakes",
              "quantity": 11690
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Reward permits claimed",
              "count": 990
            },
            {
              "index": 1,
              "name": "Tempoross kills",
              "count": 207
            }
          ]
        },
        "Thermonuclear Smoke Devil": {
          "index": 32,
          "items": [
            {
              "index": 0,
              "id": 12648,
              "name": "Pet smoke devil",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 12002,
              "name": "Occult necklace",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 11998,
              "name": "Smoke battlestaff",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 3140,
              "name": "Dragon chainbody",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 25524,
              "name": "Jar of smoke",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Thermonuclear Smoke Devil kills",
              "count": 33
            }
          ]
        },
        "Vorkath": {
          "index": 38,
          "items": [
            {
              "index": 0,
              "id": 21992,
              "name": "Vorki",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 21907,
              "name": "Vorkath's head",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 11286,
              "name": "Draconic visage",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 22006,
              "name": "Skeletal visage",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 22106,
              "name": "Jar of decay",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 22111,
              "name": "Dragonbone necklace",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Vorkath kills",
              "count": 55
            }
          ]
        },
        "Wintertodt": {
          "index": 40,
          "items": [
            {
              "index": 0,
              "id": 20693,
              "name": "Phoenix",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 20716,
              "name": "Tome of fire (empty)",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 20718,
              "name": "Burnt page",
              "quantity": 250
            },
            {
              "index": 3,
              "id": 20704,
              "name": "Pyromancer garb",
              "quantity": 3
            },
            {
              "index": 4,
              "id": 20708,
              "name": "Pyromancer hood",
              "quantity": 3
            },
            {
              "index": 5,
              "id": 20706,
              "name": "Pyromancer robe",
              "quantity": 3
            },
            {
              "index": 6,
              "id": 20710,
              "name": "Pyromancer boots",
              "quantity": 2
            },
            {
              "index": 7,
              "id": 20712,
              "name": "Warm gloves",
              "quantity": 11
            },
            {
              "index": 8,
              "id": 20720,
              "name": "Bruma torch",
              "quantity": 11
            },
            {
              "index": 9,
              "id": 6739,
              "name": "Dragon axe",
              "quantity": 6
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Wintertodt kills",
              "count": 1110
            }
          ]
        },
        "K'ril Tsutsaroth": {
          "index": 23,
          "items": [
            {
              "index": 0,
              "id": 12652,
              "name": "Pet k'ril tsutsaroth",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 11791,
              "name": "Staff of the dead",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 11824,
              "name": "Zamorakian spear",
              "quantity": 2
            },
            {
              "index": 3,
              "id": 11787,
              "name": "Steam battlestaff",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 11816,
              "name": "Zamorak hilt",
              "quantity": 1
            },
            {
              "index": 5,
              "id": 11818,
              "name": "Godsword shard 1",
              "quantity": 5
            },
            {
              "index": 6,
              "id": 11820,
              "name": "Godsword shard 2",
              "quantity": 5
            },
            {
              "index": 7,
              "id": 11822,
              "name": "Godsword shard 3",
              "quantity": 7
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "K'ril Tsutsaroth kills",
              "count": 62
            }
          ]
        },
        "The Fight Caves": {
          "index": 12,
          "items": [
            {
              "index": 0,
              "id": 13225,
              "name": "Tzrek-jad",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 6570,
              "name": "Fire cape",
              "quantity": 1
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "TzTok-Jad kills",
              "count": 1
            }
          ]
        },
        "Giant Mole": {
          "index": 15,
          "items": [
            {
              "index": 0,
              "id": 12646,
              "name": "Baby mole",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 7418,
              "name": "Mole skin",
              "quantity": 100
            },
            {
              "index": 2,
              "id": 7416,
              "name": "Mole claw",
              "quantity": 50
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Giant Mole kills",
              "count": 50
            }
          ]
        },
        "Hespori": {
          "index": 17,
          "items": [
            {
              "index": 0,
              "id": 22994,
              "name": "Bottomless compost bucket",
              "quantity": 2
            },
            {
              "index": 1,
              "id": 22883,
              "name": "Iasor seed",
              "quantity": 36
            },
            {
              "index": 2,
              "id": 22885,
              "name": "Kronos seed",
              "quantity": 22
            },
            {
              "index": 3,
              "id": 22881,
              "name": "Attas seed",
              "quantity": 25
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Hespori kills",
              "count": 55
            }
          ]
        },
        "King Black Dragon": {
          "index": 20,
          "items": [
            {
              "index": 0,
              "id": 12653,
              "name": "Prince black dragon",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 7980,
              "name": "Kbd heads",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 11920,
              "name": "Dragon pickaxe",
              "quantity": 2
            },
            {
              "index": 3,
              "id": 11286,
              "name": "Draconic visage",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "King Black Dragon kills",
              "count": 52
            }
          ]
        },
        "Kree'arra": {
          "index": 22,
          "items": [
            {
              "index": 0,
              "id": 12649,
              "name": "Pet kree'arra",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 11826,
              "name": "Armadyl helmet",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 11828,
              "name": "Armadyl chestplate",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 11830,
              "name": "Armadyl chainskirt",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 11810,
              "name": "Armadyl hilt",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 11818,
              "name": "Godsword shard 1",
              "quantity": 5
            },
            {
              "index": 6,
              "id": 11820,
              "name": "Godsword shard 2",
              "quantity": 5
            },
            {
              "index": 7,
              "id": 11822,
              "name": "Godsword shard 3",
              "quantity": 7
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Kree'arra kills",
              "count": 1
            }
          ]
        },
        "Nex": {
          "index": 24,
          "items": [
            {
              "index": 0,
              "id": 26348,
              "name": "Nexling",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 26370,
              "name": "Ancient hilt",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 26372,
              "name": "Nihil horn",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 26235,
              "name": "Zaryte vambraces",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 26376,
              "name": "Torva full helm (damaged)",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 26378,
              "name": "Torva platebody (damaged)",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 26380,
              "name": "Torva platelegs (damaged)",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 26231,
              "name": "Nihil shard",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Nex kills",
              "count": 0
            }
          ]
        },
        "The Nightmare": {
          "index": 27,
          "items": [
            {
              "index": 0,
              "id": 24491,
              "name": "Little nightmare",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 24417,
              "name": "Inquisitor's mace",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 24419,
              "name": "Inquisitor's great helm",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 24420,
              "name": "Inquisitor's hauberk",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 24421,
              "name": "Inquisitor's plateskirt",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 24422,
              "name": "Nightmare staff",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 24514,
              "name": "Volatile orb",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 24511,
              "name": "Harmonised orb",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 24517,
              "name": "Eldritch orb",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 24495,
              "name": "Jar of dreams",
              "quantity": 0
            },
            {
              "index": 10,
              "id": 25837,
              "name": "Slepey tablet",
              "quantity": 0
            },
            {
              "index": 11,
              "id": 25838,
              "name": "Parasitic egg",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Phosani's Nightmare kills",
              "count": 0
            },
            {
              "index": 1,
              "name": "Nightmare kills",
              "count": 0
            }
          ]
        },
        "Obor": {
          "index": 28,
          "items": [
            {
              "index": 0,
              "id": 20756,
              "name": "Hill giant club",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Obor kills",
              "count": 5
            }
          ]
        },
        "Skotizo": {
          "index": 30,
          "items": [
            {
              "index": 0,
              "id": 21273,
              "name": "Skotos",
              "quantity": 2
            },
            {
              "index": 1,
              "id": 19701,
              "name": "Jar of darkness",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 21275,
              "name": "Dark claw",
              "quantity": 2
            },
            {
              "index": 3,
              "id": 19685,
              "name": "Dark totem",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 6571,
              "name": "Uncut onyx",
              "quantity": 1
            },
            {
              "index": 5,
              "id": 19677,
              "name": "Ancient shard",
              "quantity": 122
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Skotizo kills",
              "count": 23
            }
          ]
        },
        "Cerberus": {
          "index": 5,
          "items": [
            {
              "index": 0,
              "id": 13247,
              "name": "Hellpuppy",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 13227,
              "name": "Eternal crystal",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 13229,
              "name": "Pegasian crystal",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 13231,
              "name": "Primordial crystal",
              "quantity": 2
            },
            {
              "index": 4,
              "id": 13245,
              "name": "Jar of souls",
              "quantity": 2
            },
            {
              "index": 5,
              "id": 13233,
              "name": "Smouldering stone",
              "quantity": 1
            },
            {
              "index": 6,
              "id": 13249,
              "name": "Key master teleport",
              "quantity": 51
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Cerberus kills",
              "count": 857
            }
          ]
        },
        "The Inferno": {
          "index": 18,
          "items": [
            {
              "index": 0,
              "id": 21291,
              "name": "Jal-nib-rek",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 21295,
              "name": "Infernal cape",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "TzKal-Zuk kills",
              "count": 0
            }
          ]
        },
        "Grotesque Guardians": {
          "index": 17,
          "items": [
            {
              "index": 0,
              "id": 21748,
              "name": "Noon",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 21730,
              "name": "Black tourmaline core",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 21736,
              "name": "Granite gloves",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 21739,
              "name": "Granite ring",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 21742,
              "name": "Granite hammer",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 21745,
              "name": "Jar of stone",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 21726,
              "name": "Granite dust",
              "quantity": 3844
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Grotesque Guardian kills",
              "count": 50
            }
          ]
        },
        "Scorpia": {
          "index": 29,
          "items": [
            {
              "index": 0,
              "id": 13181,
              "name": "Scorpia's offspring",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 11930,
              "name": "Odium shard 3",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 11933,
              "name": "Malediction shard 3",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Scorpia kills",
              "count": 1
            }
          ]
        },
        "Duke Sucellus": {
          "index": 12,
          "items": [
            {
              "index": 0,
              "id": 28250,
              "name": "Baron",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 28321,
              "name": "Eye of the duke",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 26241,
              "name": "Virtus mask",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 26243,
              "name": "Virtus robe top",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 26245,
              "name": "Virtus robe bottom",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 28281,
              "name": "Magus vestige",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 28270,
              "name": "Ice quartz",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 28333,
              "name": "Frozen tablet",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 28276,
              "name": "Chromium ingot",
              "quantity": 4
            },
            {
              "index": 9,
              "id": 28334,
              "name": "Awakener's orb",
              "quantity": 9
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Duke Sucellus kills",
              "count": 1
            }
          ]
        },
        "The Leviathan": {
          "index": 25,
          "items": [
            {
              "index": 0,
              "id": 28252,
              "name": "Lil'viathan",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 28325,
              "name": "Leviathan's lure",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 26241,
              "name": "Virtus mask",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 26243,
              "name": "Virtus robe top",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 26245,
              "name": "Virtus robe bottom",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 28283,
              "name": "Venator vestige",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 28274,
              "name": "Smoke quartz",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 28332,
              "name": "Scarred tablet",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 28276,
              "name": "Chromium ingot",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Leviathan kills",
              "count": 0
            }
          ]
        },
        "Vardorvis": {
          "index": 35,
          "items": [
            {
              "index": 0,
              "id": 28248,
              "name": "Butch",
              "quantity": 2
            },
            {
              "index": 1,
              "id": 28319,
              "name": "Executioner's axe head",
              "quantity": 4
            },
            {
              "index": 2,
              "id": 26241,
              "name": "Virtus mask",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 26243,
              "name": "Virtus robe top",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 26245,
              "name": "Virtus robe bottom",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 28285,
              "name": "Ultor vestige",
              "quantity": 1
            },
            {
              "index": 6,
              "id": 28268,
              "name": "Blood quartz",
              "quantity": 8
            },
            {
              "index": 7,
              "id": 28330,
              "name": "Strangled tablet",
              "quantity": 1
            },
            {
              "index": 8,
              "id": 28276,
              "name": "Chromium ingot",
              "quantity": 4
            },
            {
              "index": 9,
              "id": 28334,
              "name": "Awakener's orb",
              "quantity": 9
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Vardorvis kills",
              "count": 1729
            }
          ]
        },
        "The Whisperer": {
          "index": 39,
          "items": [
            {
              "index": 0,
              "id": 28246,
              "name": "Wisp",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 28323,
              "name": "Siren's staff",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 26241,
              "name": "Virtus mask",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 26243,
              "name": "Virtus robe top",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 26245,
              "name": "Virtus robe bottom",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 28279,
              "name": "Bellator vestige",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 28272,
              "name": "Shadow quartz",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 28331,
              "name": "Sirenic tablet",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 28276,
              "name": "Chromium ingot",
              "quantity": 4
            },
            {
              "index": 9,
              "id": 28334,
              "name": "Awakener's orb",
              "quantity": 9
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Whisperer kills",
              "count": 1
            }
          ]
        }
      },
      "Minigames": {
        "Magic Training Arena": {
          "index": 9,
          "items": [
            {
              "index": 0,
              "id": 6908,
              "name": "Beginner wand",
              "quantity": 1
            },
            {
              "index": 1,
              "id": 6910,
              "name": "Apprentice wand",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 6912,
              "name": "Teacher wand",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 6914,
              "name": "Master wand",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 6918,
              "name": "Infinity hat",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 6916,
              "name": "Infinity top",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 6924,
              "name": "Infinity bottoms",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 6920,
              "name": "Infinity boots",
              "quantity": 1
            },
            {
              "index": 8,
              "id": 6922,
              "name": "Infinity gloves",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 6889,
              "name": "Mage's book",
              "quantity": 0
            },
            {
              "index": 10,
              "id": 6926,
              "name": "Bones to peaches",
              "quantity": 1
            }
          ]
        },
        "Pest Control": {
          "index": 11,
          "items": [
            {
              "index": 0,
              "id": 8841,
              "name": "Void knight mace",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 8839,
              "name": "Void knight top",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 8840,
              "name": "Void knight robe",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 8842,
              "name": "Void knight gloves",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 11663,
              "name": "Void mage helm",
              "quantity": 1
            },
            {
              "index": 5,
              "id": 11665,
              "name": "Void melee helm",
              "quantity": 1
            },
            {
              "index": 6,
              "id": 11664,
              "name": "Void ranger helm",
              "quantity": 1
            },
            {
              "index": 7,
              "id": 11666,
              "name": "Void seal(8)",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 13072,
              "name": "Elite void top",
              "quantity": 1
            },
            {
              "index": 9,
              "id": 13073,
              "name": "Elite void robe",
              "quantity": 1
            }
          ]
        },
        "Barbarian Assault": {
          "index": 0,
          "items": [
            {
              "index": 0,
              "id": 12703,
              "name": "Pet penance queen",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 10548,
              "name": "Fighter hat",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 10550,
              "name": "Ranger hat",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 10549,
              "name": "Runner hat",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 10547,
              "name": "Healer hat",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 10551,
              "name": "Fighter torso",
              "quantity": 1
            },
            {
              "index": 6,
              "id": 10555,
              "name": "Penance skirt",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 10552,
              "name": "Runner boots",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 10553,
              "name": "Penance gloves",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 10589,
              "name": "Granite helm",
              "quantity": 0
            },
            {
              "index": 10,
              "id": 10564,
              "name": "Granite body",
              "quantity": 1
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "High-level Gambles",
              "count": 0
            }
          ]
        },
        "Giants' Foundry": {
          "index": 4,
          "items": [
            {
              "index": 0,
              "id": 27023,
              "name": "Smiths tunic",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 27025,
              "name": "Smiths trousers",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 27027,
              "name": "Smiths boots",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 27029,
              "name": "Smiths gloves",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 27021,
              "name": "Colossal blade",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 27012,
              "name": "Double ammo mould",
              "quantity": 1
            },
            {
              "index": 6,
              "id": 27014,
              "name": "Kovac's grog",
              "quantity": 4
            },
            {
              "index": 7,
              "id": 27017,
              "name": "Smithing catalyst",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 27019,
              "name": "Ore pack",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Swords created",
              "count": 126
            }
          ]
        },
        "Last Man Standing": {
          "index": 8,
          "items": [
            {
              "index": 0,
              "id": 24189,
              "name": "Deadman's chest",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 24190,
              "name": "Deadman's legs",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 24191,
              "name": "Deadman's cape",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 24192,
              "name": "Armadyl halo",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 24195,
              "name": "Bandos halo",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 24198,
              "name": "Seren halo",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 24201,
              "name": "Ancient halo",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 24204,
              "name": "Brassica halo",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 24868,
              "name": "Golden armadyl special attack",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 24869,
              "name": "Golden bandos special attack",
              "quantity": 0
            },
            {
              "index": 10,
              "id": 24870,
              "name": "Golden saradomin special attack",
              "quantity": 0
            },
            {
              "index": 11,
              "id": 24871,
              "name": "Golden zamorak special attack",
              "quantity": 0
            },
            {
              "index": 12,
              "id": 24207,
              "name": "Victor's cape (1)",
              "quantity": 0
            },
            {
              "index": 13,
              "id": 24209,
              "name": "Victor's cape (10)",
              "quantity": 0
            },
            {
              "index": 14,
              "id": 24211,
              "name": "Victor's cape (50)",
              "quantity": 0
            },
            {
              "index": 15,
              "id": 24213,
              "name": "Victor's cape (100)",
              "quantity": 0
            },
            {
              "index": 16,
              "id": 24215,
              "name": "Victor's cape (500)",
              "quantity": 0
            },
            {
              "index": 17,
              "id": 24520,
              "name": "Victor's cape (1000)",
              "quantity": 0
            },
            {
              "index": 18,
              "id": 12849,
              "name": "Granite clamp",
              "quantity": 0
            },
            {
              "index": 19,
              "id": 24229,
              "name": "Ornate maul handle",
              "quantity": 0
            },
            {
              "index": 20,
              "id": 12798,
              "name": "Steam staff upgrade kit",
              "quantity": 0
            },
            {
              "index": 21,
              "id": 21202,
              "name": "Lava staff upgrade kit",
              "quantity": 0
            },
            {
              "index": 22,
              "id": 12800,
              "name": "Dragon pickaxe upgrade kit",
              "quantity": 0
            },
            {
              "index": 23,
              "id": 12802,
              "name": "Ward upgrade kit",
              "quantity": 0
            },
            {
              "index": 24,
              "id": 12759,
              "name": "Green dark bow paint",
              "quantity": 0
            },
            {
              "index": 25,
              "id": 12761,
              "name": "Yellow dark bow paint",
              "quantity": 0
            },
            {
              "index": 26,
              "id": 12763,
              "name": "White dark bow paint",
              "quantity": 0
            },
            {
              "index": 27,
              "id": 12757,
              "name": "Blue dark bow paint",
              "quantity": 0
            },
            {
              "index": 28,
              "id": 12771,
              "name": "Volcanic whip mix",
              "quantity": 0
            },
            {
              "index": 29,
              "id": 12769,
              "name": "Frozen whip mix",
              "quantity": 0
            },
            {
              "index": 30,
              "id": 24217,
              "name": "Guthixian icon",
              "quantity": 0
            },
            {
              "index": 31,
              "id": 24219,
              "name": "Swift blade",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Last Man Standing Kills",
              "count": 3
            },
            {
              "index": 1,
              "name": "Last Man Standing Wins",
              "count": 0
            },
            {
              "index": 2,
              "name": "Last Man Standing games played",
              "count": 18
            }
          ]
        },
        "Gnome Restaurant": {
          "index": 5,
          "items": [
            {
              "index": 0,
              "id": 9469,
              "name": "Grand seed pod",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 9470,
              "name": "Gnome scarf",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 9472,
              "name": "Gnome goggles",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 9475,
              "name": "Mint cake",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Gnome restaurant easy deliveries",
              "count": 0
            },
            {
              "index": 1,
              "name": "Gnome restaurant hard deliveries",
              "count": 0
            }
          ]
        },
        "Brimhaven Agility Arena": {
          "index": 1,
          "items": [
            {
              "index": 0,
              "id": 2996,
              "name": "Agility arena ticket",
              "quantity": 1
            },
            {
              "index": 1,
              "id": 2997,
              "name": "Pirate's hook",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 21061,
              "name": "Graceful hood",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 21067,
              "name": "Graceful top",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 21070,
              "name": "Graceful legs",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 21073,
              "name": "Graceful gloves",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 21076,
              "name": "Graceful boots",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 21064,
              "name": "Graceful cape",
              "quantity": 0
            }
          ]
        },
        "Fishing Trawler": {
          "index": 3,
          "items": [
            {
              "index": 0,
              "id": 13258,
              "name": "Angler hat",
              "quantity": 1
            },
            {
              "index": 1,
              "id": 13259,
              "name": "Angler top",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 13260,
              "name": "Angler waders",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 13261,
              "name": "Angler boots",
              "quantity": 1
            }
          ]
        },
        "Mahogany Homes": {
          "index": 10,
          "items": [
            {
              "index": 0,
              "id": 24884,
              "name": "Supply crate",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 24872,
              "name": "Carpenter's helmet",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 24874,
              "name": "Carpenter's shirt",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 24876,
              "name": "Carpenter's trousers",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 24878,
              "name": "Carpenter's boots",
              "quantity": 1
            },
            {
              "index": 5,
              "id": 24880,
              "name": "Amy's saw",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 25629,
              "name": "Plank sack",
              "quantity": 1
            },
            {
              "index": 7,
              "id": 24885,
              "name": "Hosidius blueprints",
              "quantity": 0
            }
          ]
        },
        "Castle Wars": {
          "index": 2,
          "items": [
            {
              "index": 0,
              "id": 4071,
              "name": "Decorative helm",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 25165,
              "name": "Decorative full helm",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 4069,
              "name": "Decorative armour",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 4068,
              "name": "Decorative sword",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 4072,
              "name": "Decorative shield",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 4070,
              "name": "Decorative armour",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 11893,
              "name": "Decorative armour",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 25163,
              "name": "Decorative boots",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 4506,
              "name": "Decorative helm",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 25169,
              "name": "Decorative full helm",
              "quantity": 0
            },
            {
              "index": 10,
              "id": 4504,
              "name": "Decorative armour",
              "quantity": 0
            },
            {
              "index": 11,
              "id": 4503,
              "name": "Decorative sword",
              "quantity": 0
            },
            {
              "index": 12,
              "id": 4507,
              "name": "Decorative shield",
              "quantity": 0
            },
            {
              "index": 13,
              "id": 4505,
              "name": "Decorative armour",
              "quantity": 0
            },
            {
              "index": 14,
              "id": 11894,
              "name": "Decorative armour",
              "quantity": 0
            },
            {
              "index": 15,
              "id": 25167,
              "name": "Decorative boots",
              "quantity": 0
            },
            {
              "index": 16,
              "id": 4511,
              "name": "Decorative helm",
              "quantity": 0
            },
            {
              "index": 17,
              "id": 25174,
              "name": "Decorative full helm",
              "quantity": 0
            },
            {
              "index": 18,
              "id": 4509,
              "name": "Decorative armour",
              "quantity": 0
            },
            {
              "index": 19,
              "id": 4508,
              "name": "Decorative sword",
              "quantity": 0
            },
            {
              "index": 20,
              "id": 4512,
              "name": "Decorative shield",
              "quantity": 0
            },
            {
              "index": 21,
              "id": 4510,
              "name": "Decorative armour",
              "quantity": 0
            },
            {
              "index": 22,
              "id": 11895,
              "name": "Decorative armour",
              "quantity": 0
            },
            {
              "index": 23,
              "id": 25171,
              "name": "Decorative boots",
              "quantity": 0
            },
            {
              "index": 24,
              "id": 4513,
              "name": "Castlewars hood",
              "quantity": 0
            },
            {
              "index": 25,
              "id": 4514,
              "name": "Castlewars cloak",
              "quantity": 0
            },
            {
              "index": 26,
              "id": 4515,
              "name": "Castlewars hood",
              "quantity": 0
            },
            {
              "index": 27,
              "id": 4516,
              "name": "Castlewars cloak",
              "quantity": 0
            },
            {
              "index": 28,
              "id": 11891,
              "name": "Saradomin banner",
              "quantity": 0
            },
            {
              "index": 29,
              "id": 11892,
              "name": "Zamorak banner",
              "quantity": 0
            },
            {
              "index": 30,
              "id": 11898,
              "name": "Decorative armour",
              "quantity": 0
            },
            {
              "index": 31,
              "id": 11896,
              "name": "Decorative armour",
              "quantity": 0
            },
            {
              "index": 32,
              "id": 11897,
              "name": "Decorative armour",
              "quantity": 0
            },
            {
              "index": 33,
              "id": 11899,
              "name": "Decorative armour",
              "quantity": 0
            },
            {
              "index": 34,
              "id": 11900,
              "name": "Decorative armour",
              "quantity": 0
            },
            {
              "index": 35,
              "id": 11901,
              "name": "Decorative armour",
              "quantity": 0
            },
            {
              "index": 36,
              "id": 12637,
              "name": "Saradomin halo",
              "quantity": 0
            },
            {
              "index": 37,
              "id": 12638,
              "name": "Zamorak halo",
              "quantity": 0
            },
            {
              "index": 38,
              "id": 12639,
              "name": "Guthix halo",
              "quantity": 0
            }
          ]
        },
        "Guardians of the Rift": {
          "index": 6,
          "items": [
            {
              "index": 0,
              "id": 26901,
              "name": "Abyssal protector",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 26792,
              "name": "Abyssal pearls",
              "quantity": 1461
            },
            {
              "index": 2,
              "id": 26798,
              "name": "Catalytic talisman",
              "quantity": 3
            },
            {
              "index": 3,
              "id": 26813,
              "name": "Abyssal needle",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 26807,
              "name": "Abyssal green dye",
              "quantity": 3
            },
            {
              "index": 5,
              "id": 26809,
              "name": "Abyssal blue dye",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 26811,
              "name": "Abyssal red dye",
              "quantity": 1
            },
            {
              "index": 7,
              "id": 26850,
              "name": "Hat of the eye",
              "quantity": 1
            },
            {
              "index": 8,
              "id": 26852,
              "name": "Robe top of the eye",
              "quantity": 1
            },
            {
              "index": 9,
              "id": 26854,
              "name": "Robe bottoms of the eye",
              "quantity": 1
            },
            {
              "index": 10,
              "id": 26856,
              "name": "Boots of the eye",
              "quantity": 1
            },
            {
              "index": 11,
              "id": 26815,
              "name": "Ring of the elements",
              "quantity": 0
            },
            {
              "index": 12,
              "id": 26822,
              "name": "Abyssal lantern",
              "quantity": 1
            },
            {
              "index": 13,
              "id": 26820,
              "name": "Guardian's eye",
              "quantity": 0
            },
            {
              "index": 14,
              "id": 26908,
              "name": "Intricate pouch",
              "quantity": 1
            },
            {
              "index": 15,
              "id": 26912,
              "name": "Lost bag",
              "quantity": 0
            },
            {
              "index": 16,
              "id": 26910,
              "name": "Tarnished locket",
              "quantity": 1
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Rifts searches",
              "count": 634
            },
            {
              "index": 1,
              "name": "Rifts closed",
              "count": 150
            }
          ]
        },
        "Hallowed Sepulchre": {
          "index": 7,
          "items": [
            {
              "index": 0,
              "id": 24711,
              "name": "Hallowed mark",
              "quantity": 250
            },
            {
              "index": 1,
              "id": 24719,
              "name": "Hallowed token",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 24721,
              "name": "Hallowed grapple",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 24723,
              "name": "Hallowed focus",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 24725,
              "name": "Hallowed symbol",
              "quantity": 1
            },
            {
              "index": 5,
              "id": 24727,
              "name": "Hallowed hammer",
              "quantity": 1
            },
            {
              "index": 6,
              "id": 24731,
              "name": "Hallowed ring",
              "quantity": 1
            },
            {
              "index": 7,
              "id": 24729,
              "name": "Dark dye",
              "quantity": 1
            },
            {
              "index": 8,
              "id": 24733,
              "name": "Dark acorn",
              "quantity": 1
            },
            {
              "index": 9,
              "id": 24740,
              "name": "Strange old lockpick (full)",
              "quantity": 13
            },
            {
              "index": 10,
              "id": 24844,
              "name": "Ring of endurance (uncharged)",
              "quantity": 1
            },
            {
              "index": 11,
              "id": 24763,
              "name": "Mysterious page",
              "quantity": 1
            },
            {
              "index": 12,
              "id": 24765,
              "name": "Mysterious page",
              "quantity": 1
            },
            {
              "index": 13,
              "id": 24767,
              "name": "Mysterious page",
              "quantity": 1
            },
            {
              "index": 14,
              "id": 24769,
              "name": "Mysterious page",
              "quantity": 1
            },
            {
              "index": 15,
              "id": 24771,
              "name": "Mysterious page",
              "quantity": 1
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Grand Hallowed Coffins opened",
              "count": 100
            }
          ]
        },
        "Rogues' Den": {
          "index": 12,
          "items": [
            {
              "index": 0,
              "id": 5554,
              "name": "Rogue mask",
              "quantity": 1
            },
            {
              "index": 1,
              "id": 5553,
              "name": "Rogue top",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 5555,
              "name": "Rogue trousers",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 5557,
              "name": "Rogue boots",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 5556,
              "name": "Rogue gloves",
              "quantity": 1
            }
          ]
        },
        "Shades of Mort'ton": {
          "index": 13,
          "items": [
            {
              "index": 0,
              "id": 12851,
              "name": "Amulet of the damned (full)",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 25630,
              "name": "Flamtaer bag",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 3470,
              "name": "Fine cloth",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 25442,
              "name": "Bronze locks",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 25445,
              "name": "Steel locks",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 25448,
              "name": "Black locks",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 25451,
              "name": "Silver locks",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 25454,
              "name": "Gold locks",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 25438,
              "name": "Zealot's helm",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 25434,
              "name": "Zealot's robe top",
              "quantity": 0
            },
            {
              "index": 10,
              "id": 25436,
              "name": "Zealot's robe bottom",
              "quantity": 0
            },
            {
              "index": 11,
              "id": 25440,
              "name": "Zealot's boots",
              "quantity": 0
            },
            {
              "index": 12,
              "id": 25474,
              "name": "Tree wizards' journal",
              "quantity": 0
            },
            {
              "index": 13,
              "id": 25476,
              "name": "Bloody notes",
              "quantity": 0
            }
          ]
        },
        "Soul Wars": {
          "index": 14,
          "items": [
            {
              "index": 0,
              "id": 25348,
              "name": "Lil' creator",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 25346,
              "name": "Soul cape",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 25340,
              "name": "Ectoplasmator",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Spoils of war opened",
              "count": 0
            }
          ]
        },
        "Tithe Farm": {
          "index": 16,
          "items": [
            {
              "index": 0,
              "id": 13646,
              "name": "Farmer's strawhat",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 13642,
              "name": "Farmer's jacket",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 13640,
              "name": "Farmer's boro trousers",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 13644,
              "name": "Farmer's boots",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 13639,
              "name": "Seed box",
              "quantity": 1
            },
            {
              "index": 5,
              "id": 13353,
              "name": "Gricoller's can",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 13226,
              "name": "Herb sack",
              "quantity": 1
            }
          ]
        },
        "Temple Trekking": {
          "index": 15,
          "items": [
            {
              "index": 0,
              "id": 10941,
              "name": "Lumberjack hat",
              "quantity": 1
            },
            {
              "index": 1,
              "id": 10939,
              "name": "Lumberjack top",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 10940,
              "name": "Lumberjack legs",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 10933,
              "name": "Lumberjack boots",
              "quantity": 1
            }
          ]
        },
        "Trouble Brewing": {
          "index": 17,
          "items": [
            {
              "index": 0,
              "id": 8952,
              "name": "Blue naval shirt",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 8959,
              "name": "Blue tricorn hat",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 8991,
              "name": "Blue navy slacks",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 8953,
              "name": "Green naval shirt",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 8960,
              "name": "Green tricorn hat",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 8992,
              "name": "Green navy slacks",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 8954,
              "name": "Red naval shirt",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 8961,
              "name": "Red tricorn hat",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 8993,
              "name": "Red navy slacks",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 8955,
              "name": "Brown naval shirt",
              "quantity": 0
            },
            {
              "index": 10,
              "id": 8962,
              "name": "Brown tricorn hat",
              "quantity": 0
            },
            {
              "index": 11,
              "id": 8994,
              "name": "Brown navy slacks",
              "quantity": 0
            },
            {
              "index": 12,
              "id": 8956,
              "name": "Black naval shirt",
              "quantity": 0
            },
            {
              "index": 13,
              "id": 8963,
              "name": "Black tricorn hat",
              "quantity": 0
            },
            {
              "index": 14,
              "id": 8995,
              "name": "Black navy slacks",
              "quantity": 0
            },
            {
              "index": 15,
              "id": 8957,
              "name": "Purple naval shirt",
              "quantity": 0
            },
            {
              "index": 16,
              "id": 8964,
              "name": "Purple tricorn hat",
              "quantity": 0
            },
            {
              "index": 17,
              "id": 8996,
              "name": "Purple navy slacks",
              "quantity": 0
            },
            {
              "index": 18,
              "id": 8958,
              "name": "Grey naval shirt",
              "quantity": 0
            },
            {
              "index": 19,
              "id": 8965,
              "name": "Grey tricorn hat",
              "quantity": 0
            },
            {
              "index": 20,
              "id": 8997,
              "name": "Grey navy slacks",
              "quantity": 0
            },
            {
              "index": 21,
              "id": 8966,
              "name": "Cutthroat flag",
              "quantity": 0
            },
            {
              "index": 22,
              "id": 8967,
              "name": "Gilded smile flag",
              "quantity": 0
            },
            {
              "index": 23,
              "id": 8968,
              "name": "Bronze fist flag",
              "quantity": 0
            },
            {
              "index": 24,
              "id": 8969,
              "name": "Lucky shot flag",
              "quantity": 0
            },
            {
              "index": 25,
              "id": 8970,
              "name": "Treasure flag",
              "quantity": 0
            },
            {
              "index": 26,
              "id": 8971,
              "name": "Phasmatys flag",
              "quantity": 0
            },
            {
              "index": 27,
              "id": 8988,
              "name": "The stuff",
              "quantity": 0
            },
            {
              "index": 28,
              "id": 8940,
              "name": "Rum",
              "quantity": 0
            },
            {
              "index": 29,
              "id": 8941,
              "name": "Rum",
              "quantity": 0
            }
          ]
        },
        "Volcanic Mine": {
          "index": 18,
          "items": [
            {
              "index": 0,
              "id": 21697,
              "name": "Ash covered tome",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 25615,
              "name": "Large water container",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 21541,
              "name": "Volcanic mine teleport",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 27695,
              "name": "Dragon pickaxe (broken)",
              "quantity": 0
            }
          ]
        }
      },
      "Clues": {
        "Beginner Treasure Trails": {
          "index": 0,
          "items": [
            {
              "index": 0,
              "id": 23285,
              "name": "Mole slippers",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 23288,
              "name": "Frog slippers",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 23291,
              "name": "Bear feet",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 23294,
              "name": "Demon feet",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 23297,
              "name": "Jester cape",
              "quantity": 1
            },
            {
              "index": 5,
              "id": 23300,
              "name": "Shoulder parrot",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 23303,
              "name": "Monk's robe top (t)",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 23306,
              "name": "Monk's robe (t)",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 23309,
              "name": "Amulet of defence (t)",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 23312,
              "name": "Sandwich lady hat",
              "quantity": 0
            },
            {
              "index": 10,
              "id": 23315,
              "name": "Sandwich lady top",
              "quantity": 0
            },
            {
              "index": 11,
              "id": 23318,
              "name": "Sandwich lady bottom",
              "quantity": 0
            },
            {
              "index": 12,
              "id": 23321,
              "name": "Rune scimitar ornament kit (guthix)",
              "quantity": 1
            },
            {
              "index": 13,
              "id": 23324,
              "name": "Rune scimitar ornament kit (saradomin)",
              "quantity": 0
            },
            {
              "index": 14,
              "id": 23327,
              "name": "Rune scimitar ornament kit (zamorak)",
              "quantity": 0
            },
            {
              "index": 15,
              "id": 12297,
              "name": "Black pickaxe",
              "quantity": 2
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Beginner clues completed",
              "count": 13
            }
          ]
        },
        "Medium Treasure Trails": {
          "index": 2,
          "items": [
            {
              "index": 0,
              "id": 2577,
              "name": "Ranger boots",
              "quantity": 2
            },
            {
              "index": 1,
              "id": 2579,
              "name": "Wizard boots",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 12598,
              "name": "Holy sandals",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 23413,
              "name": "Climbing boots (g)",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 23389,
              "name": "Spiked manacles",
              "quantity": 3
            },
            {
              "index": 5,
              "id": 2605,
              "name": "Adamant full helm (t)",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 2599,
              "name": "Adamant platebody (t)",
              "quantity": 1
            },
            {
              "index": 7,
              "id": 2601,
              "name": "Adamant platelegs (t)",
              "quantity": 1
            },
            {
              "index": 8,
              "id": 3474,
              "name": "Adamant plateskirt (t)",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 2603,
              "name": "Adamant kiteshield (t)",
              "quantity": 1
            },
            {
              "index": 10,
              "id": 2613,
              "name": "Adamant full helm (g)",
              "quantity": 1
            },
            {
              "index": 11,
              "id": 2607,
              "name": "Adamant platebody (g)",
              "quantity": 0
            },
            {
              "index": 12,
              "id": 2609,
              "name": "Adamant platelegs (g)",
              "quantity": 0
            },
            {
              "index": 13,
              "id": 3475,
              "name": "Adamant plateskirt (g)",
              "quantity": 1
            },
            {
              "index": 14,
              "id": 2611,
              "name": "Adamant kiteshield (g)",
              "quantity": 1
            },
            {
              "index": 15,
              "id": 7334,
              "name": "Adamant shield (h1)",
              "quantity": 0
            },
            {
              "index": 16,
              "id": 7340,
              "name": "Adamant shield (h2)",
              "quantity": 1
            },
            {
              "index": 17,
              "id": 7346,
              "name": "Adamant shield (h3)",
              "quantity": 1
            },
            {
              "index": 18,
              "id": 7352,
              "name": "Adamant shield (h4)",
              "quantity": 0
            },
            {
              "index": 19,
              "id": 7358,
              "name": "Adamant shield (h5)",
              "quantity": 0
            },
            {
              "index": 20,
              "id": 10296,
              "name": "Adamant helm (h1)",
              "quantity": 1
            },
            {
              "index": 21,
              "id": 10298,
              "name": "Adamant helm (h2)",
              "quantity": 0
            },
            {
              "index": 22,
              "id": 10300,
              "name": "Adamant helm (h3)",
              "quantity": 1
            },
            {
              "index": 23,
              "id": 10302,
              "name": "Adamant helm (h4)",
              "quantity": 0
            },
            {
              "index": 24,
              "id": 10304,
              "name": "Adamant helm (h5)",
              "quantity": 1
            },
            {
              "index": 25,
              "id": 23392,
              "name": "Adamant platebody (h1)",
              "quantity": 0
            },
            {
              "index": 26,
              "id": 23395,
              "name": "Adamant platebody (h2)",
              "quantity": 1
            },
            {
              "index": 27,
              "id": 23398,
              "name": "Adamant platebody (h3)",
              "quantity": 0
            },
            {
              "index": 28,
              "id": 23401,
              "name": "Adamant platebody (h4)",
              "quantity": 0
            },
            {
              "index": 29,
              "id": 23404,
              "name": "Adamant platebody (h5)",
              "quantity": 1
            },
            {
              "index": 30,
              "id": 12283,
              "name": "Mithril full helm (g)",
              "quantity": 0
            },
            {
              "index": 31,
              "id": 12277,
              "name": "Mithril platebody (g)",
              "quantity": 1
            },
            {
              "index": 32,
              "id": 12279,
              "name": "Mithril platelegs (g)",
              "quantity": 0
            },
            {
              "index": 33,
              "id": 12285,
              "name": "Mithril plateskirt (g)",
              "quantity": 0
            },
            {
              "index": 34,
              "id": 12281,
              "name": "Mithril kiteshield (g)",
              "quantity": 1
            },
            {
              "index": 35,
              "id": 12293,
              "name": "Mithril full helm (t)",
              "quantity": 1
            },
            {
              "index": 36,
              "id": 12287,
              "name": "Mithril platebody (t)",
              "quantity": 1
            },
            {
              "index": 37,
              "id": 12289,
              "name": "Mithril platelegs (t)",
              "quantity": 0
            },
            {
              "index": 38,
              "id": 12295,
              "name": "Mithril plateskirt (t)",
              "quantity": 0
            },
            {
              "index": 39,
              "id": 12291,
              "name": "Mithril kiteshield (t)",
              "quantity": 2
            },
            {
              "index": 40,
              "id": 7370,
              "name": "Green d'hide body (g)",
              "quantity": 0
            },
            {
              "index": 41,
              "id": 7372,
              "name": "Green d'hide body (t)",
              "quantity": 0
            },
            {
              "index": 42,
              "id": 7378,
              "name": "Green d'hide chaps (g)",
              "quantity": 0
            },
            {
              "index": 43,
              "id": 7380,
              "name": "Green d'hide chaps (t)",
              "quantity": 0
            },
            {
              "index": 44,
              "id": 10452,
              "name": "Saradomin mitre",
              "quantity": 0
            },
            {
              "index": 45,
              "id": 10446,
              "name": "Saradomin cloak",
              "quantity": 0
            },
            {
              "index": 46,
              "id": 10454,
              "name": "Guthix mitre",
              "quantity": 1
            },
            {
              "index": 47,
              "id": 10448,
              "name": "Guthix cloak",
              "quantity": 0
            },
            {
              "index": 48,
              "id": 10456,
              "name": "Zamorak mitre",
              "quantity": 2
            },
            {
              "index": 49,
              "id": 10450,
              "name": "Zamorak cloak",
              "quantity": 0
            },
            {
              "index": 50,
              "id": 12203,
              "name": "Ancient mitre",
              "quantity": 0
            },
            {
              "index": 51,
              "id": 12197,
              "name": "Ancient cloak",
              "quantity": 0
            },
            {
              "index": 52,
              "id": 12201,
              "name": "Ancient stole",
              "quantity": 0
            },
            {
              "index": 53,
              "id": 12199,
              "name": "Ancient crozier",
              "quantity": 0
            },
            {
              "index": 54,
              "id": 12259,
              "name": "Armadyl mitre",
              "quantity": 1
            },
            {
              "index": 55,
              "id": 12261,
              "name": "Armadyl cloak",
              "quantity": 0
            },
            {
              "index": 56,
              "id": 12257,
              "name": "Armadyl stole",
              "quantity": 0
            },
            {
              "index": 57,
              "id": 12263,
              "name": "Armadyl crozier",
              "quantity": 1
            },
            {
              "index": 58,
              "id": 12271,
              "name": "Bandos mitre",
              "quantity": 0
            },
            {
              "index": 59,
              "id": 12273,
              "name": "Bandos cloak",
              "quantity": 0
            },
            {
              "index": 60,
              "id": 12269,
              "name": "Bandos stole",
              "quantity": 0
            },
            {
              "index": 61,
              "id": 12275,
              "name": "Bandos crozier",
              "quantity": 0
            },
            {
              "index": 62,
              "id": 7319,
              "name": "Red boater",
              "quantity": 2
            },
            {
              "index": 63,
              "id": 7323,
              "name": "Green boater",
              "quantity": 1
            },
            {
              "index": 64,
              "id": 7321,
              "name": "Orange boater",
              "quantity": 1
            },
            {
              "index": 65,
              "id": 7327,
              "name": "Black boater",
              "quantity": 2
            },
            {
              "index": 66,
              "id": 7325,
              "name": "Blue boater",
              "quantity": 0
            },
            {
              "index": 67,
              "id": 12309,
              "name": "Pink boater",
              "quantity": 0
            },
            {
              "index": 68,
              "id": 12311,
              "name": "Purple boater",
              "quantity": 1
            },
            {
              "index": 69,
              "id": 12313,
              "name": "White boater",
              "quantity": 1
            },
            {
              "index": 70,
              "id": 2645,
              "name": "Red headband",
              "quantity": 1
            },
            {
              "index": 71,
              "id": 2647,
              "name": "Black headband",
              "quantity": 0
            },
            {
              "index": 72,
              "id": 2649,
              "name": "Brown headband",
              "quantity": 1
            },
            {
              "index": 73,
              "id": 12299,
              "name": "White headband",
              "quantity": 0
            },
            {
              "index": 74,
              "id": 12301,
              "name": "Blue headband",
              "quantity": 1
            },
            {
              "index": 75,
              "id": 12303,
              "name": "Gold headband",
              "quantity": 0
            },
            {
              "index": 76,
              "id": 12305,
              "name": "Pink headband",
              "quantity": 0
            },
            {
              "index": 77,
              "id": 12307,
              "name": "Green headband",
              "quantity": 0
            },
            {
              "index": 78,
              "id": 12319,
              "name": "Crier hat",
              "quantity": 2
            },
            {
              "index": 79,
              "id": 20240,
              "name": "Crier coat",
              "quantity": 0
            },
            {
              "index": 80,
              "id": 20243,
              "name": "Crier bell",
              "quantity": 1
            },
            {
              "index": 81,
              "id": 12377,
              "name": "Adamant cane",
              "quantity": 1
            },
            {
              "index": 82,
              "id": 20251,
              "name": "Arceuus banner",
              "quantity": 1
            },
            {
              "index": 83,
              "id": 20260,
              "name": "Piscarilius banner",
              "quantity": 0
            },
            {
              "index": 84,
              "id": 20254,
              "name": "Hosidius banner",
              "quantity": 0
            },
            {
              "index": 85,
              "id": 20263,
              "name": "Shayzien banner",
              "quantity": 1
            },
            {
              "index": 86,
              "id": 20257,
              "name": "Lovakengj banner",
              "quantity": 1
            },
            {
              "index": 87,
              "id": 20272,
              "name": "Cabbage round shield",
              "quantity": 0
            },
            {
              "index": 88,
              "id": 20266,
              "name": "Black unicorn mask",
              "quantity": 0
            },
            {
              "index": 89,
              "id": 20269,
              "name": "White unicorn mask",
              "quantity": 0
            },
            {
              "index": 90,
              "id": 12361,
              "name": "Cat mask",
              "quantity": 1
            },
            {
              "index": 91,
              "id": 12428,
              "name": "Penguin mask",
              "quantity": 0
            },
            {
              "index": 92,
              "id": 12359,
              "name": "Leprechaun hat",
              "quantity": 0
            },
            {
              "index": 93,
              "id": 20246,
              "name": "Black leprechaun hat",
              "quantity": 0
            },
            {
              "index": 94,
              "id": 23407,
              "name": "Wolf mask",
              "quantity": 0
            },
            {
              "index": 95,
              "id": 23410,
              "name": "Wolf cloak",
              "quantity": 0
            },
            {
              "index": 96,
              "id": 10416,
              "name": "Purple elegant shirt",
              "quantity": 0
            },
            {
              "index": 97,
              "id": 10436,
              "name": "Purple elegant blouse",
              "quantity": 0
            },
            {
              "index": 98,
              "id": 10418,
              "name": "Purple elegant legs",
              "quantity": 0
            },
            {
              "index": 99,
              "id": 10438,
              "name": "Purple elegant skirt",
              "quantity": 1
            },
            {
              "index": 100,
              "id": 10400,
              "name": "Black elegant shirt",
              "quantity": 1
            },
            {
              "index": 101,
              "id": 10420,
              "name": "White elegant blouse",
              "quantity": 0
            },
            {
              "index": 102,
              "id": 10402,
              "name": "Black elegant legs",
              "quantity": 0
            },
            {
              "index": 103,
              "id": 10422,
              "name": "White elegant skirt",
              "quantity": 0
            },
            {
              "index": 104,
              "id": 12315,
              "name": "Pink elegant shirt",
              "quantity": 0
            },
            {
              "index": 105,
              "id": 12339,
              "name": "Pink elegant blouse",
              "quantity": 0
            },
            {
              "index": 106,
              "id": 12317,
              "name": "Pink elegant legs",
              "quantity": 0
            },
            {
              "index": 107,
              "id": 12341,
              "name": "Pink elegant skirt",
              "quantity": 0
            },
            {
              "index": 108,
              "id": 12347,
              "name": "Gold elegant shirt",
              "quantity": 0
            },
            {
              "index": 109,
              "id": 12343,
              "name": "Gold elegant blouse",
              "quantity": 0
            },
            {
              "index": 110,
              "id": 12349,
              "name": "Gold elegant legs",
              "quantity": 0
            },
            {
              "index": 111,
              "id": 12345,
              "name": "Gold elegant skirt",
              "quantity": 0
            },
            {
              "index": 112,
              "id": 20275,
              "name": "Gnomish firelighter",
              "quantity": 0
            },
            {
              "index": 113,
              "id": 10364,
              "name": "Strength amulet (t)",
              "quantity": 1
            },
            {
              "index": 114,
              "id": 10282,
              "name": "Yew comp bow",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Medium clues completed",
              "count": 130
            }
          ]
        },
        "Master Treasure Trails (Rare)": {
          "index": 8,
          "items": [
            {
              "index": 0,
              "id": 20014,
              "name": "3rd age pickaxe",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 20011,
              "name": "3rd age axe",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 12426,
              "name": "3rd age longsword",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 12422,
              "name": "3rd age wand",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 12437,
              "name": "3rd age cloak",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 12424,
              "name": "3rd age bow",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 10334,
              "name": "3rd age range coif",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 10330,
              "name": "3rd age range top",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 10332,
              "name": "3rd age range legs",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 10336,
              "name": "3rd age vambraces",
              "quantity": 0
            },
            {
              "index": 10,
              "id": 10338,
              "name": "3rd age robe top",
              "quantity": 0
            },
            {
              "index": 11,
              "id": 10340,
              "name": "3rd age robe",
              "quantity": 0
            },
            {
              "index": 12,
              "id": 10342,
              "name": "3rd age mage hat",
              "quantity": 0
            },
            {
              "index": 13,
              "id": 10344,
              "name": "3rd age amulet",
              "quantity": 0
            },
            {
              "index": 14,
              "id": 23242,
              "name": "3rd age plateskirt",
              "quantity": 0
            },
            {
              "index": 15,
              "id": 10346,
              "name": "3rd age platelegs",
              "quantity": 0
            },
            {
              "index": 16,
              "id": 10348,
              "name": "3rd age platebody",
              "quantity": 0
            },
            {
              "index": 17,
              "id": 10350,
              "name": "3rd age full helmet",
              "quantity": 0
            },
            {
              "index": 18,
              "id": 10352,
              "name": "3rd age kiteshield",
              "quantity": 0
            },
            {
              "index": 19,
              "id": 23339,
              "name": "3rd age druidic robe bottoms",
              "quantity": 0
            },
            {
              "index": 20,
              "id": 23336,
              "name": "3rd age druidic robe top",
              "quantity": 0
            },
            {
              "index": 21,
              "id": 23342,
              "name": "3rd age druidic staff",
              "quantity": 0
            },
            {
              "index": 22,
              "id": 23345,
              "name": "3rd age druidic cloak",
              "quantity": 0
            },
            {
              "index": 23,
              "id": 12389,
              "name": "Gilded scimitar",
              "quantity": 0
            },
            {
              "index": 24,
              "id": 12391,
              "name": "Gilded boots",
              "quantity": 0
            },
            {
              "index": 25,
              "id": 3481,
              "name": "Gilded platebody",
              "quantity": 0
            },
            {
              "index": 26,
              "id": 3483,
              "name": "Gilded platelegs",
              "quantity": 0
            },
            {
              "index": 27,
              "id": 3485,
              "name": "Gilded plateskirt",
              "quantity": 0
            },
            {
              "index": 28,
              "id": 3486,
              "name": "Gilded full helm",
              "quantity": 0
            },
            {
              "index": 29,
              "id": 3488,
              "name": "Gilded kiteshield",
              "quantity": 0
            },
            {
              "index": 30,
              "id": 20146,
              "name": "Gilded med helm",
              "quantity": 0
            },
            {
              "index": 31,
              "id": 20149,
              "name": "Gilded chainbody",
              "quantity": 0
            },
            {
              "index": 32,
              "id": 20152,
              "name": "Gilded sq shield",
              "quantity": 0
            },
            {
              "index": 33,
              "id": 20155,
              "name": "Gilded 2h sword",
              "quantity": 0
            },
            {
              "index": 34,
              "id": 20158,
              "name": "Gilded spear",
              "quantity": 0
            },
            {
              "index": 35,
              "id": 20161,
              "name": "Gilded hasta",
              "quantity": 0
            },
            {
              "index": 36,
              "id": 23258,
              "name": "Gilded coif",
              "quantity": 0
            },
            {
              "index": 37,
              "id": 23261,
              "name": "Gilded d'hide vambraces",
              "quantity": 0
            },
            {
              "index": 38,
              "id": 23264,
              "name": "Gilded d'hide body",
              "quantity": 0
            },
            {
              "index": 39,
              "id": 23267,
              "name": "Gilded d'hide chaps",
              "quantity": 0
            },
            {
              "index": 40,
              "id": 23276,
              "name": "Gilded pickaxe",
              "quantity": 0
            },
            {
              "index": 41,
              "id": 23279,
              "name": "Gilded axe",
              "quantity": 0
            },
            {
              "index": 42,
              "id": 23282,
              "name": "Gilded spade",
              "quantity": 0
            },
            {
              "index": 43,
              "id": 20059,
              "name": "Bucket helm (g)",
              "quantity": 0
            },
            {
              "index": 44,
              "id": 20017,
              "name": "Ring of coins",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Master clues completed",
              "count": 15
            }
          ]
        },
        "Shared Treasure Trail Rewards": {
          "index": 9,
          "items": [
            {
              "index": 0,
              "id": 3827,
              "name": "Saradomin page 1",
              "quantity": 1
            },
            {
              "index": 1,
              "id": 3831,
              "name": "Zamorak page 1",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 3835,
              "name": "Guthix page 1",
              "quantity": 3
            },
            {
              "index": 3,
              "id": 12613,
              "name": "Bandos page 1",
              "quantity": 2
            },
            {
              "index": 4,
              "id": 12617,
              "name": "Armadyl page 1",
              "quantity": 4
            },
            {
              "index": 5,
              "id": 12621,
              "name": "Ancient page 1",
              "quantity": 5
            },
            {
              "index": 6,
              "id": 3828,
              "name": "Saradomin page 2",
              "quantity": 2
            },
            {
              "index": 7,
              "id": 3832,
              "name": "Zamorak page 2",
              "quantity": 2
            },
            {
              "index": 8,
              "id": 3836,
              "name": "Guthix page 2",
              "quantity": 3
            },
            {
              "index": 9,
              "id": 12614,
              "name": "Bandos page 2",
              "quantity": 2
            },
            {
              "index": 10,
              "id": 12618,
              "name": "Armadyl page 2",
              "quantity": 3
            },
            {
              "index": 11,
              "id": 12622,
              "name": "Ancient page 2",
              "quantity": 2
            },
            {
              "index": 12,
              "id": 3829,
              "name": "Saradomin page 3",
              "quantity": 2
            },
            {
              "index": 13,
              "id": 3833,
              "name": "Zamorak page 3",
              "quantity": 0
            },
            {
              "index": 14,
              "id": 3837,
              "name": "Guthix page 3",
              "quantity": 0
            },
            {
              "index": 15,
              "id": 12615,
              "name": "Bandos page 3",
              "quantity": 5
            },
            {
              "index": 16,
              "id": 12619,
              "name": "Armadyl page 3",
              "quantity": 1
            },
            {
              "index": 17,
              "id": 12623,
              "name": "Ancient page 3",
              "quantity": 0
            },
            {
              "index": 18,
              "id": 3830,
              "name": "Saradomin page 4",
              "quantity": 2
            },
            {
              "index": 19,
              "id": 3834,
              "name": "Zamorak page 4",
              "quantity": 1
            },
            {
              "index": 20,
              "id": 3838,
              "name": "Guthix page 4",
              "quantity": 2
            },
            {
              "index": 21,
              "id": 12616,
              "name": "Bandos page 4",
              "quantity": 2
            },
            {
              "index": 22,
              "id": 12620,
              "name": "Armadyl page 4",
              "quantity": 3
            },
            {
              "index": 23,
              "id": 12624,
              "name": "Ancient page 4",
              "quantity": 4
            },
            {
              "index": 24,
              "id": 20220,
              "name": "Holy blessing",
              "quantity": 6
            },
            {
              "index": 25,
              "id": 20223,
              "name": "Unholy blessing",
              "quantity": 2
            },
            {
              "index": 26,
              "id": 20226,
              "name": "Peaceful blessing",
              "quantity": 2
            },
            {
              "index": 27,
              "id": 20232,
              "name": "War blessing",
              "quantity": 2
            },
            {
              "index": 28,
              "id": 20229,
              "name": "Honourable blessing",
              "quantity": 1
            },
            {
              "index": 29,
              "id": 20235,
              "name": "Ancient blessing",
              "quantity": 2
            },
            {
              "index": 30,
              "id": 12402,
              "name": "Nardah teleport",
              "quantity": 53
            },
            {
              "index": 31,
              "id": 12411,
              "name": "Mos le'harmless teleport",
              "quantity": 10
            },
            {
              "index": 32,
              "id": 12406,
              "name": "Mort'ton teleport",
              "quantity": 51
            },
            {
              "index": 33,
              "id": 12404,
              "name": "Feldip hills teleport",
              "quantity": 83
            },
            {
              "index": 34,
              "id": 12405,
              "name": "Lunar isle teleport",
              "quantity": 81
            },
            {
              "index": 35,
              "id": 12403,
              "name": "Digsite teleport",
              "quantity": 47
            },
            {
              "index": 36,
              "id": 12408,
              "name": "Piscatoris teleport",
              "quantity": 34
            },
            {
              "index": 37,
              "id": 12407,
              "name": "Pest control teleport",
              "quantity": 23
            },
            {
              "index": 38,
              "id": 12409,
              "name": "Tai bwo wannai teleport",
              "quantity": 28
            },
            {
              "index": 39,
              "id": 12642,
              "name": "Lumberyard teleport",
              "quantity": 27
            },
            {
              "index": 40,
              "id": 12410,
              "name": "Iorwerth camp teleport",
              "quantity": 82
            },
            {
              "index": 41,
              "id": 21387,
              "name": "Master scroll book (empty)",
              "quantity": 2
            },
            {
              "index": 42,
              "id": 7329,
              "name": "Red firelighter",
              "quantity": 188
            },
            {
              "index": 43,
              "id": 7330,
              "name": "Green firelighter",
              "quantity": 72
            },
            {
              "index": 44,
              "id": 7331,
              "name": "Blue firelighter",
              "quantity": 103
            },
            {
              "index": 45,
              "id": 10326,
              "name": "Purple firelighter",
              "quantity": 134
            },
            {
              "index": 46,
              "id": 10327,
              "name": "White firelighter",
              "quantity": 69
            },
            {
              "index": 47,
              "id": 20238,
              "name": "Charge dragonstone jewellery scroll",
              "quantity": 41
            },
            {
              "index": 48,
              "id": 10476,
              "name": "Purple sweets",
              "quantity": 764
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Total clues completed",
              "count": 367
            }
          ]
        },
        "Hard Treasure Trails": {
          "index": 3,
          "items": [
            {
              "index": 0,
              "id": 2581,
              "name": "Robin hood hat",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 22231,
              "name": "Dragon boots ornament kit",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 23227,
              "name": "Rune defender ornament kit",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 23232,
              "name": "Tzhaar-ket-om ornament kit",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 23237,
              "name": "Berserker necklace ornament kit",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 2627,
              "name": "Rune full helm (t)",
              "quantity": 1
            },
            {
              "index": 6,
              "id": 2623,
              "name": "Rune platebody (t)",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 2625,
              "name": "Rune platelegs (t)",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 3477,
              "name": "Rune plateskirt (t)",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 2629,
              "name": "Rune kiteshield (t)",
              "quantity": 0
            },
            {
              "index": 10,
              "id": 2619,
              "name": "Rune full helm (g)",
              "quantity": 0
            },
            {
              "index": 11,
              "id": 2615,
              "name": "Rune platebody (g)",
              "quantity": 1
            },
            {
              "index": 12,
              "id": 2617,
              "name": "Rune platelegs (g)",
              "quantity": 1
            },
            {
              "index": 13,
              "id": 3476,
              "name": "Rune plateskirt (g)",
              "quantity": 0
            },
            {
              "index": 14,
              "id": 2621,
              "name": "Rune kiteshield (g)",
              "quantity": 1
            },
            {
              "index": 15,
              "id": 2657,
              "name": "Zamorak full helm",
              "quantity": 0
            },
            {
              "index": 16,
              "id": 2653,
              "name": "Zamorak platebody",
              "quantity": 2
            },
            {
              "index": 17,
              "id": 2655,
              "name": "Zamorak platelegs",
              "quantity": 0
            },
            {
              "index": 18,
              "id": 3478,
              "name": "Zamorak plateskirt",
              "quantity": 1
            },
            {
              "index": 19,
              "id": 2659,
              "name": "Zamorak kiteshield",
              "quantity": 1
            },
            {
              "index": 20,
              "id": 2673,
              "name": "Guthix full helm",
              "quantity": 2
            },
            {
              "index": 21,
              "id": 2669,
              "name": "Guthix platebody",
              "quantity": 0
            },
            {
              "index": 22,
              "id": 2671,
              "name": "Guthix platelegs",
              "quantity": 1
            },
            {
              "index": 23,
              "id": 3480,
              "name": "Guthix plateskirt",
              "quantity": 0
            },
            {
              "index": 24,
              "id": 2675,
              "name": "Guthix kiteshield",
              "quantity": 0
            },
            {
              "index": 25,
              "id": 2665,
              "name": "Saradomin full helm",
              "quantity": 1
            },
            {
              "index": 26,
              "id": 2661,
              "name": "Saradomin platebody",
              "quantity": 0
            },
            {
              "index": 27,
              "id": 2663,
              "name": "Saradomin platelegs",
              "quantity": 0
            },
            {
              "index": 28,
              "id": 3479,
              "name": "Saradomin plateskirt",
              "quantity": 0
            },
            {
              "index": 29,
              "id": 2667,
              "name": "Saradomin kiteshield",
              "quantity": 0
            },
            {
              "index": 30,
              "id": 12466,
              "name": "Ancient full helm",
              "quantity": 0
            },
            {
              "index": 31,
              "id": 12460,
              "name": "Ancient platebody",
              "quantity": 0
            },
            {
              "index": 32,
              "id": 12462,
              "name": "Ancient platelegs",
              "quantity": 3
            },
            {
              "index": 33,
              "id": 12464,
              "name": "Ancient plateskirt",
              "quantity": 0
            },
            {
              "index": 34,
              "id": 12468,
              "name": "Ancient kiteshield",
              "quantity": 0
            },
            {
              "index": 35,
              "id": 12476,
              "name": "Armadyl full helm",
              "quantity": 0
            },
            {
              "index": 36,
              "id": 12470,
              "name": "Armadyl platebody",
              "quantity": 0
            },
            {
              "index": 37,
              "id": 12472,
              "name": "Armadyl platelegs",
              "quantity": 0
            },
            {
              "index": 38,
              "id": 12474,
              "name": "Armadyl plateskirt",
              "quantity": 0
            },
            {
              "index": 39,
              "id": 12478,
              "name": "Armadyl kiteshield",
              "quantity": 1
            },
            {
              "index": 40,
              "id": 12486,
              "name": "Bandos full helm",
              "quantity": 0
            },
            {
              "index": 41,
              "id": 12480,
              "name": "Bandos platebody",
              "quantity": 0
            },
            {
              "index": 42,
              "id": 12482,
              "name": "Bandos platelegs",
              "quantity": 1
            },
            {
              "index": 43,
              "id": 12484,
              "name": "Bandos plateskirt",
              "quantity": 0
            },
            {
              "index": 44,
              "id": 12488,
              "name": "Bandos kiteshield",
              "quantity": 1
            },
            {
              "index": 45,
              "id": 7336,
              "name": "Rune shield (h1)",
              "quantity": 2
            },
            {
              "index": 46,
              "id": 7342,
              "name": "Rune shield (h2)",
              "quantity": 2
            },
            {
              "index": 47,
              "id": 7348,
              "name": "Rune shield (h3)",
              "quantity": 0
            },
            {
              "index": 48,
              "id": 7354,
              "name": "Rune shield (h4)",
              "quantity": 1
            },
            {
              "index": 49,
              "id": 7360,
              "name": "Rune shield (h5)",
              "quantity": 0
            },
            {
              "index": 50,
              "id": 10286,
              "name": "Rune helm (h1)",
              "quantity": 0
            },
            {
              "index": 51,
              "id": 10288,
              "name": "Rune helm (h2)",
              "quantity": 0
            },
            {
              "index": 52,
              "id": 10290,
              "name": "Rune helm (h3)",
              "quantity": 0
            },
            {
              "index": 53,
              "id": 10292,
              "name": "Rune helm (h4)",
              "quantity": 0
            },
            {
              "index": 54,
              "id": 10294,
              "name": "Rune helm (h5)",
              "quantity": 1
            },
            {
              "index": 55,
              "id": 23209,
              "name": "Rune platebody (h1)",
              "quantity": 0
            },
            {
              "index": 56,
              "id": 23212,
              "name": "Rune platebody (h2)",
              "quantity": 0
            },
            {
              "index": 57,
              "id": 23215,
              "name": "Rune platebody (h3)",
              "quantity": 0
            },
            {
              "index": 58,
              "id": 23218,
              "name": "Rune platebody (h4)",
              "quantity": 0
            },
            {
              "index": 59,
              "id": 23221,
              "name": "Rune platebody (h5)",
              "quantity": 0
            },
            {
              "index": 60,
              "id": 10390,
              "name": "Saradomin coif",
              "quantity": 0
            },
            {
              "index": 61,
              "id": 10386,
              "name": "Saradomin d'hide body",
              "quantity": 1
            },
            {
              "index": 62,
              "id": 10388,
              "name": "Saradomin chaps",
              "quantity": 0
            },
            {
              "index": 63,
              "id": 10384,
              "name": "Saradomin bracers",
              "quantity": 0
            },
            {
              "index": 64,
              "id": 19933,
              "name": "Saradomin d'hide boots",
              "quantity": 0
            },
            {
              "index": 65,
              "id": 23191,
              "name": "Saradomin d'hide shield",
              "quantity": 0
            },
            {
              "index": 66,
              "id": 10382,
              "name": "Guthix coif",
              "quantity": 1
            },
            {
              "index": 67,
              "id": 10378,
              "name": "Guthix d'hide body",
              "quantity": 0
            },
            {
              "index": 68,
              "id": 10380,
              "name": "Guthix chaps",
              "quantity": 0
            },
            {
              "index": 69,
              "id": 10376,
              "name": "Guthix bracers",
              "quantity": 1
            },
            {
              "index": 70,
              "id": 19927,
              "name": "Guthix d'hide boots",
              "quantity": 2
            },
            {
              "index": 71,
              "id": 23188,
              "name": "Guthix d'hide shield",
              "quantity": 0
            },
            {
              "index": 72,
              "id": 10374,
              "name": "Zamorak coif",
              "quantity": 0
            },
            {
              "index": 73,
              "id": 10370,
              "name": "Zamorak d'hide body",
              "quantity": 2
            },
            {
              "index": 74,
              "id": 10372,
              "name": "Zamorak chaps",
              "quantity": 1
            },
            {
              "index": 75,
              "id": 10368,
              "name": "Zamorak bracers",
              "quantity": 0
            },
            {
              "index": 76,
              "id": 19936,
              "name": "Zamorak d'hide boots",
              "quantity": 1
            },
            {
              "index": 77,
              "id": 23194,
              "name": "Zamorak d'hide shield",
              "quantity": 0
            },
            {
              "index": 78,
              "id": 12504,
              "name": "Bandos coif",
              "quantity": 0
            },
            {
              "index": 79,
              "id": 12500,
              "name": "Bandos d'hide body",
              "quantity": 1
            },
            {
              "index": 80,
              "id": 12502,
              "name": "Bandos chaps",
              "quantity": 0
            },
            {
              "index": 81,
              "id": 12498,
              "name": "Bandos bracers",
              "quantity": 0
            },
            {
              "index": 82,
              "id": 19924,
              "name": "Bandos d'hide boots",
              "quantity": 2
            },
            {
              "index": 83,
              "id": 23203,
              "name": "Bandos d'hide shield",
              "quantity": 0
            },
            {
              "index": 84,
              "id": 12512,
              "name": "Armadyl coif",
              "quantity": 2
            },
            {
              "index": 85,
              "id": 12508,
              "name": "Armadyl d'hide body",
              "quantity": 1
            },
            {
              "index": 86,
              "id": 12510,
              "name": "Armadyl chaps",
              "quantity": 0
            },
            {
              "index": 87,
              "id": 12506,
              "name": "Armadyl bracers",
              "quantity": 1
            },
            {
              "index": 88,
              "id": 19930,
              "name": "Armadyl d'hide boots",
              "quantity": 3
            },
            {
              "index": 89,
              "id": 23200,
              "name": "Armadyl d'hide shield",
              "quantity": 0
            },
            {
              "index": 90,
              "id": 12496,
              "name": "Ancient coif",
              "quantity": 0
            },
            {
              "index": 91,
              "id": 12492,
              "name": "Ancient d'hide body",
              "quantity": 1
            },
            {
              "index": 92,
              "id": 12494,
              "name": "Ancient chaps",
              "quantity": 0
            },
            {
              "index": 93,
              "id": 12490,
              "name": "Ancient bracers",
              "quantity": 1
            },
            {
              "index": 94,
              "id": 19921,
              "name": "Ancient d'hide boots",
              "quantity": 1
            },
            {
              "index": 95,
              "id": 23197,
              "name": "Ancient d'hide shield",
              "quantity": 0
            },
            {
              "index": 96,
              "id": 12331,
              "name": "Red d'hide body (t)",
              "quantity": 0
            },
            {
              "index": 97,
              "id": 12333,
              "name": "Red d'hide chaps (t)",
              "quantity": 1
            },
            {
              "index": 98,
              "id": 12327,
              "name": "Red d'hide body (g)",
              "quantity": 1
            },
            {
              "index": 99,
              "id": 12329,
              "name": "Red d'hide chaps (g)",
              "quantity": 1
            },
            {
              "index": 100,
              "id": 7376,
              "name": "Blue d'hide body (t)",
              "quantity": 0
            },
            {
              "index": 101,
              "id": 7384,
              "name": "Blue d'hide chaps (t)",
              "quantity": 1
            },
            {
              "index": 102,
              "id": 7374,
              "name": "Blue d'hide body (g)",
              "quantity": 2
            },
            {
              "index": 103,
              "id": 7382,
              "name": "Blue d'hide chaps (g)",
              "quantity": 1
            },
            {
              "index": 104,
              "id": 7400,
              "name": "Enchanted hat",
              "quantity": 0
            },
            {
              "index": 105,
              "id": 7399,
              "name": "Enchanted top",
              "quantity": 1
            },
            {
              "index": 106,
              "id": 7398,
              "name": "Enchanted robe",
              "quantity": 1
            },
            {
              "index": 107,
              "id": 10470,
              "name": "Saradomin stole",
              "quantity": 0
            },
            {
              "index": 108,
              "id": 10440,
              "name": "Saradomin crozier",
              "quantity": 0
            },
            {
              "index": 109,
              "id": 10472,
              "name": "Guthix stole",
              "quantity": 1
            },
            {
              "index": 110,
              "id": 10442,
              "name": "Guthix crozier",
              "quantity": 0
            },
            {
              "index": 111,
              "id": 10474,
              "name": "Zamorak stole",
              "quantity": 1
            },
            {
              "index": 112,
              "id": 10444,
              "name": "Zamorak crozier",
              "quantity": 1
            },
            {
              "index": 113,
              "id": 19912,
              "name": "Zombie head",
              "quantity": 0
            },
            {
              "index": 114,
              "id": 19915,
              "name": "Cyclops head",
              "quantity": 1
            },
            {
              "index": 115,
              "id": 2651,
              "name": "Pirate's hat",
              "quantity": 0
            },
            {
              "index": 116,
              "id": 12323,
              "name": "Red cavalier",
              "quantity": 1
            },
            {
              "index": 117,
              "id": 12321,
              "name": "White cavalier",
              "quantity": 3
            },
            {
              "index": 118,
              "id": 12325,
              "name": "Navy cavalier",
              "quantity": 1
            },
            {
              "index": 119,
              "id": 2639,
              "name": "Tan cavalier",
              "quantity": 0
            },
            {
              "index": 120,
              "id": 2641,
              "name": "Dark cavalier",
              "quantity": 0
            },
            {
              "index": 121,
              "id": 2643,
              "name": "Black cavalier",
              "quantity": 0
            },
            {
              "index": 122,
              "id": 12516,
              "name": "Pith helmet",
              "quantity": 0
            },
            {
              "index": 123,
              "id": 12514,
              "name": "Explorer backpack",
              "quantity": 1
            },
            {
              "index": 124,
              "id": 23224,
              "name": "Thieving bag",
              "quantity": 0
            },
            {
              "index": 125,
              "id": 12518,
              "name": "Green dragon mask",
              "quantity": 0
            },
            {
              "index": 126,
              "id": 12520,
              "name": "Blue dragon mask",
              "quantity": 0
            },
            {
              "index": 127,
              "id": 12522,
              "name": "Red dragon mask",
              "quantity": 0
            },
            {
              "index": 128,
              "id": 12524,
              "name": "Black dragon mask",
              "quantity": 0
            },
            {
              "index": 129,
              "id": 19918,
              "name": "Nunchaku",
              "quantity": 0
            },
            {
              "index": 130,
              "id": 23206,
              "name": "Dual sai",
              "quantity": 0
            },
            {
              "index": 131,
              "id": 12379,
              "name": "Rune cane",
              "quantity": 1
            },
            {
              "index": 132,
              "id": 10354,
              "name": "Amulet of glory (t4)",
              "quantity": 0
            },
            {
              "index": 133,
              "id": 10284,
              "name": "Magic comp bow",
              "quantity": 6
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Hard clues completed",
              "count": 164
            }
          ]
        },
        "Elite Treasure Trails": {
          "index": 4,
          "items": [
            {
              "index": 0,
              "id": 23185,
              "name": "Ring of 3rd age",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 12526,
              "name": "Fury ornament kit",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 12534,
              "name": "Dragon chainbody ornament kit",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 12536,
              "name": "Dragon legs/skirt ornament kit",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 12532,
              "name": "Dragon sq shield ornament kit",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 12538,
              "name": "Dragon full helm ornament kit",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 20002,
              "name": "Dragon scimitar ornament kit",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 12530,
              "name": "Light infinity colour kit",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 12528,
              "name": "Dark infinity colour kit",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 19997,
              "name": "Holy wraps",
              "quantity": 1
            },
            {
              "index": 10,
              "id": 19994,
              "name": "Ranger gloves",
              "quantity": 0
            },
            {
              "index": 11,
              "id": 12596,
              "name": "Rangers' tunic",
              "quantity": 0
            },
            {
              "index": 12,
              "id": 23249,
              "name": "Rangers' tights",
              "quantity": 0
            },
            {
              "index": 13,
              "id": 12381,
              "name": "Black d'hide body (g)",
              "quantity": 0
            },
            {
              "index": 14,
              "id": 12383,
              "name": "Black d'hide chaps (g)",
              "quantity": 1
            },
            {
              "index": 15,
              "id": 12385,
              "name": "Black d'hide body (t)",
              "quantity": 0
            },
            {
              "index": 16,
              "id": 12387,
              "name": "Black d'hide chaps (t)",
              "quantity": 0
            },
            {
              "index": 17,
              "id": 12397,
              "name": "Royal crown",
              "quantity": 0
            },
            {
              "index": 18,
              "id": 12439,
              "name": "Royal sceptre",
              "quantity": 0
            },
            {
              "index": 19,
              "id": 12393,
              "name": "Royal gown top",
              "quantity": 0
            },
            {
              "index": 20,
              "id": 12395,
              "name": "Royal gown bottom",
              "quantity": 0
            },
            {
              "index": 21,
              "id": 12351,
              "name": "Musketeer hat",
              "quantity": 0
            },
            {
              "index": 22,
              "id": 12441,
              "name": "Musketeer tabard",
              "quantity": 0
            },
            {
              "index": 23,
              "id": 12443,
              "name": "Musketeer pants",
              "quantity": 0
            },
            {
              "index": 24,
              "id": 19958,
              "name": "Dark tuxedo jacket",
              "quantity": 0
            },
            {
              "index": 25,
              "id": 19964,
              "name": "Dark trousers",
              "quantity": 0
            },
            {
              "index": 26,
              "id": 19967,
              "name": "Dark tuxedo shoes",
              "quantity": 0
            },
            {
              "index": 27,
              "id": 19961,
              "name": "Dark tuxedo cuffs",
              "quantity": 0
            },
            {
              "index": 28,
              "id": 19970,
              "name": "Dark bow tie",
              "quantity": 0
            },
            {
              "index": 29,
              "id": 19973,
              "name": "Light tuxedo jacket",
              "quantity": 0
            },
            {
              "index": 30,
              "id": 19979,
              "name": "Light trousers",
              "quantity": 0
            },
            {
              "index": 31,
              "id": 19982,
              "name": "Light tuxedo shoes",
              "quantity": 0
            },
            {
              "index": 32,
              "id": 19976,
              "name": "Light tuxedo cuffs",
              "quantity": 0
            },
            {
              "index": 33,
              "id": 19985,
              "name": "Light bow tie",
              "quantity": 0
            },
            {
              "index": 34,
              "id": 19943,
              "name": "Arceuus scarf",
              "quantity": 0
            },
            {
              "index": 35,
              "id": 19946,
              "name": "Hosidius scarf",
              "quantity": 0
            },
            {
              "index": 36,
              "id": 19952,
              "name": "Piscarilius scarf",
              "quantity": 1
            },
            {
              "index": 37,
              "id": 19955,
              "name": "Shayzien scarf",
              "quantity": 0
            },
            {
              "index": 38,
              "id": 19949,
              "name": "Lovakengj scarf",
              "quantity": 0
            },
            {
              "index": 39,
              "id": 12363,
              "name": "Bronze dragon mask",
              "quantity": 0
            },
            {
              "index": 40,
              "id": 12365,
              "name": "Iron dragon mask",
              "quantity": 1
            },
            {
              "index": 41,
              "id": 12367,
              "name": "Steel dragon mask",
              "quantity": 0
            },
            {
              "index": 42,
              "id": 12369,
              "name": "Mithril dragon mask",
              "quantity": 0
            },
            {
              "index": 43,
              "id": 23270,
              "name": "Adamant dragon mask",
              "quantity": 0
            },
            {
              "index": 44,
              "id": 23273,
              "name": "Rune dragon mask",
              "quantity": 0
            },
            {
              "index": 45,
              "id": 12357,
              "name": "Katana",
              "quantity": 0
            },
            {
              "index": 46,
              "id": 12373,
              "name": "Dragon cane",
              "quantity": 0
            },
            {
              "index": 47,
              "id": 12335,
              "name": "Briefcase",
              "quantity": 0
            },
            {
              "index": 48,
              "id": 19991,
              "name": "Bucket helm",
              "quantity": 0
            },
            {
              "index": 49,
              "id": 19988,
              "name": "Blacksmith's helm",
              "quantity": 0
            },
            {
              "index": 50,
              "id": 12540,
              "name": "Deerstalker",
              "quantity": 0
            },
            {
              "index": 51,
              "id": 12430,
              "name": "Afro",
              "quantity": 0
            },
            {
              "index": 52,
              "id": 12355,
              "name": "Big pirate hat",
              "quantity": 0
            },
            {
              "index": 53,
              "id": 12432,
              "name": "Top hat",
              "quantity": 0
            },
            {
              "index": 54,
              "id": 12353,
              "name": "Monocle",
              "quantity": 1
            },
            {
              "index": 55,
              "id": 12337,
              "name": "Sagacious spectacles",
              "quantity": 0
            },
            {
              "index": 56,
              "id": 23246,
              "name": "Fremennik kilt",
              "quantity": 0
            },
            {
              "index": 57,
              "id": 23252,
              "name": "Giant boot",
              "quantity": 1
            },
            {
              "index": 58,
              "id": 23255,
              "name": "Uri's hat",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Elite clues completed",
              "count": 32
            }
          ]
        },
        "Master Treasure Trails": {
          "index": 5,
          "items": [
            {
              "index": 0,
              "id": 19730,
              "name": "Bloodhound",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 23185,
              "name": "Ring of 3rd age",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 20068,
              "name": "Armadyl godsword ornament kit",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 20071,
              "name": "Bandos godsword ornament kit",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 20074,
              "name": "Saradomin godsword ornament kit",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 20077,
              "name": "Zamorak godsword ornament kit",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 20065,
              "name": "Occult ornament kit",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 20062,
              "name": "Torture ornament kit",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 22246,
              "name": "Anguish ornament kit",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 20143,
              "name": "Dragon defender ornament kit",
              "quantity": 0
            },
            {
              "index": 10,
              "id": 22239,
              "name": "Dragon kiteshield ornament kit",
              "quantity": 0
            },
            {
              "index": 11,
              "id": 22236,
              "name": "Dragon platebody ornament kit",
              "quantity": 0
            },
            {
              "index": 12,
              "id": 23348,
              "name": "Tormented ornament kit",
              "quantity": 0
            },
            {
              "index": 13,
              "id": 20128,
              "name": "Hood of darkness",
              "quantity": 0
            },
            {
              "index": 14,
              "id": 20131,
              "name": "Robe top of darkness",
              "quantity": 0
            },
            {
              "index": 15,
              "id": 20137,
              "name": "Robe bottom of darkness",
              "quantity": 0
            },
            {
              "index": 16,
              "id": 20134,
              "name": "Gloves of darkness",
              "quantity": 0
            },
            {
              "index": 17,
              "id": 20140,
              "name": "Boots of darkness",
              "quantity": 1
            },
            {
              "index": 18,
              "id": 20035,
              "name": "Samurai kasa",
              "quantity": 0
            },
            {
              "index": 19,
              "id": 20038,
              "name": "Samurai shirt",
              "quantity": 0
            },
            {
              "index": 20,
              "id": 20044,
              "name": "Samurai greaves",
              "quantity": 0
            },
            {
              "index": 21,
              "id": 20047,
              "name": "Samurai boots",
              "quantity": 0
            },
            {
              "index": 22,
              "id": 20041,
              "name": "Samurai gloves",
              "quantity": 0
            },
            {
              "index": 23,
              "id": 20095,
              "name": "Ankou mask",
              "quantity": 0
            },
            {
              "index": 24,
              "id": 20098,
              "name": "Ankou top",
              "quantity": 0
            },
            {
              "index": 25,
              "id": 20101,
              "name": "Ankou gloves",
              "quantity": 0
            },
            {
              "index": 26,
              "id": 20107,
              "name": "Ankou socks",
              "quantity": 0
            },
            {
              "index": 27,
              "id": 20104,
              "name": "Ankou's leggings",
              "quantity": 0
            },
            {
              "index": 28,
              "id": 20080,
              "name": "Mummy's head",
              "quantity": 0
            },
            {
              "index": 29,
              "id": 20092,
              "name": "Mummy's feet",
              "quantity": 0
            },
            {
              "index": 30,
              "id": 20086,
              "name": "Mummy's hands",
              "quantity": 0
            },
            {
              "index": 31,
              "id": 20089,
              "name": "Mummy's legs",
              "quantity": 0
            },
            {
              "index": 32,
              "id": 20083,
              "name": "Mummy's body",
              "quantity": 0
            },
            {
              "index": 33,
              "id": 20125,
              "name": "Shayzien hood",
              "quantity": 0
            },
            {
              "index": 34,
              "id": 20116,
              "name": "Hosidius hood",
              "quantity": 0
            },
            {
              "index": 35,
              "id": 20113,
              "name": "Arceuus hood",
              "quantity": 2
            },
            {
              "index": 36,
              "id": 20122,
              "name": "Piscarilius hood",
              "quantity": 0
            },
            {
              "index": 37,
              "id": 20119,
              "name": "Lovakengj hood",
              "quantity": 0
            },
            {
              "index": 38,
              "id": 20020,
              "name": "Lesser demon mask",
              "quantity": 0
            },
            {
              "index": 39,
              "id": 20023,
              "name": "Greater demon mask",
              "quantity": 0
            },
            {
              "index": 40,
              "id": 20026,
              "name": "Black demon mask",
              "quantity": 0
            },
            {
              "index": 41,
              "id": 20032,
              "name": "Jungle demon mask",
              "quantity": 1
            },
            {
              "index": 42,
              "id": 20029,
              "name": "Old demon mask",
              "quantity": 1
            },
            {
              "index": 43,
              "id": 19724,
              "name": "Left eye patch",
              "quantity": 0
            },
            {
              "index": 44,
              "id": 20110,
              "name": "Bowl wig",
              "quantity": 0
            },
            {
              "index": 45,
              "id": 20056,
              "name": "Ale of the gods",
              "quantity": 0
            },
            {
              "index": 46,
              "id": 20050,
              "name": "Obsidian cape (r)",
              "quantity": 0
            },
            {
              "index": 47,
              "id": 20053,
              "name": "Half moon spectacles",
              "quantity": 0
            },
            {
              "index": 48,
              "id": 20008,
              "name": "Fancy tiara",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Master clues completed",
              "count": 15
            }
          ]
        },
        "Easy Treasure Trails": {
          "index": 1,
          "items": [
            {
              "index": 0,
              "id": 20211,
              "name": "Team cape zero",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 20217,
              "name": "Team cape i",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 20214,
              "name": "Team cape x",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 23351,
              "name": "Cape of skulls",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 20205,
              "name": "Golden chef's hat",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 20208,
              "name": "Golden apron",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 20166,
              "name": "Wooden shield (g)",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 2587,
              "name": "Black full helm (t)",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 2583,
              "name": "Black platebody (t)",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 2585,
              "name": "Black platelegs (t)",
              "quantity": 0
            },
            {
              "index": 10,
              "id": 3472,
              "name": "Black plateskirt (t)",
              "quantity": 0
            },
            {
              "index": 11,
              "id": 2589,
              "name": "Black kiteshield (t)",
              "quantity": 0
            },
            {
              "index": 12,
              "id": 2595,
              "name": "Black full helm (g)",
              "quantity": 0
            },
            {
              "index": 13,
              "id": 2591,
              "name": "Black platebody (g)",
              "quantity": 0
            },
            {
              "index": 14,
              "id": 2593,
              "name": "Black platelegs (g)",
              "quantity": 0
            },
            {
              "index": 15,
              "id": 3473,
              "name": "Black plateskirt (g)",
              "quantity": 0
            },
            {
              "index": 16,
              "id": 2597,
              "name": "Black kiteshield (g)",
              "quantity": 0
            },
            {
              "index": 17,
              "id": 7332,
              "name": "Black shield (h1)",
              "quantity": 0
            },
            {
              "index": 18,
              "id": 7338,
              "name": "Black shield (h2)",
              "quantity": 0
            },
            {
              "index": 19,
              "id": 7344,
              "name": "Black shield (h3)",
              "quantity": 0
            },
            {
              "index": 20,
              "id": 7350,
              "name": "Black shield (h4)",
              "quantity": 0
            },
            {
              "index": 21,
              "id": 7356,
              "name": "Black shield (h5)",
              "quantity": 0
            },
            {
              "index": 22,
              "id": 10306,
              "name": "Black helm (h1)",
              "quantity": 0
            },
            {
              "index": 23,
              "id": 10308,
              "name": "Black helm (h2)",
              "quantity": 0
            },
            {
              "index": 24,
              "id": 10310,
              "name": "Black helm (h3)",
              "quantity": 0
            },
            {
              "index": 25,
              "id": 10312,
              "name": "Black helm (h4)",
              "quantity": 0
            },
            {
              "index": 26,
              "id": 10314,
              "name": "Black helm (h5)",
              "quantity": 0
            },
            {
              "index": 27,
              "id": 23366,
              "name": "Black platebody (h1)",
              "quantity": 0
            },
            {
              "index": 28,
              "id": 23369,
              "name": "Black platebody (h2)",
              "quantity": 0
            },
            {
              "index": 29,
              "id": 23372,
              "name": "Black platebody (h3)",
              "quantity": 0
            },
            {
              "index": 30,
              "id": 23375,
              "name": "Black platebody (h4)",
              "quantity": 0
            },
            {
              "index": 31,
              "id": 23378,
              "name": "Black platebody (h5)",
              "quantity": 0
            },
            {
              "index": 32,
              "id": 20193,
              "name": "Steel full helm (t)",
              "quantity": 0
            },
            {
              "index": 33,
              "id": 20184,
              "name": "Steel platebody (t)",
              "quantity": 0
            },
            {
              "index": 34,
              "id": 20187,
              "name": "Steel platelegs (t)",
              "quantity": 1
            },
            {
              "index": 35,
              "id": 20190,
              "name": "Steel plateskirt (t)",
              "quantity": 0
            },
            {
              "index": 36,
              "id": 20196,
              "name": "Steel kiteshield (t)",
              "quantity": 0
            },
            {
              "index": 37,
              "id": 20178,
              "name": "Steel full helm (g)",
              "quantity": 0
            },
            {
              "index": 38,
              "id": 20169,
              "name": "Steel platebody (g)",
              "quantity": 0
            },
            {
              "index": 39,
              "id": 20172,
              "name": "Steel platelegs (g)",
              "quantity": 0
            },
            {
              "index": 40,
              "id": 20175,
              "name": "Steel plateskirt (g)",
              "quantity": 0
            },
            {
              "index": 41,
              "id": 20181,
              "name": "Steel kiteshield (g)",
              "quantity": 0
            },
            {
              "index": 42,
              "id": 12225,
              "name": "Iron platebody (t)",
              "quantity": 0
            },
            {
              "index": 43,
              "id": 12227,
              "name": "Iron platelegs (t)",
              "quantity": 0
            },
            {
              "index": 44,
              "id": 12229,
              "name": "Iron plateskirt (t)",
              "quantity": 0
            },
            {
              "index": 45,
              "id": 12233,
              "name": "Iron kiteshield (t)",
              "quantity": 0
            },
            {
              "index": 46,
              "id": 12231,
              "name": "Iron full helm (t)",
              "quantity": 0
            },
            {
              "index": 47,
              "id": 12235,
              "name": "Iron platebody (g)",
              "quantity": 0
            },
            {
              "index": 48,
              "id": 12237,
              "name": "Iron platelegs (g)",
              "quantity": 0
            },
            {
              "index": 49,
              "id": 12239,
              "name": "Iron plateskirt (g)",
              "quantity": 0
            },
            {
              "index": 50,
              "id": 12243,
              "name": "Iron kiteshield (g)",
              "quantity": 0
            },
            {
              "index": 51,
              "id": 12241,
              "name": "Iron full helm (g)",
              "quantity": 0
            },
            {
              "index": 52,
              "id": 12215,
              "name": "Bronze platebody (t)",
              "quantity": 0
            },
            {
              "index": 53,
              "id": 12217,
              "name": "Bronze platelegs (t)",
              "quantity": 0
            },
            {
              "index": 54,
              "id": 12219,
              "name": "Bronze plateskirt (t)",
              "quantity": 0
            },
            {
              "index": 55,
              "id": 12223,
              "name": "Bronze kiteshield (t)",
              "quantity": 0
            },
            {
              "index": 56,
              "id": 12221,
              "name": "Bronze full helm (t)",
              "quantity": 0
            },
            {
              "index": 57,
              "id": 12205,
              "name": "Bronze platebody (g)",
              "quantity": 0
            },
            {
              "index": 58,
              "id": 12207,
              "name": "Bronze platelegs (g)",
              "quantity": 0
            },
            {
              "index": 59,
              "id": 12209,
              "name": "Bronze plateskirt (g)",
              "quantity": 0
            },
            {
              "index": 60,
              "id": 12213,
              "name": "Bronze kiteshield (g)",
              "quantity": 0
            },
            {
              "index": 61,
              "id": 12211,
              "name": "Bronze full helm (g)",
              "quantity": 0
            },
            {
              "index": 62,
              "id": 7362,
              "name": "Studded body (g)",
              "quantity": 0
            },
            {
              "index": 63,
              "id": 7366,
              "name": "Studded chaps (g)",
              "quantity": 0
            },
            {
              "index": 64,
              "id": 7364,
              "name": "Studded body (t)",
              "quantity": 0
            },
            {
              "index": 65,
              "id": 7368,
              "name": "Studded chaps (t)",
              "quantity": 0
            },
            {
              "index": 66,
              "id": 23381,
              "name": "Leather body (g)",
              "quantity": 0
            },
            {
              "index": 67,
              "id": 23384,
              "name": "Leather chaps (g)",
              "quantity": 0
            },
            {
              "index": 68,
              "id": 7394,
              "name": "Blue wizard hat (g)",
              "quantity": 0
            },
            {
              "index": 69,
              "id": 7390,
              "name": "Blue wizard robe (g)",
              "quantity": 0
            },
            {
              "index": 70,
              "id": 7386,
              "name": "Blue skirt (g)",
              "quantity": 0
            },
            {
              "index": 71,
              "id": 7396,
              "name": "Blue wizard hat (t)",
              "quantity": 0
            },
            {
              "index": 72,
              "id": 7392,
              "name": "Blue wizard robe (t)",
              "quantity": 0
            },
            {
              "index": 73,
              "id": 7388,
              "name": "Blue skirt (t)",
              "quantity": 0
            },
            {
              "index": 74,
              "id": 12453,
              "name": "Black wizard hat (g)",
              "quantity": 0
            },
            {
              "index": 75,
              "id": 12449,
              "name": "Black wizard robe (g)",
              "quantity": 1
            },
            {
              "index": 76,
              "id": 12445,
              "name": "Black skirt (g)",
              "quantity": 1
            },
            {
              "index": 77,
              "id": 12455,
              "name": "Black wizard hat (t)",
              "quantity": 0
            },
            {
              "index": 78,
              "id": 12451,
              "name": "Black wizard robe (t)",
              "quantity": 0
            },
            {
              "index": 79,
              "id": 12447,
              "name": "Black skirt (t)",
              "quantity": 0
            },
            {
              "index": 80,
              "id": 20199,
              "name": "Monk's robe top (g)",
              "quantity": 0
            },
            {
              "index": 81,
              "id": 20202,
              "name": "Monk's robe (g)",
              "quantity": 0
            },
            {
              "index": 82,
              "id": 10458,
              "name": "Saradomin robe top",
              "quantity": 0
            },
            {
              "index": 83,
              "id": 10464,
              "name": "Saradomin robe legs",
              "quantity": 0
            },
            {
              "index": 84,
              "id": 10462,
              "name": "Guthix robe top",
              "quantity": 2
            },
            {
              "index": 85,
              "id": 10466,
              "name": "Guthix robe legs",
              "quantity": 0
            },
            {
              "index": 86,
              "id": 10460,
              "name": "Zamorak robe top",
              "quantity": 0
            },
            {
              "index": 87,
              "id": 10468,
              "name": "Zamorak robe legs",
              "quantity": 0
            },
            {
              "index": 88,
              "id": 12193,
              "name": "Ancient robe top",
              "quantity": 0
            },
            {
              "index": 89,
              "id": 12195,
              "name": "Ancient robe legs",
              "quantity": 0
            },
            {
              "index": 90,
              "id": 12253,
              "name": "Armadyl robe top",
              "quantity": 0
            },
            {
              "index": 91,
              "id": 12255,
              "name": "Armadyl robe legs",
              "quantity": 0
            },
            {
              "index": 92,
              "id": 12265,
              "name": "Bandos robe top",
              "quantity": 0
            },
            {
              "index": 93,
              "id": 12267,
              "name": "Bandos robe legs",
              "quantity": 0
            },
            {
              "index": 94,
              "id": 10316,
              "name": "Bob's red shirt",
              "quantity": 0
            },
            {
              "index": 95,
              "id": 10320,
              "name": "Bob's green shirt",
              "quantity": 0
            },
            {
              "index": 96,
              "id": 10318,
              "name": "Bob's blue shirt",
              "quantity": 0
            },
            {
              "index": 97,
              "id": 10322,
              "name": "Bob's black shirt",
              "quantity": 0
            },
            {
              "index": 98,
              "id": 10324,
              "name": "Bob's purple shirt",
              "quantity": 0
            },
            {
              "index": 99,
              "id": 2631,
              "name": "Highwayman mask",
              "quantity": 0
            },
            {
              "index": 100,
              "id": 2633,
              "name": "Blue beret",
              "quantity": 0
            },
            {
              "index": 101,
              "id": 2635,
              "name": "Black beret",
              "quantity": 0
            },
            {
              "index": 102,
              "id": 2637,
              "name": "White beret",
              "quantity": 0
            },
            {
              "index": 103,
              "id": 12247,
              "name": "Red beret",
              "quantity": 0
            },
            {
              "index": 104,
              "id": 10392,
              "name": "A powdered wig",
              "quantity": 0
            },
            {
              "index": 105,
              "id": 12245,
              "name": "Beanie",
              "quantity": 0
            },
            {
              "index": 106,
              "id": 12249,
              "name": "Imp mask",
              "quantity": 0
            },
            {
              "index": 107,
              "id": 12251,
              "name": "Goblin mask",
              "quantity": 0
            },
            {
              "index": 108,
              "id": 10398,
              "name": "Sleeping cap",
              "quantity": 0
            },
            {
              "index": 109,
              "id": 10394,
              "name": "Flared trousers",
              "quantity": 0
            },
            {
              "index": 110,
              "id": 10396,
              "name": "Pantaloons",
              "quantity": 0
            },
            {
              "index": 111,
              "id": 12375,
              "name": "Black cane",
              "quantity": 0
            },
            {
              "index": 112,
              "id": 23363,
              "name": "Staff of bob the cat",
              "quantity": 0
            },
            {
              "index": 113,
              "id": 10404,
              "name": "Red elegant shirt",
              "quantity": 0
            },
            {
              "index": 114,
              "id": 10424,
              "name": "Red elegant blouse",
              "quantity": 0
            },
            {
              "index": 115,
              "id": 10406,
              "name": "Red elegant legs",
              "quantity": 0
            },
            {
              "index": 116,
              "id": 10426,
              "name": "Red elegant skirt",
              "quantity": 0
            },
            {
              "index": 117,
              "id": 10412,
              "name": "Green elegant shirt",
              "quantity": 0
            },
            {
              "index": 118,
              "id": 10432,
              "name": "Green elegant blouse",
              "quantity": 0
            },
            {
              "index": 119,
              "id": 10414,
              "name": "Green elegant legs",
              "quantity": 0
            },
            {
              "index": 120,
              "id": 10434,
              "name": "Green elegant skirt",
              "quantity": 0
            },
            {
              "index": 121,
              "id": 10408,
              "name": "Blue elegant shirt",
              "quantity": 0
            },
            {
              "index": 122,
              "id": 10428,
              "name": "Blue elegant blouse",
              "quantity": 0
            },
            {
              "index": 123,
              "id": 10410,
              "name": "Blue elegant legs",
              "quantity": 0
            },
            {
              "index": 124,
              "id": 10430,
              "name": "Blue elegant skirt",
              "quantity": 0
            },
            {
              "index": 125,
              "id": 10366,
              "name": "Amulet of magic (t)",
              "quantity": 0
            },
            {
              "index": 126,
              "id": 23354,
              "name": "Amulet of power (t)",
              "quantity": 0
            },
            {
              "index": 127,
              "id": 12297,
              "name": "Black pickaxe",
              "quantity": 2
            },
            {
              "index": 128,
              "id": 23360,
              "name": "Ham joint",
              "quantity": 0
            },
            {
              "index": 129,
              "id": 23357,
              "name": "Rain bow",
              "quantity": 0
            },
            {
              "index": 130,
              "id": 10280,
              "name": "Willow comp bow",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Easy clues completed",
              "count": 13
            }
          ]
        },
        "Hard Treasure Trails (Rare)": {
          "index": 6,
          "items": [
            {
              "index": 0,
              "id": 10334,
              "name": "3rd age range coif",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 10330,
              "name": "3rd age range top",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 10332,
              "name": "3rd age range legs",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 10336,
              "name": "3rd age vambraces",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 10338,
              "name": "3rd age robe top",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 10340,
              "name": "3rd age robe",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 10342,
              "name": "3rd age mage hat",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 10344,
              "name": "3rd age amulet",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 23242,
              "name": "3rd age plateskirt",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 10346,
              "name": "3rd age platelegs",
              "quantity": 0
            },
            {
              "index": 10,
              "id": 10348,
              "name": "3rd age platebody",
              "quantity": 0
            },
            {
              "index": 11,
              "id": 10350,
              "name": "3rd age full helmet",
              "quantity": 0
            },
            {
              "index": 12,
              "id": 10352,
              "name": "3rd age kiteshield",
              "quantity": 0
            },
            {
              "index": 13,
              "id": 3481,
              "name": "Gilded platebody",
              "quantity": 0
            },
            {
              "index": 14,
              "id": 3483,
              "name": "Gilded platelegs",
              "quantity": 0
            },
            {
              "index": 15,
              "id": 3485,
              "name": "Gilded plateskirt",
              "quantity": 0
            },
            {
              "index": 16,
              "id": 3486,
              "name": "Gilded full helm",
              "quantity": 0
            },
            {
              "index": 17,
              "id": 3488,
              "name": "Gilded kiteshield",
              "quantity": 0
            },
            {
              "index": 18,
              "id": 20146,
              "name": "Gilded med helm",
              "quantity": 0
            },
            {
              "index": 19,
              "id": 20149,
              "name": "Gilded chainbody",
              "quantity": 0
            },
            {
              "index": 20,
              "id": 20152,
              "name": "Gilded sq shield",
              "quantity": 0
            },
            {
              "index": 21,
              "id": 20155,
              "name": "Gilded 2h sword",
              "quantity": 0
            },
            {
              "index": 22,
              "id": 20158,
              "name": "Gilded spear",
              "quantity": 0
            },
            {
              "index": 23,
              "id": 20161,
              "name": "Gilded hasta",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Hard clues completed",
              "count": 142
            }
          ]
        },
        "Elite Treasure Trails (Rare)": {
          "index": 7,
          "items": [
            {
              "index": 0,
              "id": 12426,
              "name": "3rd age longsword",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 12422,
              "name": "3rd age wand",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 12437,
              "name": "3rd age cloak",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 12424,
              "name": "3rd age bow",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 10334,
              "name": "3rd age range coif",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 10330,
              "name": "3rd age range top",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 10332,
              "name": "3rd age range legs",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 10336,
              "name": "3rd age vambraces",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 10338,
              "name": "3rd age robe top",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 10340,
              "name": "3rd age robe",
              "quantity": 0
            },
            {
              "index": 10,
              "id": 10342,
              "name": "3rd age mage hat",
              "quantity": 0
            },
            {
              "index": 11,
              "id": 10344,
              "name": "3rd age amulet",
              "quantity": 0
            },
            {
              "index": 12,
              "id": 23242,
              "name": "3rd age plateskirt",
              "quantity": 0
            },
            {
              "index": 13,
              "id": 10346,
              "name": "3rd age platelegs",
              "quantity": 0
            },
            {
              "index": 14,
              "id": 10348,
              "name": "3rd age platebody",
              "quantity": 0
            },
            {
              "index": 15,
              "id": 10350,
              "name": "3rd age full helmet",
              "quantity": 0
            },
            {
              "index": 16,
              "id": 10352,
              "name": "3rd age kiteshield",
              "quantity": 0
            },
            {
              "index": 17,
              "id": 12389,
              "name": "Gilded scimitar",
              "quantity": 0
            },
            {
              "index": 18,
              "id": 12391,
              "name": "Gilded boots",
              "quantity": 0
            },
            {
              "index": 19,
              "id": 3481,
              "name": "Gilded platebody",
              "quantity": 0
            },
            {
              "index": 20,
              "id": 3483,
              "name": "Gilded platelegs",
              "quantity": 0
            },
            {
              "index": 21,
              "id": 3485,
              "name": "Gilded plateskirt",
              "quantity": 0
            },
            {
              "index": 22,
              "id": 3486,
              "name": "Gilded full helm",
              "quantity": 0
            },
            {
              "index": 23,
              "id": 3488,
              "name": "Gilded kiteshield",
              "quantity": 0
            },
            {
              "index": 24,
              "id": 20146,
              "name": "Gilded med helm",
              "quantity": 0
            },
            {
              "index": 25,
              "id": 20149,
              "name": "Gilded chainbody",
              "quantity": 0
            },
            {
              "index": 26,
              "id": 20152,
              "name": "Gilded sq shield",
              "quantity": 0
            },
            {
              "index": 27,
              "id": 20155,
              "name": "Gilded 2h sword",
              "quantity": 0
            },
            {
              "index": 28,
              "id": 20158,
              "name": "Gilded spear",
              "quantity": 0
            },
            {
              "index": 29,
              "id": 20161,
              "name": "Gilded hasta",
              "quantity": 0
            },
            {
              "index": 30,
              "id": 23258,
              "name": "Gilded coif",
              "quantity": 0
            },
            {
              "index": 31,
              "id": 23261,
              "name": "Gilded d'hide vambraces",
              "quantity": 0
            },
            {
              "index": 32,
              "id": 23264,
              "name": "Gilded d'hide body",
              "quantity": 0
            },
            {
              "index": 33,
              "id": 23267,
              "name": "Gilded d'hide chaps",
              "quantity": 0
            },
            {
              "index": 34,
              "id": 23276,
              "name": "Gilded pickaxe",
              "quantity": 0
            },
            {
              "index": 35,
              "id": 23279,
              "name": "Gilded axe",
              "quantity": 0
            },
            {
              "index": 36,
              "id": 23282,
              "name": "Gilded spade",
              "quantity": 0
            },
            {
              "index": 37,
              "id": 20005,
              "name": "Ring of nature",
              "quantity": 0
            },
            {
              "index": 38,
              "id": 12371,
              "name": "Lava dragon mask",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Elite clues completed",
              "count": 32
            }
          ]
        }
      },
      "Raids": {
        "Tombs of Amascut": {
          "index": 2,
          "items": [
            {
              "index": 0,
              "id": 27352,
              "name": "Tumeken's guardian",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 27277,
              "name": "Tumeken's shadow (uncharged)",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 25985,
              "name": "Elidinis' ward",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 27226,
              "name": "Masori mask",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 27229,
              "name": "Masori body",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 27232,
              "name": "Masori chaps",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 25975,
              "name": "Lightbearer",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 26219,
              "name": "Osmumten's fang",
              "quantity": 1
            },
            {
              "index": 8,
              "id": 27279,
              "name": "Thread of elidinis",
              "quantity": 1
            },
            {
              "index": 9,
              "id": 27283,
              "name": "Breach of the scarab",
              "quantity": 0
            },
            {
              "index": 10,
              "id": 27285,
              "name": "Eye of the corruptor",
              "quantity": 0
            },
            {
              "index": 11,
              "id": 27289,
              "name": "Jewel of the sun",
              "quantity": 0
            },
            {
              "index": 12,
              "id": 27255,
              "name": "Menaphite ornament kit",
              "quantity": 0
            },
            {
              "index": 13,
              "id": 27248,
              "name": "Cursed phalanx",
              "quantity": 0
            },
            {
              "index": 14,
              "id": 27372,
              "name": "Masori crafting kit",
              "quantity": 0
            },
            {
              "index": 15,
              "id": 27293,
              "name": "Cache of runes",
              "quantity": 3
            },
            {
              "index": 16,
              "id": 27257,
              "name": "Icthlarin's shroud (tier 1)",
              "quantity": 0
            },
            {
              "index": 17,
              "id": 27259,
              "name": "Icthlarin's shroud (tier 2)",
              "quantity": 0
            },
            {
              "index": 18,
              "id": 27261,
              "name": "Icthlarin's shroud (tier 3)",
              "quantity": 0
            },
            {
              "index": 19,
              "id": 27263,
              "name": "Icthlarin's shroud (tier 4)",
              "quantity": 0
            },
            {
              "index": 20,
              "id": 27265,
              "name": "Icthlarin's shroud (tier 5)",
              "quantity": 0
            },
            {
              "index": 21,
              "id": 27377,
              "name": "Remnant of akkha",
              "quantity": 0
            },
            {
              "index": 22,
              "id": 27378,
              "name": "Remnant of ba-ba",
              "quantity": 0
            },
            {
              "index": 23,
              "id": 27379,
              "name": "Remnant of kephri",
              "quantity": 0
            },
            {
              "index": 24,
              "id": 27380,
              "name": "Remnant of zebak",
              "quantity": 0
            },
            {
              "index": 25,
              "id": 27381,
              "name": "Ancient remnant",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Tombs of Amascut completions",
              "count": 28
            },
            {
              "index": 1,
              "name": "Tombs of Amascut (Entry) completions",
              "count": 1
            },
            {
              "index": 2,
              "name": "Tombs of Amascut (Expert) completions",
              "count": 0
            }
          ]
        },
        "Theatre of Blood": {
          "index": 1,
          "items": [
            {
              "index": 0,
              "id": 22473,
              "name": "Lil' zik",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 22486,
              "name": "Scythe of vitur (uncharged)",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 22324,
              "name": "Ghrazi rapier",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 22481,
              "name": "Sanguinesti staff (uncharged)",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 22326,
              "name": "Justiciar faceguard",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 22327,
              "name": "Justiciar chestguard",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 22328,
              "name": "Justiciar legguards",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 22477,
              "name": "Avernic defender hilt",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 22446,
              "name": "Vial of blood",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 22494,
              "name": "Sinhaza shroud tier 1",
              "quantity": 0
            },
            {
              "index": 10,
              "id": 22496,
              "name": "Sinhaza shroud tier 2",
              "quantity": 0
            },
            {
              "index": 11,
              "id": 22498,
              "name": "Sinhaza shroud tier 3",
              "quantity": 0
            },
            {
              "index": 12,
              "id": 22500,
              "name": "Sinhaza shroud tier 4",
              "quantity": 0
            },
            {
              "index": 13,
              "id": 22502,
              "name": "Sinhaza shroud tier 5",
              "quantity": 0
            },
            {
              "index": 14,
              "id": 25746,
              "name": "Sanguine dust",
              "quantity": 0
            },
            {
              "index": 15,
              "id": 25742,
              "name": "Holy ornament kit",
              "quantity": 0
            },
            {
              "index": 16,
              "id": 25744,
              "name": "Sanguine ornament kit",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Theatre of Blood completions",
              "count": 0
            },
            {
              "index": 1,
              "name": "Theatre of Blood (Entry) completions",
              "count": 1
            },
            {
              "index": 2,
              "name": "Theatre of Blood (Hard) completions",
              "count": 0
            }
          ]
        },
        "Chambers of Xeric": {
          "index": 0,
          "items": [
            {
              "index": 0,
              "id": 20851,
              "name": "Olmlet",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 22386,
              "name": "Metamorphic dust",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 20997,
              "name": "Twisted bow",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 21003,
              "name": "Elder maul",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 21043,
              "name": "Kodai insignia",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 13652,
              "name": "Dragon claws",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 21018,
              "name": "Ancestral hat",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 21021,
              "name": "Ancestral robe top",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 21024,
              "name": "Ancestral robe bottom",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 21015,
              "name": "Dinh's bulwark",
              "quantity": 0
            },
            {
              "index": 10,
              "id": 21034,
              "name": "Dexterous prayer scroll",
              "quantity": 0
            },
            {
              "index": 11,
              "id": 21079,
              "name": "Arcane prayer scroll",
              "quantity": 0
            },
            {
              "index": 12,
              "id": 21012,
              "name": "Dragon hunter crossbow",
              "quantity": 0
            },
            {
              "index": 13,
              "id": 21000,
              "name": "Twisted buckler",
              "quantity": 0
            },
            {
              "index": 14,
              "id": 21047,
              "name": "Torn prayer scroll",
              "quantity": 0
            },
            {
              "index": 15,
              "id": 21027,
              "name": "Dark relic",
              "quantity": 0
            },
            {
              "index": 16,
              "id": 6573,
              "name": "Onyx",
              "quantity": 0
            },
            {
              "index": 17,
              "id": 24670,
              "name": "Twisted ancestral colour kit",
              "quantity": 0
            },
            {
              "index": 18,
              "id": 22388,
              "name": "Xeric's guard",
              "quantity": 0
            },
            {
              "index": 19,
              "id": 22390,
              "name": "Xeric's warrior",
              "quantity": 0
            },
            {
              "index": 20,
              "id": 22392,
              "name": "Xeric's sentinel",
              "quantity": 0
            },
            {
              "index": 21,
              "id": 22394,
              "name": "Xeric's general",
              "quantity": 0
            },
            {
              "index": 22,
              "id": 22396,
              "name": "Xeric's champion",
              "quantity": 0
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Chambers of Xeric completions",
              "count": 6
            },
            {
              "index": 1,
              "name": "Chambers of Xeric (CM) completions",
              "count": 0
            }
          ]
        }
      },
      "Other": {
        "Miscellaneous": {
          "index": 22,
          "items": [
            {
              "index": 0,
              "id": 21509,
              "name": "Herbi",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 13071,
              "name": "Chompy chick",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 13576,
              "name": "Dragon warhammer",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 7991,
              "name": "Big swordfish",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 7993,
              "name": "Big shark",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 7989,
              "name": "Big bass",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 10976,
              "name": "Long bone",
              "quantity": 29
            },
            {
              "index": 7,
              "id": 10977,
              "name": "Curved bone",
              "quantity": 3
            },
            {
              "index": 8,
              "id": 11942,
              "name": "Ecumenical key",
              "quantity": 4
            },
            {
              "index": 9,
              "id": 26945,
              "name": "Pharaoh's sceptre (uncharged)",
              "quantity": 2
            },
            {
              "index": 10,
              "id": 19679,
              "name": "Dark totem base",
              "quantity": 47
            },
            {
              "index": 11,
              "id": 19681,
              "name": "Dark totem middle",
              "quantity": 46
            },
            {
              "index": 12,
              "id": 19683,
              "name": "Dark totem top",
              "quantity": 46
            },
            {
              "index": 13,
              "id": 11338,
              "name": "Chewed bones",
              "quantity": 1
            },
            {
              "index": 14,
              "id": 11335,
              "name": "Dragon full helm",
              "quantity": 0
            },
            {
              "index": 15,
              "id": 2366,
              "name": "Shield left half",
              "quantity": 3
            },
            {
              "index": 16,
              "id": 22100,
              "name": "Dragon metal slice",
              "quantity": 0
            },
            {
              "index": 17,
              "id": 22103,
              "name": "Dragon metal lump",
              "quantity": 0
            },
            {
              "index": 18,
              "id": 21918,
              "name": "Dragon limbs",
              "quantity": 0
            },
            {
              "index": 19,
              "id": 1249,
              "name": "Dragon spear",
              "quantity": 5
            },
            {
              "index": 20,
              "id": 19707,
              "name": "Amulet of eternal glory",
              "quantity": 0
            },
            {
              "index": 21,
              "id": 21838,
              "name": "Shaman mask",
              "quantity": 0
            },
            {
              "index": 22,
              "id": 20439,
              "name": "Evil chicken head",
              "quantity": 0
            },
            {
              "index": 23,
              "id": 20436,
              "name": "Evil chicken wings",
              "quantity": 0
            },
            {
              "index": 24,
              "id": 20442,
              "name": "Evil chicken legs",
              "quantity": 0
            },
            {
              "index": 25,
              "id": 20433,
              "name": "Evil chicken feet",
              "quantity": 0
            },
            {
              "index": 26,
              "id": 21343,
              "name": "Mining gloves",
              "quantity": 1
            },
            {
              "index": 27,
              "id": 21345,
              "name": "Superior mining gloves",
              "quantity": 1
            },
            {
              "index": 28,
              "id": 21392,
              "name": "Expert mining gloves",
              "quantity": 1
            },
            {
              "index": 29,
              "id": 9007,
              "name": "Right skull half",
              "quantity": 13
            },
            {
              "index": 30,
              "id": 9008,
              "name": "Left skull half",
              "quantity": 2
            },
            {
              "index": 31,
              "id": 9010,
              "name": "Top of sceptre",
              "quantity": 2
            },
            {
              "index": 32,
              "id": 9011,
              "name": "Bottom of sceptre",
              "quantity": 4
            },
            {
              "index": 33,
              "id": 22374,
              "name": "Mossy key",
              "quantity": 6
            },
            {
              "index": 34,
              "id": 20754,
              "name": "Giant key",
              "quantity": 6
            },
            {
              "index": 35,
              "id": 22875,
              "name": "Hespori seed",
              "quantity": 221
            },
            {
              "index": 36,
              "id": 7536,
              "name": "Fresh crab claw",
              "quantity": 0
            },
            {
              "index": 37,
              "id": 7538,
              "name": "Fresh crab shell",
              "quantity": 0
            },
            {
              "index": 38,
              "id": 13392,
              "name": "Xeric's talisman (inert)",
              "quantity": 6
            },
            {
              "index": 39,
              "id": 23522,
              "name": "Mask of ranul",
              "quantity": 1
            },
            {
              "index": 40,
              "id": 23943,
              "name": "Elven signet",
              "quantity": 1
            },
            {
              "index": 41,
              "id": 24000,
              "name": "Crystal grail",
              "quantity": 1
            },
            {
              "index": 42,
              "id": 23959,
              "name": "Enhanced crystal teleport seed",
              "quantity": 12
            },
            {
              "index": 43,
              "id": 24034,
              "name": "Dragonstone full helm",
              "quantity": 0
            },
            {
              "index": 44,
              "id": 24037,
              "name": "Dragonstone platebody",
              "quantity": 0
            },
            {
              "index": 45,
              "id": 24040,
              "name": "Dragonstone platelegs",
              "quantity": 0
            },
            {
              "index": 46,
              "id": 24046,
              "name": "Dragonstone gauntlets",
              "quantity": 0
            },
            {
              "index": 47,
              "id": 24043,
              "name": "Dragonstone boots",
              "quantity": 0
            },
            {
              "index": 48,
              "id": 6571,
              "name": "Uncut onyx",
              "quantity": 1
            },
            {
              "index": 49,
              "id": 21649,
              "name": "Merfolk trident",
              "quantity": 0
            },
            {
              "index": 50,
              "id": 25844,
              "name": "Orange egg sac",
              "quantity": 0
            },
            {
              "index": 51,
              "id": 25846,
              "name": "Blue egg sac",
              "quantity": 0
            }
          ]
        },
        "Aerial Fishing": {
          "index": 0,
          "items": [
            {
              "index": 0,
              "id": 22840,
              "name": "Golden tench",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 22846,
              "name": "Pearl fishing rod",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 22844,
              "name": "Pearl fly fishing rod",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 22842,
              "name": "Pearl barbarian rod",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 22838,
              "name": "Fish sack",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 13258,
              "name": "Angler hat",
              "quantity": 1
            },
            {
              "index": 6,
              "id": 13259,
              "name": "Angler top",
              "quantity": 1
            },
            {
              "index": 7,
              "id": 13260,
              "name": "Angler waders",
              "quantity": 1
            },
            {
              "index": 8,
              "id": 13261,
              "name": "Angler boots",
              "quantity": 1
            }
          ]
        },
        "Random Events": {
          "index": 14,
          "items": [
            {
              "index": 0,
              "id": 6654,
              "name": "Camo top",
              "quantity": 1
            },
            {
              "index": 1,
              "id": 6655,
              "name": "Camo bottoms",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 6656,
              "name": "Camo helmet",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 6180,
              "name": "Lederhosen top",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 6181,
              "name": "Lederhosen shorts",
              "quantity": 1
            },
            {
              "index": 5,
              "id": 6182,
              "name": "Lederhosen hat",
              "quantity": 1
            },
            {
              "index": 6,
              "id": 7592,
              "name": "Zombie shirt",
              "quantity": 1
            },
            {
              "index": 7,
              "id": 7593,
              "name": "Zombie trousers",
              "quantity": 1
            },
            {
              "index": 8,
              "id": 7594,
              "name": "Zombie mask",
              "quantity": 1
            },
            {
              "index": 9,
              "id": 7595,
              "name": "Zombie gloves",
              "quantity": 1
            },
            {
              "index": 10,
              "id": 7596,
              "name": "Zombie boots",
              "quantity": 1
            },
            {
              "index": 11,
              "id": 3057,
              "name": "Mime mask",
              "quantity": 0
            },
            {
              "index": 12,
              "id": 3058,
              "name": "Mime top",
              "quantity": 0
            },
            {
              "index": 13,
              "id": 3059,
              "name": "Mime legs",
              "quantity": 0
            },
            {
              "index": 14,
              "id": 3060,
              "name": "Mime gloves",
              "quantity": 0
            },
            {
              "index": 15,
              "id": 3061,
              "name": "Mime boots",
              "quantity": 0
            },
            {
              "index": 16,
              "id": 6183,
              "name": "Frog token",
              "quantity": 3
            },
            {
              "index": 17,
              "id": 20590,
              "name": "Stale baguette",
              "quantity": 0
            },
            {
              "index": 18,
              "id": 25129,
              "name": "Beekeeper's hat",
              "quantity": 1
            },
            {
              "index": 19,
              "id": 25131,
              "name": "Beekeeper's top",
              "quantity": 1
            },
            {
              "index": 20,
              "id": 25133,
              "name": "Beekeeper's legs",
              "quantity": 1
            },
            {
              "index": 21,
              "id": 25135,
              "name": "Beekeeper's gloves",
              "quantity": 1
            },
            {
              "index": 22,
              "id": 25137,
              "name": "Beekeeper's boots",
              "quantity": 1
            }
          ]
        },
        "Slayer": {
          "index": 20,
          "items": [
            {
              "index": 0,
              "id": 7975,
              "name": "Crawling hand",
              "quantity": 6
            },
            {
              "index": 1,
              "id": 7976,
              "name": "Cockatrice head",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 7977,
              "name": "Basilisk head",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 7978,
              "name": "Kurask head",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 7979,
              "name": "Abyssal head",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 20724,
              "name": "Imbued heart",
              "quantity": 1
            },
            {
              "index": 6,
              "id": 21270,
              "name": "Eternal gem",
              "quantity": 1
            },
            {
              "index": 7,
              "id": 20736,
              "name": "Dust battlestaff",
              "quantity": 4
            },
            {
              "index": 8,
              "id": 20730,
              "name": "Mist battlestaff",
              "quantity": 2
            },
            {
              "index": 9,
              "id": 4151,
              "name": "Abyssal whip",
              "quantity": 11
            },
            {
              "index": 10,
              "id": 4153,
              "name": "Granite maul",
              "quantity": 11
            },
            {
              "index": 11,
              "id": 6665,
              "name": "Mudskipper hat",
              "quantity": 9
            },
            {
              "index": 12,
              "id": 6666,
              "name": "Flippers",
              "quantity": 1
            },
            {
              "index": 13,
              "id": 11037,
              "name": "Brine sabre",
              "quantity": 0
            },
            {
              "index": 14,
              "id": 11902,
              "name": "Leaf-bladed sword",
              "quantity": 3
            },
            {
              "index": 15,
              "id": 20727,
              "name": "Leaf-bladed battleaxe",
              "quantity": 1
            },
            {
              "index": 16,
              "id": 8901,
              "name": "Black mask (10)",
              "quantity": 1
            },
            {
              "index": 17,
              "id": 21646,
              "name": "Granite longsword",
              "quantity": 1
            },
            {
              "index": 18,
              "id": 21643,
              "name": "Granite boots",
              "quantity": 0
            },
            {
              "index": 19,
              "id": 21637,
              "name": "Wyvern visage",
              "quantity": 0
            },
            {
              "index": 20,
              "id": 6809,
              "name": "Granite legs",
              "quantity": 2
            },
            {
              "index": 21,
              "id": 10589,
              "name": "Granite helm",
              "quantity": 0
            },
            {
              "index": 22,
              "id": 11286,
              "name": "Draconic visage",
              "quantity": 0
            },
            {
              "index": 23,
              "id": 4119,
              "name": "Bronze boots",
              "quantity": 8
            },
            {
              "index": 24,
              "id": 4121,
              "name": "Iron boots",
              "quantity": 4
            },
            {
              "index": 25,
              "id": 4123,
              "name": "Steel boots",
              "quantity": 0
            },
            {
              "index": 26,
              "id": 4125,
              "name": "Black boots",
              "quantity": 26
            },
            {
              "index": 27,
              "id": 4127,
              "name": "Mithril boots",
              "quantity": 1
            },
            {
              "index": 28,
              "id": 4129,
              "name": "Adamant boots",
              "quantity": 25
            },
            {
              "index": 29,
              "id": 4131,
              "name": "Rune boots",
              "quantity": 60
            },
            {
              "index": 30,
              "id": 11840,
              "name": "Dragon boots",
              "quantity": 2
            },
            {
              "index": 31,
              "id": 13265,
              "name": "Abyssal dagger",
              "quantity": 0
            },
            {
              "index": 32,
              "id": 11908,
              "name": "Uncharged trident",
              "quantity": 3
            },
            {
              "index": 33,
              "id": 12004,
              "name": "Kraken tentacle",
              "quantity": 2
            },
            {
              "index": 34,
              "id": 11235,
              "name": "Dark bow",
              "quantity": 0
            },
            {
              "index": 35,
              "id": 12002,
              "name": "Occult necklace",
              "quantity": 2
            },
            {
              "index": 36,
              "id": 3140,
              "name": "Dragon chainbody",
              "quantity": 1
            },
            {
              "index": 37,
              "id": 20849,
              "name": "Dragon thrownaxe",
              "quantity": 122
            },
            {
              "index": 38,
              "id": 21028,
              "name": "Dragon harpoon",
              "quantity": 1
            },
            {
              "index": 39,
              "id": 21009,
              "name": "Dragon sword",
              "quantity": 1
            },
            {
              "index": 40,
              "id": 22804,
              "name": "Dragon knife",
              "quantity": 150
            },
            {
              "index": 41,
              "id": 22963,
              "name": "Broken dragon hasta",
              "quantity": 1
            },
            {
              "index": 42,
              "id": 22960,
              "name": "Drake's tooth",
              "quantity": 1
            },
            {
              "index": 43,
              "id": 22957,
              "name": "Drake's claw",
              "quantity": 4
            },
            {
              "index": 44,
              "id": 22988,
              "name": "Hydra tail",
              "quantity": 1
            },
            {
              "index": 45,
              "id": 22971,
              "name": "Hydra's fang",
              "quantity": 1
            },
            {
              "index": 46,
              "id": 22973,
              "name": "Hydra's eye",
              "quantity": 1
            },
            {
              "index": 47,
              "id": 22969,
              "name": "Hydra's heart",
              "quantity": 1
            },
            {
              "index": 48,
              "id": 4109,
              "name": "Mystic hat (light)",
              "quantity": 0
            },
            {
              "index": 49,
              "id": 4111,
              "name": "Mystic robe top (light)",
              "quantity": 29
            },
            {
              "index": 50,
              "id": 4113,
              "name": "Mystic robe bottom (light)",
              "quantity": 28
            },
            {
              "index": 51,
              "id": 4115,
              "name": "Mystic gloves (light)",
              "quantity": 6
            },
            {
              "index": 52,
              "id": 4117,
              "name": "Mystic boots (light)",
              "quantity": 0
            },
            {
              "index": 53,
              "id": 4099,
              "name": "Mystic hat (dark)",
              "quantity": 0
            },
            {
              "index": 54,
              "id": 4101,
              "name": "Mystic robe top (dark)",
              "quantity": 8
            },
            {
              "index": 55,
              "id": 4103,
              "name": "Mystic robe bottom (dark)",
              "quantity": 3
            },
            {
              "index": 56,
              "id": 4105,
              "name": "Mystic gloves (dark)",
              "quantity": 2
            },
            {
              "index": 57,
              "id": 4107,
              "name": "Mystic boots (dark)",
              "quantity": 0
            },
            {
              "index": 58,
              "id": 23047,
              "name": "Mystic hat (dusk)",
              "quantity": 0
            },
            {
              "index": 59,
              "id": 23050,
              "name": "Mystic robe top (dusk)",
              "quantity": 0
            },
            {
              "index": 60,
              "id": 23053,
              "name": "Mystic robe bottom (dusk)",
              "quantity": 0
            },
            {
              "index": 61,
              "id": 23056,
              "name": "Mystic gloves (dusk)",
              "quantity": 0
            },
            {
              "index": 62,
              "id": 23059,
              "name": "Mystic boots (dusk)",
              "quantity": 0
            },
            {
              "index": 63,
              "id": 24268,
              "name": "Basilisk jaw",
              "quantity": 1
            },
            {
              "index": 64,
              "id": 24288,
              "name": "Dagon'hai hat",
              "quantity": 0
            },
            {
              "index": 65,
              "id": 24291,
              "name": "Dagon'hai robe top",
              "quantity": 0
            },
            {
              "index": 66,
              "id": 24294,
              "name": "Dagon'hai robe bottom",
              "quantity": 0
            },
            {
              "index": 67,
              "id": 24777,
              "name": "Blood shard",
              "quantity": 5
            },
            {
              "index": 68,
              "id": 26225,
              "name": "Ancient ceremonial mask",
              "quantity": 0
            },
            {
              "index": 69,
              "id": 26221,
              "name": "Ancient ceremonial top",
              "quantity": 0
            },
            {
              "index": 70,
              "id": 26223,
              "name": "Ancient ceremonial legs",
              "quantity": 0
            },
            {
              "index": 71,
              "id": 26227,
              "name": "Ancient ceremonial gloves",
              "quantity": 0
            },
            {
              "index": 72,
              "id": 26229,
              "name": "Ancient ceremonial boots",
              "quantity": 0
            },
            {
              "index": 73,
              "id": 28583,
              "name": "Warped sceptre (uncharged)",
              "quantity": 0
            }
          ]
        },
        "All Pets": {
          "index": 1,
          "items": [
            {
              "index": 0,
              "id": 13262,
              "name": "Abyssal orphan",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 22746,
              "name": "Ikkle hydra",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 13178,
              "name": "Callisto cub",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 13247,
              "name": "Hellpuppy",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 11995,
              "name": "Pet chaos elemental",
              "quantity": 2
            },
            {
              "index": 5,
              "id": 12651,
              "name": "Pet zilyana",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 12816,
              "name": "Pet dark core",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 12644,
              "name": "Pet dagannoth prime",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 12643,
              "name": "Pet dagannoth supreme",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 12645,
              "name": "Pet dagannoth rex",
              "quantity": 0
            },
            {
              "index": 10,
              "id": 13225,
              "name": "Tzrek-jad",
              "quantity": 0
            },
            {
              "index": 11,
              "id": 12650,
              "name": "Pet general graardor",
              "quantity": 0
            },
            {
              "index": 12,
              "id": 12646,
              "name": "Baby mole",
              "quantity": 0
            },
            {
              "index": 13,
              "id": 21748,
              "name": "Noon",
              "quantity": 0
            },
            {
              "index": 14,
              "id": 21291,
              "name": "Jal-nib-rek",
              "quantity": 0
            },
            {
              "index": 15,
              "id": 12647,
              "name": "Kalphite princess",
              "quantity": 0
            },
            {
              "index": 16,
              "id": 12653,
              "name": "Prince black dragon",
              "quantity": 0
            },
            {
              "index": 17,
              "id": 12655,
              "name": "Pet kraken",
              "quantity": 1
            },
            {
              "index": 18,
              "id": 12649,
              "name": "Pet kree'arra",
              "quantity": 0
            },
            {
              "index": 19,
              "id": 12652,
              "name": "Pet k'ril tsutsaroth",
              "quantity": 0
            },
            {
              "index": 20,
              "id": 13181,
              "name": "Scorpia's offspring",
              "quantity": 0
            },
            {
              "index": 21,
              "id": 21273,
              "name": "Skotos",
              "quantity": 2
            },
            {
              "index": 22,
              "id": 12648,
              "name": "Pet smoke devil",
              "quantity": 0
            },
            {
              "index": 23,
              "id": 13177,
              "name": "Venenatis spiderling",
              "quantity": 0
            },
            {
              "index": 24,
              "id": 13179,
              "name": "Vet'ion jr.",
              "quantity": 0
            },
            {
              "index": 25,
              "id": 21992,
              "name": "Vorki",
              "quantity": 0
            },
            {
              "index": 26,
              "id": 20693,
              "name": "Phoenix",
              "quantity": 0
            },
            {
              "index": 27,
              "id": 12921,
              "name": "Pet snakeling",
              "quantity": 0
            },
            {
              "index": 28,
              "id": 20851,
              "name": "Olmlet",
              "quantity": 0
            },
            {
              "index": 29,
              "id": 22473,
              "name": "Lil' zik",
              "quantity": 0
            },
            {
              "index": 30,
              "id": 19730,
              "name": "Bloodhound",
              "quantity": 0
            },
            {
              "index": 31,
              "id": 12703,
              "name": "Pet penance queen",
              "quantity": 0
            },
            {
              "index": 32,
              "id": 13320,
              "name": "Heron",
              "quantity": 0
            },
            {
              "index": 33,
              "id": 13321,
              "name": "Rock golem",
              "quantity": 1
            },
            {
              "index": 34,
              "id": 13322,
              "name": "Beaver",
              "quantity": 0
            },
            {
              "index": 35,
              "id": 13324,
              "name": "Baby chinchompa",
              "quantity": 1
            },
            {
              "index": 36,
              "id": 20659,
              "name": "Giant squirrel",
              "quantity": 1
            },
            {
              "index": 37,
              "id": 20661,
              "name": "Tangleroot",
              "quantity": 2
            },
            {
              "index": 38,
              "id": 20663,
              "name": "Rocky",
              "quantity": 2
            },
            {
              "index": 39,
              "id": 20665,
              "name": "Rift guardian",
              "quantity": 0
            },
            {
              "index": 40,
              "id": 21509,
              "name": "Herbi",
              "quantity": 0
            },
            {
              "index": 41,
              "id": 13071,
              "name": "Chompy chick",
              "quantity": 0
            },
            {
              "index": 42,
              "id": 23495,
              "name": "Sraracha",
              "quantity": 0
            },
            {
              "index": 43,
              "id": 23760,
              "name": "Smolcano",
              "quantity": 0
            },
            {
              "index": 44,
              "id": 23757,
              "name": "Youngllef",
              "quantity": 0
            },
            {
              "index": 45,
              "id": 24491,
              "name": "Little nightmare",
              "quantity": 0
            },
            {
              "index": 46,
              "id": 25348,
              "name": "Lil' creator",
              "quantity": 0
            },
            {
              "index": 47,
              "id": 25602,
              "name": "Tiny tempor",
              "quantity": 0
            },
            {
              "index": 48,
              "id": 26348,
              "name": "Nexling",
              "quantity": 0
            },
            {
              "index": 49,
              "id": 26901,
              "name": "Abyssal protector",
              "quantity": 0
            },
            {
              "index": 50,
              "id": 27352,
              "name": "Tumeken's guardian",
              "quantity": 0
            },
            {
              "index": 51,
              "id": 27590,
              "name": "Muphin",
              "quantity": 0
            },
            {
              "index": 52,
              "id": 28246,
              "name": "Wisp",
              "quantity": 0
            },
            {
              "index": 53,
              "id": 28250,
              "name": "Baron",
              "quantity": 0
            },
            {
              "index": 54,
              "id": 28248,
              "name": "Butch",
              "quantity": 2
            },
            {
              "index": 55,
              "id": 28252,
              "name": "Lil'viathan",
              "quantity": 0
            }
          ]
        },
        "Skilling Pets": {
          "index": 19,
          "items": [
            {
              "index": 0,
              "id": 13320,
              "name": "Heron",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 13321,
              "name": "Rock golem",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 13322,
              "name": "Beaver",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 13324,
              "name": "Baby chinchompa",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 20659,
              "name": "Giant squirrel",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 20661,
              "name": "Tangleroot",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 20663,
              "name": "Rocky",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 20665,
              "name": "Rift guardian",
              "quantity": 0
            }
          ]
        },
        "Revenants": {
          "index": 15,
          "items": [
            {
              "index": 0,
              "id": 22542,
              "name": "Viggora's chainmace (u)",
              "quantity": 1
            },
            {
              "index": 1,
              "id": 22547,
              "name": "Craw's bow (u)",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 22552,
              "name": "Thammaron's sceptre (u)",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 22557,
              "name": "Amulet of avarice",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 21817,
              "name": "Bracelet of ethereum (uncharged)",
              "quantity": 176
            },
            {
              "index": 5,
              "id": 21804,
              "name": "Ancient crystal",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 22305,
              "name": "Ancient relic",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 22302,
              "name": "Ancient effigy",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 22299,
              "name": "Ancient medallion",
              "quantity": 1
            },
            {
              "index": 9,
              "id": 21813,
              "name": "Ancient statuette",
              "quantity": 0
            },
            {
              "index": 10,
              "id": 21810,
              "name": "Ancient totem",
              "quantity": 1
            },
            {
              "index": 11,
              "id": 21807,
              "name": "Ancient emblem",
              "quantity": 0
            },
            {
              "index": 12,
              "id": 21802,
              "name": "Revenant cave teleport",
              "quantity": 276
            },
            {
              "index": 13,
              "id": 21820,
              "name": "Revenant ether",
              "quantity": 18558
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Revenant kills",
              "count": 1625
            }
          ]
        },
        "Shayzien Armour": {
          "index": 16,
          "items": [
            {
              "index": 0,
              "id": 13357,
              "name": "Shayzien gloves (1)",
              "quantity": 1
            },
            {
              "index": 1,
              "id": 13358,
              "name": "Shayzien boots (1)",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 13359,
              "name": "Shayzien helm (1)",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 13360,
              "name": "Shayzien greaves (1)",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 13361,
              "name": "Shayzien platebody (1)",
              "quantity": 1
            },
            {
              "index": 5,
              "id": 13362,
              "name": "Shayzien gloves (2)",
              "quantity": 1
            },
            {
              "index": 6,
              "id": 13363,
              "name": "Shayzien boots (2)",
              "quantity": 1
            },
            {
              "index": 7,
              "id": 13364,
              "name": "Shayzien helm (2)",
              "quantity": 1
            },
            {
              "index": 8,
              "id": 13365,
              "name": "Shayzien greaves (2)",
              "quantity": 1
            },
            {
              "index": 9,
              "id": 13366,
              "name": "Shayzien platebody (2)",
              "quantity": 1
            },
            {
              "index": 10,
              "id": 13367,
              "name": "Shayzien gloves (3)",
              "quantity": 1
            },
            {
              "index": 11,
              "id": 13368,
              "name": "Shayzien boots (3)",
              "quantity": 1
            },
            {
              "index": 12,
              "id": 13369,
              "name": "Shayzien helm (3)",
              "quantity": 1
            },
            {
              "index": 13,
              "id": 13370,
              "name": "Shayzien greaves (3)",
              "quantity": 1
            },
            {
              "index": 14,
              "id": 13371,
              "name": "Shayzien platebody (3)",
              "quantity": 1
            },
            {
              "index": 15,
              "id": 13372,
              "name": "Shayzien gloves (4)",
              "quantity": 1
            },
            {
              "index": 16,
              "id": 13373,
              "name": "Shayzien boots (4)",
              "quantity": 1
            },
            {
              "index": 17,
              "id": 13374,
              "name": "Shayzien helm (4)",
              "quantity": 1
            },
            {
              "index": 18,
              "id": 13375,
              "name": "Shayzien greaves (4)",
              "quantity": 1
            },
            {
              "index": 19,
              "id": 13376,
              "name": "Shayzien platebody (4)",
              "quantity": 1
            },
            {
              "index": 20,
              "id": 13377,
              "name": "Shayzien gloves (5)",
              "quantity": 1
            },
            {
              "index": 21,
              "id": 13378,
              "name": "Shayzien boots (5)",
              "quantity": 1
            },
            {
              "index": 22,
              "id": 13379,
              "name": "Shayzien helm (5)",
              "quantity": 1
            },
            {
              "index": 23,
              "id": 13380,
              "name": "Shayzien greaves (5)",
              "quantity": 1
            },
            {
              "index": 24,
              "id": 13381,
              "name": "Shayzien body (5)",
              "quantity": 1
            }
          ]
        },
        "Rooftop Agility": {
          "index": 15,
          "items": [
            {
              "index": 0,
              "id": 11849,
              "name": "Mark of grace",
              "quantity": 2159
            },
            {
              "index": 1,
              "id": 11850,
              "name": "Graceful hood",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 11852,
              "name": "Graceful cape",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 11854,
              "name": "Graceful top",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 11856,
              "name": "Graceful legs",
              "quantity": 1
            },
            {
              "index": 5,
              "id": 11858,
              "name": "Graceful gloves",
              "quantity": 1
            },
            {
              "index": 6,
              "id": 11860,
              "name": "Graceful boots",
              "quantity": 1
            }
          ]
        },
        "TzHaar": {
          "index": 21,
          "items": [
            {
              "index": 0,
              "id": 6568,
              "name": "Obsidian cape",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 6524,
              "name": "Toktz-ket-xil",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 6528,
              "name": "Tzhaar-ket-om",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 6523,
              "name": "Toktz-xil-ak",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 6525,
              "name": "Toktz-xil-ek",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 6526,
              "name": "Toktz-mej-tal",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 6522,
              "name": "Toktz-xil-ul",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 21298,
              "name": "Obsidian helmet",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 21301,
              "name": "Obsidian platebody",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 21304,
              "name": "Obsidian platelegs",
              "quantity": 0
            }
          ]
        },
        "Shooting Stars": {
          "index": 18,
          "items": [
            {
              "index": 0,
              "id": 25539,
              "name": "Celestial ring (uncharged)",
              "quantity": 1
            },
            {
              "index": 1,
              "id": 25547,
              "name": "Star fragment",
              "quantity": 1
            }
          ]
        },
        "My Notes": {
          "index": 12,
          "items": [
            {
              "index": 0,
              "id": 11341,
              "name": "Ancient page",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 11342,
              "name": "Ancient page",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 11343,
              "name": "Ancient page",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 11344,
              "name": "Ancient page",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 11345,
              "name": "Ancient page",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 11346,
              "name": "Ancient page",
              "quantity": 1
            },
            {
              "index": 6,
              "id": 11347,
              "name": "Ancient page",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 11348,
              "name": "Ancient page",
              "quantity": 1
            },
            {
              "index": 8,
              "id": 11349,
              "name": "Ancient page",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 11350,
              "name": "Ancient page",
              "quantity": 0
            },
            {
              "index": 10,
              "id": 11351,
              "name": "Ancient page",
              "quantity": 0
            },
            {
              "index": 11,
              "id": 11352,
              "name": "Ancient page",
              "quantity": 0
            },
            {
              "index": 12,
              "id": 11353,
              "name": "Ancient page",
              "quantity": 0
            },
            {
              "index": 13,
              "id": 11354,
              "name": "Ancient page",
              "quantity": 1
            },
            {
              "index": 14,
              "id": 11355,
              "name": "Ancient page",
              "quantity": 0
            },
            {
              "index": 15,
              "id": 11356,
              "name": "Ancient page",
              "quantity": 0
            },
            {
              "index": 16,
              "id": 11357,
              "name": "Ancient page",
              "quantity": 0
            },
            {
              "index": 17,
              "id": 11358,
              "name": "Ancient page",
              "quantity": 0
            },
            {
              "index": 18,
              "id": 11359,
              "name": "Ancient page",
              "quantity": 0
            },
            {
              "index": 19,
              "id": 11360,
              "name": "Ancient page",
              "quantity": 0
            },
            {
              "index": 20,
              "id": 11361,
              "name": "Ancient page",
              "quantity": 1
            },
            {
              "index": 21,
              "id": 11362,
              "name": "Ancient page",
              "quantity": 0
            },
            {
              "index": 22,
              "id": 11363,
              "name": "Ancient page",
              "quantity": 0
            },
            {
              "index": 23,
              "id": 11364,
              "name": "Ancient page",
              "quantity": 0
            },
            {
              "index": 24,
              "id": 11365,
              "name": "Ancient page",
              "quantity": 0
            },
            {
              "index": 25,
              "id": 11366,
              "name": "Ancient page",
              "quantity": 0
            }
          ]
        },
        "Monkey Backpacks": {
          "index": 10,
          "items": [
            {
              "index": 0,
              "id": 24862,
              "name": "Karamjan monkey",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 24866,
              "name": "Kruk jr",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 24864,
              "name": "Maniacal monkey",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 24867,
              "name": "Princely monkey",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 24865,
              "name": "Skeleton monkey",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 24863,
              "name": "Zombie monkey",
              "quantity": 0
            }
          ]
        },
        "Glough's Experiments": {
          "index": 10,
          "items": [
            {
              "index": 0,
              "id": 19529,
              "name": "Zenyte shard",
              "quantity": 4
            },
            {
              "index": 1,
              "id": 19586,
              "name": "Light frame",
              "quantity": 3
            },
            {
              "index": 2,
              "id": 19589,
              "name": "Heavy frame",
              "quantity": 2
            },
            {
              "index": 3,
              "id": 19592,
              "name": "Ballista limbs",
              "quantity": 2
            },
            {
              "index": 4,
              "id": 19610,
              "name": "Monkey tail",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 19601,
              "name": "Ballista spring",
              "quantity": 1
            }
          ],
          "killCounts": [
            {
              "index": 0,
              "name": "Demonic Gorilla kills",
              "count": 1441
            },
            {
              "index": 1,
              "name": "Tortured Gorilla kills",
              "count": 0
            }
          ]
        },
        "Cyclopes": {
          "index": 7,
          "items": [
            {
              "index": 0,
              "id": 8844,
              "name": "Bronze defender",
              "quantity": 1
            },
            {
              "index": 1,
              "id": 8845,
              "name": "Iron defender",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 8846,
              "name": "Steel defender",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 8847,
              "name": "Black defender",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 8848,
              "name": "Mithril defender",
              "quantity": 1
            },
            {
              "index": 5,
              "id": 8849,
              "name": "Adamant defender",
              "quantity": 1
            },
            {
              "index": 6,
              "id": 8850,
              "name": "Rune defender",
              "quantity": 1
            },
            {
              "index": 7,
              "id": 12954,
              "name": "Dragon defender",
              "quantity": 2
            }
          ]
        },
        "Motherlode Mine": {
          "index": 11,
          "items": [
            {
              "index": 0,
              "id": 25627,
              "name": "Coal bag",
              "quantity": 1
            },
            {
              "index": 1,
              "id": 25628,
              "name": "Gem bag",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 12013,
              "name": "Prospector helmet",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 12014,
              "name": "Prospector jacket",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 12015,
              "name": "Prospector legs",
              "quantity": 1
            },
            {
              "index": 5,
              "id": 12016,
              "name": "Prospector boots",
              "quantity": 1
            }
          ]
        },
        "Chompy Bird Hunting": {
          "index": 5,
          "items": [
            {
              "index": 0,
              "id": 13071,
              "name": "Chompy chick",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 2978,
              "name": "Chompy bird hat",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 2979,
              "name": "Chompy bird hat",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 2980,
              "name": "Chompy bird hat",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 2981,
              "name": "Chompy bird hat",
              "quantity": 1
            },
            {
              "index": 5,
              "id": 2982,
              "name": "Chompy bird hat",
              "quantity": 1
            },
            {
              "index": 6,
              "id": 2983,
              "name": "Chompy bird hat",
              "quantity": 1
            },
            {
              "index": 7,
              "id": 2984,
              "name": "Chompy bird hat",
              "quantity": 1
            },
            {
              "index": 8,
              "id": 2985,
              "name": "Chompy bird hat",
              "quantity": 1
            },
            {
              "index": 9,
              "id": 2986,
              "name": "Chompy bird hat",
              "quantity": 1
            },
            {
              "index": 10,
              "id": 2987,
              "name": "Chompy bird hat",
              "quantity": 1
            },
            {
              "index": 11,
              "id": 2988,
              "name": "Chompy bird hat",
              "quantity": 1
            },
            {
              "index": 12,
              "id": 2989,
              "name": "Chompy bird hat",
              "quantity": 1
            },
            {
              "index": 13,
              "id": 2990,
              "name": "Chompy bird hat",
              "quantity": 1
            },
            {
              "index": 14,
              "id": 2991,
              "name": "Chompy bird hat",
              "quantity": 0
            },
            {
              "index": 15,
              "id": 2992,
              "name": "Chompy bird hat",
              "quantity": 0
            },
            {
              "index": 16,
              "id": 2993,
              "name": "Chompy bird hat",
              "quantity": 0
            },
            {
              "index": 17,
              "id": 2994,
              "name": "Chompy bird hat",
              "quantity": 0
            },
            {
              "index": 18,
              "id": 2995,
              "name": "Chompy bird hat",
              "quantity": 0
            }
          ]
        },
        "Champion's Challenge": {
          "index": 3,
          "items": [
            {
              "index": 0,
              "id": 6798,
              "name": "Earth warrior champion scroll",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 6799,
              "name": "Ghoul champion scroll",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 6800,
              "name": "Giant champion scroll",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 6801,
              "name": "Goblin champion scroll",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 6802,
              "name": "Hobgoblin champion scroll",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 6803,
              "name": "Imp champion scroll",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 6804,
              "name": "Jogre champion scroll",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 6805,
              "name": "Lesser demon champion scroll",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 6806,
              "name": "Skeleton champion scroll",
              "quantity": 1
            },
            {
              "index": 9,
              "id": 6807,
              "name": "Zombie champion scroll",
              "quantity": 0
            },
            {
              "index": 10,
              "id": 21439,
              "name": "Champion's cape",
              "quantity": 0
            }
          ]
        },
        "Chaos Druids": {
          "index": 4,
          "items": [
            {
              "index": 0,
              "id": 20517,
              "name": "Elder chaos top",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 20520,
              "name": "Elder chaos robe",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 20595,
              "name": "Elder chaos hood",
              "quantity": 0
            }
          ]
        },
        "Creature Creation": {
          "index": 6,
          "items": [
            {
              "index": 0,
              "id": 25617,
              "name": "Tea flask",
              "quantity": 33
            },
            {
              "index": 1,
              "id": 25618,
              "name": "Plain satchel",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 25619,
              "name": "Green satchel",
              "quantity": 9
            },
            {
              "index": 3,
              "id": 25620,
              "name": "Red satchel",
              "quantity": 52
            },
            {
              "index": 4,
              "id": 25621,
              "name": "Black satchel",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 25622,
              "name": "Gold satchel",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 25623,
              "name": "Rune satchel",
              "quantity": 0
            }
          ]
        },
        "Fossil Island Notes": {
          "index": 8,
          "items": [
            {
              "index": 0,
              "id": 21664,
              "name": "Scribbled note",
              "quantity": 1
            },
            {
              "index": 1,
              "id": 21666,
              "name": "Partial note",
              "quantity": 1
            },
            {
              "index": 2,
              "id": 21668,
              "name": "Ancient note",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 21670,
              "name": "Ancient writings",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 21672,
              "name": "Experimental note",
              "quantity": 1
            },
            {
              "index": 5,
              "id": 21674,
              "name": "Paragraph of text",
              "quantity": 1
            },
            {
              "index": 6,
              "id": 21676,
              "name": "Musty smelling note",
              "quantity": 1
            },
            {
              "index": 7,
              "id": 21678,
              "name": "Hastily scrawled note",
              "quantity": 1
            },
            {
              "index": 8,
              "id": 21680,
              "name": "Old writing",
              "quantity": 1
            },
            {
              "index": 9,
              "id": 21682,
              "name": "Short note",
              "quantity": 1
            }
          ]
        },
        "Camdozaal": {
          "index": 2,
          "items": [
            {
              "index": 0,
              "id": 25641,
              "name": "Barronite mace",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 25635,
              "name": "Barronite head",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 25637,
              "name": "Barronite handle",
              "quantity": 0
            },
            {
              "index": 3,
              "id": 25639,
              "name": "Barronite guard",
              "quantity": 0
            },
            {
              "index": 4,
              "id": 25686,
              "name": "Ancient globe",
              "quantity": 0
            },
            {
              "index": 5,
              "id": 25688,
              "name": "Ancient ledger",
              "quantity": 0
            },
            {
              "index": 6,
              "id": 25690,
              "name": "Ancient astroscope",
              "quantity": 0
            },
            {
              "index": 7,
              "id": 25692,
              "name": "Ancient treatise",
              "quantity": 0
            },
            {
              "index": 8,
              "id": 25694,
              "name": "Ancient carcanet",
              "quantity": 0
            },
            {
              "index": 9,
              "id": 25644,
              "name": "Imcando hammer",
              "quantity": 0
            }
          ]
        },
        "Forestry": {
          "index": 8,
          "items": [
            {
              "index": 0,
              "id": 28626,
              "name": "Fox whistle",
              "quantity": 0
            },
            {
              "index": 1,
              "id": 28663,
              "name": "Golden pheasant egg",
              "quantity": 0
            },
            {
              "index": 2,
              "id": 10941,
              "name": "Lumberjack hat",
              "quantity": 1
            },
            {
              "index": 3,
              "id": 10939,
              "name": "Lumberjack top",
              "quantity": 1
            },
            {
              "index": 4,
              "id": 10940,
              "name": "Lumberjack legs",
              "quantity": 1
            },
            {
              "index": 5,
              "id": 10933,
              "name": "Lumberjack boots",
              "quantity": 1
            },
            {
              "index": 6,
              "id": 28173,
              "name": "Forestry hat",
              "quantity": 1
            },
            {
              "index": 7,
              "id": 28169,
              "name": "Forestry top",
              "quantity": 1
            },
            {
              "index": 8,
              "id": 28171,
              "name": "Forestry legs",
              "quantity": 1
            },
            {
              "index": 9,
              "id": 28175,
              "name": "Forestry boots",
              "quantity": 1
            },
            {
              "index": 10,
              "id": 28630,
              "name": "Twitcher's gloves",
              "quantity": 0
            },
            {
              "index": 11,
              "id": 28138,
              "name": "Funky shaped log",
              "quantity": 1
            },
            {
              "index": 12,
              "id": 28140,
              "name": "Log basket",
              "quantity": 1
            },
            {
              "index": 13,
              "id": 28146,
              "name": "Log brace",
              "quantity": 1
            },
            {
              "index": 14,
              "id": 28166,
              "name": "Clothes pouch blueprint",
              "quantity": 1
            },
            {
              "index": 15,
              "id": 28613,
              "name": "Cape pouch",
              "quantity": 0
            },
            {
              "index": 16,
              "id": 28177,
              "name": "Felling axe handle",
              "quantity": 0
            },
            {
              "index": 17,
              "id": 28620,
              "name": "Pheasant hat",
              "quantity": 0
            },
            {
              "index": 18,
              "id": 28622,
              "name": "Pheasant legs",
              "quantity": 0
            },
            {
              "index": 19,
              "id": 28618,
              "name": "Pheasant boots",
              "quantity": 0
            },
            {
              "index": 20,
              "id": 28616,
              "name": "Pheasant cape",
              "quantity": 0
            },
            {
              "index": 21,
              "id": 28655,
              "name": "Petal garland",
              "quantity": 0
            }
          ]
        }
      }
    },
    "uniqueItemsTotal": 1490,
    "uniqueItemsObtained": 545
  },
  "achievementDiaries": [
    {
      "area": "Ardougne",
      "Easy": {
        "completed": 10,
        "total": 10
      },
      "Medium": {
        "completed": 12,
        "total": 12
      },
      "Hard": {
        "completed": 12,
        "total": 12
      },
      "Elite": {
        "completed": 8,
        "total": 8
      }
    },
    {
      "area": "Desert",
      "Easy": {
        "completed": 11,
        "total": 11
      },
      "Medium": {
        "completed": 12,
        "total": 12
      },
      "Hard": {
        "completed": 10,
        "total": 10
      },
      "Elite": {
        "completed": 6,
        "total": 6
      }
    },
    {
      "area": "Falador",
      "Easy": {
        "completed": 11,
        "total": 11
      },
      "Medium": {
        "completed": 14,
        "total": 14
      },
      "Hard": {
        "completed": 11,
        "total": 11
      },
      "Elite": {
        "completed": 6,
        "total": 6
      }
    },
    {
      "area": "Fremennik",
      "Easy": {
        "completed": 10,
        "total": 10
      },
      "Medium": {
        "completed": 9,
        "total": 9
      },
      "Hard": {
        "completed": 9,
        "total": 9
      },
      "Elite": {
        "completed": 6,
        "total": 6
      }
    },
    {
      "area": "Kandarin",
      "Easy": {
        "completed": 11,
        "total": 11
      },
      "Medium": {
        "completed": 14,
        "total": 14
      },
      "Hard": {
        "completed": 11,
        "total": 11
      },
      "Elite": {
        "completed": 7,
        "total": 7
      }
    },
    {
      "area": "Karamja",
      "Easy": {
        "completed": 10,
        "total": 10
      },
      "Medium": {
        "completed": 19,
        "total": 19
      },
      "Hard": {
        "completed": 10,
        "total": 10
      },
      "Elite": {
        "completed": 5,
        "total": 5
      }
    },
    {
      "area": "Kourend & Kebos",
      "Easy": {
        "completed": 12,
        "total": 12
      },
      "Medium": {
        "completed": 13,
        "total": 13
      },
      "Hard": {
        "completed": 10,
        "total": 10
      },
      "Elite": {
        "completed": 8,
        "total": 8
      }
    },
    {
      "area": "Lumbridge & Draynor",
      "Easy": {
        "completed": 12,
        "total": 12
      },
      "Medium": {
        "completed": 12,
        "total": 12
      },
      "Hard": {
        "completed": 11,
        "total": 11
      },
      "Elite": {
        "completed": 6,
        "total": 6
      }
    },
    {
      "area": "Morytania",
      "Easy": {
        "completed": 11,
        "total": 11
      },
      "Medium": {
        "completed": 11,
        "total": 11
      },
      "Hard": {
        "completed": 10,
        "total": 10
      },
      "Elite": {
        "completed": 6,
        "total": 6
      }
    },
    {
      "area": "Varrock",
      "Easy": {
        "completed": 14,
        "total": 14
      },
      "Medium": {
        "completed": 13,
        "total": 13
      },
      "Hard": {
        "completed": 10,
        "total": 10
      },
      "Elite": {
        "completed": 5,
        "total": 5
      }
    },
    {
      "area": "Western Provinces",
      "Easy": {
        "completed": 11,
        "total": 11
      },
      "Medium": {
        "completed": 13,
        "total": 13
      },
      "Hard": {
        "completed": 13,
        "total": 13
      },
      "Elite": {
        "completed": 7,
        "total": 7
      }
    },
    {
      "area": "Wilderness",
      "Easy": {
        "completed": 12,
        "total": 12
      },
      "Medium": {
        "completed": 11,
        "total": 11
      },
      "Hard": {
        "completed": 10,
        "total": 10
      },
      "Elite": {
        "completed": 7,
        "total": 7
      }
    }
  ],
  "combatAchievements": {
    "Master": {
      "completed": 38,
      "total": 144
    },
    "Grandmaster": {
      "completed": 4,
      "total": 102
    },
    "Easy": {
      "completed": 33,
      "total": 35
    },
    "Elite": {
      "completed": 90,
      "total": 138
    },
    "Hard": {
      "completed": 58,
      "total": 63
    },
    "Medium": {
      "completed": 41,
      "total": 44
    }
  },
  "questList": {
    "points": 300,
    "quests": [
      {
        "name": "Biohazard",
        "state": "FINISHED"
      },
      {
        "name": "A Night at the Theatre",
        "state": "FINISHED"
      },
      {
        "name": "The Ascent of Arceuus",
        "state": "FINISHED"
      },
      {
        "name": "Regicide",
        "state": "FINISHED"
      },
      {
        "name": "Devious Minds",
        "state": "FINISHED"
      },
      {
        "name": "Ghosts Ahoy",
        "state": "FINISHED"
      },
      {
        "name": "A Kingdom Divided",
        "state": "FINISHED"
      },
      {
        "name": "What Lies Below",
        "state": "FINISHED"
      },
      {
        "name": "Underground Pass",
        "state": "FINISHED"
      },
      {
        "name": "Temple of Ikov",
        "state": "FINISHED"
      },
      {
        "name": "Olaf's Quest",
        "state": "FINISHED"
      },
      {
        "name": "Recruitment Drive",
        "state": "FINISHED"
      },
      {
        "name": "Rag and Bone Man II",
        "state": "FINISHED"
      },
      {
        "name": "Heroes' Quest",
        "state": "FINISHED"
      },
      {
        "name": "Monk's Friend",
        "state": "FINISHED"
      },
      {
        "name": "Recipe for Disaster - King Awowogei",
        "state": "FINISHED"
      },
      {
        "name": "Roving Elves",
        "state": "FINISHED"
      },
      {
        "name": "Witch's Potion",
        "state": "FINISHED"
      },
      {
        "name": "Hazeel Cult",
        "state": "FINISHED"
      },
      {
        "name": "Throne of Miscellania",
        "state": "FINISHED"
      },
      {
        "name": "Fight Arena",
        "state": "FINISHED"
      },
      {
        "name": "Elemental Workshop I",
        "state": "FINISHED"
      },
      {
        "name": "Recipe for Disaster - Pirate Pete",
        "state": "FINISHED"
      },
      {
        "name": "One Small Favour",
        "state": "FINISHED"
      },
      {
        "name": "Gertrude's Cat",
        "state": "FINISHED"
      },
      {
        "name": "A Taste of Hope",
        "state": "FINISHED"
      },
      {
        "name": "Troll Romance",
        "state": "FINISHED"
      },
      {
        "name": "Client of Kourend",
        "state": "FINISHED"
      },
      {
        "name": "Sins of the Father",
        "state": "FINISHED"
      },
      {
        "name": "Bone Voyage",
        "state": "FINISHED"
      },
      {
        "name": "Druidic Ritual",
        "state": "FINISHED"
      },
      {
        "name": "The Fremennik Exiles",
        "state": "FINISHED"
      },
      {
        "name": "The Ribbiting Tale of a Lily Pad Labour Dispute",
        "state": "NOT_STARTED"
      },
      {
        "name": "Creature of Fenkenstrain",
        "state": "FINISHED"
      },
      {
        "name": "Recipe for Disaster",
        "state": "FINISHED"
      },
      {
        "name": "Recipe for Disaster - Lumbridge Guide",
        "state": "FINISHED"
      },
      {
        "name": "The Slug Menace",
        "state": "FINISHED"
      },
      {
        "name": "Temple of the Eye",
        "state": "FINISHED"
      },
      {
        "name": "Ratcatchers",
        "state": "FINISHED"
      },
      {
        "name": "His Faithful Servants",
        "state": "FINISHED"
      },
      {
        "name": "X Marks the Spot",
        "state": "FINISHED"
      },
      {
        "name": "The Golem",
        "state": "FINISHED"
      },
      {
        "name": "A Soul's Bane",
        "state": "FINISHED"
      },
      {
        "name": "Tree Gnome Village",
        "state": "FINISHED"
      },
      {
        "name": "The Giant Dwarf",
        "state": "FINISHED"
      },
      {
        "name": "Beneath Cursed Sands",
        "state": "FINISHED"
      },
      {
        "name": "Tower of Life",
        "state": "FINISHED"
      },
      {
        "name": "The Garden of Death",
        "state": "FINISHED"
      },
      {
        "name": "Watchtower",
        "state": "FINISHED"
      },
      {
        "name": "Mountain Daughter",
        "state": "FINISHED"
      },
      {
        "name": "At First Light",
        "state": "NOT_STARTED"
      },
      {
        "name": "The Forsaken Tower",
        "state": "FINISHED"
      },
      {
        "name": "The Dig Site",
        "state": "FINISHED"
      },
      {
        "name": "The Depths of Despair",
        "state": "FINISHED"
      },
      {
        "name": "A Porcine of Interest",
        "state": "FINISHED"
      },
      {
        "name": "Dragon Slayer II",
        "state": "FINISHED"
      },
      {
        "name": "Waterfall Quest",
        "state": "FINISHED"
      },
      {
        "name": "Curse of the Empty Lord",
        "state": "FINISHED"
      },
      {
        "name": "Recipe for Disaster - Culinaromancer",
        "state": "FINISHED"
      },
      {
        "name": "In Search of the Myreque",
        "state": "FINISHED"
      },
      {
        "name": "Eagles' Peak",
        "state": "FINISHED"
      },
      {
        "name": "Observatory Quest",
        "state": "FINISHED"
      },
      {
        "name": "Song of the Elves",
        "state": "FINISHED"
      },
      {
        "name": "Tears of Guthix",
        "state": "FINISHED"
      },
      {
        "name": "Contact!",
        "state": "FINISHED"
      },
      {
        "name": "Doric's Quest",
        "state": "FINISHED"
      },
      {
        "name": "The Knight's Sword",
        "state": "FINISHED"
      },
      {
        "name": "Nature Spirit",
        "state": "FINISHED"
      },
      {
        "name": "Recipe for Disaster - Skrach Uglogwee",
        "state": "FINISHED"
      },
      {
        "name": "The Restless Ghost",
        "state": "FINISHED"
      },
      {
        "name": "The Great Brain Robbery",
        "state": "FINISHED"
      },
      {
        "name": "Lunar Diplomacy",
        "state": "FINISHED"
      },
      {
        "name": "Monkey Madness II",
        "state": "FINISHED"
      },
      {
        "name": "The Frozen Door",
        "state": "FINISHED"
      },
      {
        "name": "The Eyes of Glouphrie",
        "state": "FINISHED"
      },
      {
        "name": "Icthlarin's Little Helper",
        "state": "FINISHED"
      },
      {
        "name": "Mage Arena I",
        "state": "FINISHED"
      },
      {
        "name": "Getting Ahead",
        "state": "FINISHED"
      },
      {
        "name": "Recipe for Disaster - Sir Amik Varze",
        "state": "FINISHED"
      },
      {
        "name": "Ernest the Chicken",
        "state": "FINISHED"
      },
      {
        "name": "Below Ice Mountain",
        "state": "FINISHED"
      },
      {
        "name": "Scorpion Catcher",
        "state": "FINISHED"
      },
      {
        "name": "My Arm's Big Adventure",
        "state": "FINISHED"
      },
      {
        "name": "Troll Stronghold",
        "state": "FINISHED"
      },
      {
        "name": "Imp Catcher",
        "state": "FINISHED"
      },
      {
        "name": "Enter the Abyss",
        "state": "FINISHED"
      },
      {
        "name": "Twilight's Promise",
        "state": "NOT_STARTED"
      },
      {
        "name": "The Enchanted Key",
        "state": "FINISHED"
      },
      {
        "name": "Alfred Grimhand's Barcrawl",
        "state": "FINISHED"
      },
      {
        "name": "Cold War",
        "state": "FINISHED"
      },
      {
        "name": "Making History",
        "state": "FINISHED"
      },
      {
        "name": "Shield of Arrav",
        "state": "FINISHED"
      },
      {
        "name": "Pirate's Treasure",
        "state": "FINISHED"
      },
      {
        "name": "Goblin Diplomacy",
        "state": "FINISHED"
      },
      {
        "name": "Big Chompy Bird Hunting",
        "state": "FINISHED"
      },
      {
        "name": "Secrets of the North",
        "state": "FINISHED"
      },
      {
        "name": "Another Slice of H.A.M.",
        "state": "FINISHED"
      },
      {
        "name": "Dwarf Cannon",
        "state": "FINISHED"
      },
      {
        "name": "Family Pest",
        "state": "FINISHED"
      },
      {
        "name": "Bear Your Soul",
        "state": "FINISHED"
      },
      {
        "name": "Mourning's End Part I",
        "state": "FINISHED"
      },
      {
        "name": "Grim Tales",
        "state": "FINISHED"
      },
      {
        "name": "Recipe for Disaster - Wartface & Bentnoze",
        "state": "FINISHED"
      },
      {
        "name": "Recipe for Disaster - Evil Dave",
        "state": "FINISHED"
      },
      {
        "name": "The Path of Glouphrie",
        "state": "FINISHED"
      },
      {
        "name": "Mage Arena II",
        "state": "FINISHED"
      },
      {
        "name": "Haunted Mine",
        "state": "FINISHED"
      },
      {
        "name": "The Queen of Thieves",
        "state": "FINISHED"
      },
      {
        "name": "Monkey Madness I",
        "state": "FINISHED"
      },
      {
        "name": "Fishing Contest",
        "state": "FINISHED"
      },
      {
        "name": "Sea Slug",
        "state": "FINISHED"
      },
      {
        "name": "Vampyre Slayer",
        "state": "FINISHED"
      },
      {
        "name": "Cabin Fever",
        "state": "FINISHED"
      },
      {
        "name": "The Corsair Curse",
        "state": "FINISHED"
      },
      {
        "name": "Fairytale II - Cure a Queen",
        "state": "FINISHED"
      },
      {
        "name": "Sheep Shearer",
        "state": "FINISHED"
      },
      {
        "name": "Land of the Goblins",
        "state": "FINISHED"
      },
      {
        "name": "Holy Grail",
        "state": "FINISHED"
      },
      {
        "name": "Lost City",
        "state": "FINISHED"
      },
      {
        "name": "Perilous Moons",
        "state": "NOT_STARTED"
      },
      {
        "name": "Dream Mentor",
        "state": "FINISHED"
      },
      {
        "name": "The Fremennik Isles",
        "state": "FINISHED"
      },
      {
        "name": "Witch's House",
        "state": "FINISHED"
      },
      {
        "name": "Tai Bwo Wannai Trio",
        "state": "FINISHED"
      },
      {
        "name": "Between a Rock...",
        "state": "FINISHED"
      },
      {
        "name": "Desert Treasure II - The Fallen Empire",
        "state": "FINISHED"
      },
      {
        "name": "Dragon Slayer I",
        "state": "FINISHED"
      },
      {
        "name": "Mourning's End Part II",
        "state": "FINISHED"
      },
      {
        "name": "Rag and Bone Man I",
        "state": "FINISHED"
      },
      {
        "name": "The Feud",
        "state": "FINISHED"
      },
      {
        "name": "Rune Mysteries",
        "state": "FINISHED"
      },
      {
        "name": "Spirits of the Elid",
        "state": "FINISHED"
      },
      {
        "name": "Death Plateau",
        "state": "FINISHED"
      },
      {
        "name": "In Search of Knowledge",
        "state": "FINISHED"
      },
      {
        "name": "Horror from the Deep",
        "state": "FINISHED"
      },
      {
        "name": "Demon Slayer",
        "state": "FINISHED"
      },
      {
        "name": "Desert Treasure I",
        "state": "FINISHED"
      },
      {
        "name": "Forgettable Tale...",
        "state": "FINISHED"
      },
      {
        "name": "Into the Tombs",
        "state": "FINISHED"
      },
      {
        "name": "Making Friends with My Arm",
        "state": "FINISHED"
      },
      {
        "name": "Cook's Assistant",
        "state": "FINISHED"
      },
      {
        "name": "Darkness of Hallowvale",
        "state": "FINISHED"
      },
      {
        "name": "Defender of Varrock",
        "state": "NOT_STARTED"
      },
      {
        "name": "The Tourist Trap",
        "state": "FINISHED"
      },
      {
        "name": "In Aid of the Myreque",
        "state": "FINISHED"
      },
      {
        "name": "Hopespear's Will",
        "state": "FINISHED"
      },
      {
        "name": "Skippy and the Mogres",
        "state": "FINISHED"
      },
      {
        "name": "Legends' Quest",
        "state": "FINISHED"
      },
      {
        "name": "Children of the Sun",
        "state": "NOT_STARTED"
      },
      {
        "name": "Black Knights' Fortress",
        "state": "FINISHED"
      },
      {
        "name": "Death to the Dorgeshuun",
        "state": "FINISHED"
      },
      {
        "name": "Rum Deal",
        "state": "FINISHED"
      },
      {
        "name": "Enakhra's Lament",
        "state": "FINISHED"
      },
      {
        "name": "Shilo Village",
        "state": "FINISHED"
      },
      {
        "name": "Misthalin Mystery",
        "state": "FINISHED"
      },
      {
        "name": "Prince Ali Rescue",
        "state": "FINISHED"
      },
      {
        "name": "Tribal Totem",
        "state": "FINISHED"
      },
      {
        "name": "Sleeping Giants",
        "state": "FINISHED"
      },
      {
        "name": "Shades of Mort'ton",
        "state": "FINISHED"
      },
      {
        "name": "Jungle Potion",
        "state": "FINISHED"
      },
      {
        "name": "Family Crest",
        "state": "FINISHED"
      },
      {
        "name": "Zogre Flesh Eaters",
        "state": "FINISHED"
      },
      {
        "name": "Barbarian Training",
        "state": "IN_PROGRESS"
      },
      {
        "name": "The Grand Tree",
        "state": "FINISHED"
      },
      {
        "name": "The Lost Tribe",
        "state": "FINISHED"
      },
      {
        "name": "Romeo & Juliet",
        "state": "FINISHED"
      },
      {
        "name": "Tale of the Righteous",
        "state": "FINISHED"
      },
      {
        "name": "The General's Shadow",
        "state": "FINISHED"
      },
      {
        "name": "Recipe for Disaster - Mountain Dwarf",
        "state": "FINISHED"
      },
      {
        "name": "Merlin's Crystal",
        "state": "FINISHED"
      },
      {
        "name": "Recipe for Disaster - Another Cook's Quest",
        "state": "FINISHED"
      },
      {
        "name": "Animal Magnetism",
        "state": "FINISHED"
      },
      {
        "name": "Swan Song",
        "state": "FINISHED"
      },
      {
        "name": "Royal Trouble",
        "state": "FINISHED"
      },
      {
        "name": "Lair of Tarn Razorlor",
        "state": "FINISHED"
      },
      {
        "name": "Plague City",
        "state": "FINISHED"
      },
      {
        "name": "Garden of Tranquillity",
        "state": "FINISHED"
      },
      {
        "name": "Murder Mystery",
        "state": "FINISHED"
      },
      {
        "name": "Clock Tower",
        "state": "FINISHED"
      },
      {
        "name": "Fairytale I - Growing Pains",
        "state": "FINISHED"
      },
      {
        "name": "Wanted!",
        "state": "FINISHED"
      },
      {
        "name": "The Hand in the Sand",
        "state": "FINISHED"
      },
      {
        "name": "Enlightened Journey",
        "state": "FINISHED"
      },
      {
        "name": "Priest in Peril",
        "state": "FINISHED"
      },
      {
        "name": "Eadgar's Ruse",
        "state": "FINISHED"
      },
      {
        "name": "Shadow of the Storm",
        "state": "FINISHED"
      },
      {
        "name": "A Tail of Two Cats",
        "state": "FINISHED"
      },
      {
        "name": "While Guthix Sleeps",
        "state": "NOT_STARTED"
      },
      {
        "name": "Elemental Workshop II",
        "state": "FINISHED"
      },
      {
        "name": "Sheep Herder",
        "state": "FINISHED"
      },
      {
        "name": "Daddy's Home",
        "state": "FINISHED"
      },
      {
        "name": "King's Ransom",
        "state": "FINISHED"
      },
      {
        "name": "The Fremennik Trials",
        "state": "FINISHED"
      }
    ]
  },
  "hiscores": {
    "normal": {
      "skills": [
        {
          "index": 0,
          "name": "Overall",
          "rank": 64167,
          "level": 2234,
          "xp": 348174290
        },
        {
          "index": 1,
          "name": "Attack",
          "rank": 104364,
          "level": 99,
          "xp": 18165013
        },
        {
          "index": 2,
          "name": "Defence",
          "rank": 72120,
          "level": 99,
          "xp": 17607175
        },
        {
          "index": 3,
          "name": "Strength",
          "rank": 64405,
          "level": 99,
          "xp": 30159842
        },
        {
          "index": 4,
          "name": "Hitpoints",
          "rank": 99953,
          "level": 99,
          "xp": 35143846
        },
        {
          "index": 5,
          "name": "Ranged",
          "rank": 199056,
          "level": 99,
          "xp": 21386833
        },
        {
          "index": 6,
          "name": "Prayer",
          "rank": 214411,
          "level": 90,
          "xp": 5401812
        },
        {
          "index": 7,
          "name": "Magic",
          "rank": 98430,
          "level": 99,
          "xp": 19418120
        },
        {
          "index": 8,
          "name": "Cooking",
          "rank": 169987,
          "level": 99,
          "xp": 13203772
        },
        {
          "index": 9,
          "name": "Woodcutting",
          "rank": 101260,
          "level": 99,
          "xp": 13214238
        },
        {
          "index": 10,
          "name": "Fletching",
          "rank": 157316,
          "level": 99,
          "xp": 13047461
        },
        {
          "index": 11,
          "name": "Fishing",
          "rank": 116153,
          "level": 99,
          "xp": 13038178
        },
        {
          "index": 12,
          "name": "Firemaking",
          "rank": 9595,
          "level": 99,
          "xp": 25683760
        },
        {
          "index": 13,
          "name": "Crafting",
          "rank": 91292,
          "level": 99,
          "xp": 13287331
        },
        {
          "index": 14,
          "name": "Smithing",
          "rank": 179614,
          "level": 89,
          "xp": 5017017
        },
        {
          "index": 15,
          "name": "Mining",
          "rank": 104066,
          "level": 99,
          "xp": 13034450
        },
        {
          "index": 16,
          "name": "Herblore",
          "rank": 117497,
          "level": 95,
          "xp": 9025172
        },
        {
          "index": 17,
          "name": "Agility",
          "rank": 79084,
          "level": 97,
          "xp": 11297935
        },
        {
          "index": 18,
          "name": "Thieving",
          "rank": 22120,
          "level": 99,
          "xp": 18153080
        },
        {
          "index": 19,
          "name": "Slayer",
          "rank": 174273,
          "level": 97,
          "xp": 11288256
        },
        {
          "index": 20,
          "name": "Farming",
          "rank": 108063,
          "level": 99,
          "xp": 14659094
        },
        {
          "index": 21,
          "name": "Runecraft",
          "rank": 162721,
          "level": 86,
          "xp": 3787146
        },
        {
          "index": 22,
          "name": "Hunter",
          "rank": 97588,
          "level": 96,
          "xp": 10110889
        },
        {
          "index": 23,
          "name": "Construction",
          "rank": 84822,
          "level": 99,
          "xp": 13043870
        }
      ],
      "activities": [
        {
          "index": 24,
          "name": "League Points",
          "rank": -1,
          "score": -1
        },
        {
          "index": 25,
          "name": "Bounty Hunter - Hunter",
          "rank": -1,
          "score": -1
        },
        {
          "index": 26,
          "name": "Bounty Hunter - Rogue",
          "rank": -1,
          "score": -1
        },
        {
          "index": 27,
          "name": "Clue Scrolls (all)",
          "rank": 137277,
          "score": 368
        },
        {
          "index": 28,
          "name": "Clue Scrolls (beginner)",
          "rank": 275718,
          "score": 13
        },
        {
          "index": 29,
          "name": "Clue Scrolls (easy)",
          "rank": 371817,
          "score": 13
        },
        {
          "index": 30,
          "name": "Clue Scrolls (medium)",
          "rank": 110468,
          "score": 130
        },
        {
          "index": 31,
          "name": "Clue Scrolls (hard)",
          "rank": 120227,
          "score": 164
        },
        {
          "index": 32,
          "name": "Clue Scrolls (elite)",
          "rank": 114451,
          "score": 33
        },
        {
          "index": 33,
          "name": "Clue Scrolls (master)",
          "rank": 112151,
          "score": 15
        },
        {
          "index": 34,
          "name": "LMS - Rank",
          "rank": -1,
          "score": -1
        },
        {
          "index": 35,
          "name": "PvP Arena - Rank",
          "rank": -1,
          "score": -1
        },
        {
          "index": 36,
          "name": "Soul Wars Zeal",
          "rank": -1,
          "score": -1
        },
        {
          "index": 37,
          "name": "Rifts closed",
          "rank": 160644,
          "score": 150
        },
        {
          "index": 38,
          "name": "Colosseum Glory",
          "rank": -1,
          "score": -1
        }
      ],
      "bosses": [
        {
          "index": 39,
          "name": "Abyssal Sire",
          "rank": 176214,
          "kills": 50
        },
        {
          "index": 40,
          "name": "Alchemical Hydra",
          "rank": 51284,
          "kills": 1132
        },
        {
          "index": 41,
          "name": "Artio",
          "rank": 42064,
          "kills": 95
        },
        {
          "index": 42,
          "name": "Barrows Chests",
          "rank": 21271,
          "kills": 1001
        },
        {
          "index": 43,
          "name": "Bryophyta",
          "rank": 173292,
          "kills": 6
        },
        {
          "index": 44,
          "name": "Callisto",
          "rank": 180260,
          "kills": 15
        },
        {
          "index": 45,
          "name": "Calvar'ion",
          "rank": 16424,
          "kills": 383
        },
        {
          "index": 46,
          "name": "Cerberus",
          "rank": 68463,
          "kills": 857
        },
        {
          "index": 47,
          "name": "Chambers of Xeric",
          "rank": 271695,
          "kills": 6
        },
        {
          "index": 48,
          "name": "Chambers of Xeric: Challenge Mode",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 49,
          "name": "Chaos Elemental",
          "rank": 13572,
          "kills": 302
        },
        {
          "index": 50,
          "name": "Chaos Fanatic",
          "rank": 165377,
          "kills": 25
        },
        {
          "index": 51,
          "name": "Commander Zilyana",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 52,
          "name": "Corporeal Beast",
          "rank": 10706,
          "kills": 700
        },
        {
          "index": 53,
          "name": "Crazy Archaeologist",
          "rank": 130060,
          "kills": 50
        },
        {
          "index": 54,
          "name": "Dagannoth Prime",
          "rank": 172193,
          "kills": 123
        },
        {
          "index": 55,
          "name": "Dagannoth Rex",
          "rank": 135929,
          "kills": 284
        },
        {
          "index": 56,
          "name": "Dagannoth Supreme",
          "rank": 163029,
          "kills": 135
        },
        {
          "index": 57,
          "name": "Deranged Archaeologist",
          "rank": 38531,
          "kills": 50
        },
        {
          "index": 58,
          "name": "Duke Sucellus",
          "rank": 92338,
          "kills": 9
        },
        {
          "index": 59,
          "name": "General Graardor",
          "rank": 29050,
          "kills": 1005
        },
        {
          "index": 60,
          "name": "Giant Mole",
          "rank": 262467,
          "kills": 50
        },
        {
          "index": 61,
          "name": "Grotesque Guardians",
          "rank": 196206,
          "kills": 50
        },
        {
          "index": 62,
          "name": "Hespori",
          "rank": 162041,
          "kills": 55
        },
        {
          "index": 63,
          "name": "Kalphite Queen",
          "rank": 119192,
          "kills": 96
        },
        {
          "index": 64,
          "name": "King Black Dragon",
          "rank": 383171,
          "kills": 52
        },
        {
          "index": 65,
          "name": "Kraken",
          "rank": 289442,
          "kills": 657
        },
        {
          "index": 66,
          "name": "Kree'Arra",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 67,
          "name": "K'ril Tsutsaroth",
          "rank": 135983,
          "kills": 62
        },
        {
          "index": 68,
          "name": "Lunar Chests",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 69,
          "name": "Mimic",
          "rank": 169975,
          "kills": 1
        },
        {
          "index": 70,
          "name": "Nex",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 71,
          "name": "Nightmare",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 72,
          "name": "Phosani's Nightmare",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 73,
          "name": "Obor",
          "rank": 244971,
          "kills": 5
        },
        {
          "index": 74,
          "name": "Phantom Muspah",
          "rank": 121078,
          "kills": 15
        },
        {
          "index": 75,
          "name": "Sarachnis",
          "rank": 117558,
          "kills": 64
        },
        {
          "index": 76,
          "name": "Scorpia",
          "rank": 126295,
          "kills": 25
        },
        {
          "index": 77,
          "name": "Scurrius",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 78,
          "name": "Skotizo",
          "rank": 71575,
          "kills": 44
        },
        {
          "index": 79,
          "name": "Sol Heredit",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 80,
          "name": "Spindel",
          "rank": 68909,
          "kills": 24
        },
        {
          "index": 81,
          "name": "Tempoross",
          "rank": 66670,
          "kills": 207
        },
        {
          "index": 82,
          "name": "The Gauntlet",
          "rank": 202182,
          "kills": 8
        },
        {
          "index": 83,
          "name": "The Corrupted Gauntlet",
          "rank": 93978,
          "kills": 169
        },
        {
          "index": 84,
          "name": "The Leviathan",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 85,
          "name": "The Whisperer",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 86,
          "name": "Theatre of Blood",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 87,
          "name": "Theatre of Blood: Hard Mode",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 88,
          "name": "Thermonuclear Smoke Devil",
          "rank": 224591,
          "kills": 33
        },
        {
          "index": 89,
          "name": "Tombs of Amascut",
          "rank": 122985,
          "kills": 28
        },
        {
          "index": 90,
          "name": "Tombs of Amascut: Expert Mode",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 91,
          "name": "TzKal-Zuk",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 92,
          "name": "TzTok-Jad",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 93,
          "name": "Vardorvis",
          "rank": 5120,
          "kills": 1729
        },
        {
          "index": 94,
          "name": "Venenatis",
          "rank": 119283,
          "kills": 41
        },
        {
          "index": 95,
          "name": "Vet'ion",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 96,
          "name": "Vorkath",
          "rank": 422614,
          "kills": 55
        },
        {
          "index": 97,
          "name": "Wintertodt",
          "rank": 6400,
          "kills": 1110
        },
        {
          "index": 98,
          "name": "Zalcano",
          "rank": 28848,
          "kills": 314
        },
        {
          "index": 99,
          "name": "Zulrah",
          "rank": 124869,
          "kills": 832
        }
      ]
    },
    "ironman": {
      "skills": [
        {
          "index": 0,
          "name": "Overall",
          "rank": 11550,
          "level": 2234,
          "xp": 348174290
        },
        {
          "index": 1,
          "name": "Attack",
          "rank": 13557,
          "level": 99,
          "xp": 18165013
        },
        {
          "index": 2,
          "name": "Defence",
          "rank": 11063,
          "level": 99,
          "xp": 17607175
        },
        {
          "index": 3,
          "name": "Strength",
          "rank": 10210,
          "level": 99,
          "xp": 30159842
        },
        {
          "index": 4,
          "name": "Hitpoints",
          "rank": 16683,
          "level": 99,
          "xp": 35143846
        },
        {
          "index": 5,
          "name": "Ranged",
          "rank": 28538,
          "level": 99,
          "xp": 21386833
        },
        {
          "index": 6,
          "name": "Prayer",
          "rank": 20498,
          "level": 90,
          "xp": 5401812
        },
        {
          "index": 7,
          "name": "Magic",
          "rank": 18137,
          "level": 99,
          "xp": 19418120
        },
        {
          "index": 8,
          "name": "Cooking",
          "rank": 20477,
          "level": 99,
          "xp": 13203772
        },
        {
          "index": 9,
          "name": "Woodcutting",
          "rank": 15136,
          "level": 99,
          "xp": 13214238
        },
        {
          "index": 10,
          "name": "Fletching",
          "rank": 13340,
          "level": 99,
          "xp": 13047461
        },
        {
          "index": 11,
          "name": "Fishing",
          "rank": 20356,
          "level": 99,
          "xp": 13038178
        },
        {
          "index": 12,
          "name": "Firemaking",
          "rank": 3418,
          "level": 99,
          "xp": 25683760
        },
        {
          "index": 13,
          "name": "Crafting",
          "rank": 17729,
          "level": 99,
          "xp": 13287331
        },
        {
          "index": 14,
          "name": "Smithing",
          "rank": 27137,
          "level": 89,
          "xp": 5017017
        },
        {
          "index": 15,
          "name": "Mining",
          "rank": 17672,
          "level": 99,
          "xp": 13034450
        },
        {
          "index": 16,
          "name": "Herblore",
          "rank": 19915,
          "level": 95,
          "xp": 9025172
        },
        {
          "index": 17,
          "name": "Agility",
          "rank": 15731,
          "level": 97,
          "xp": 11297935
        },
        {
          "index": 18,
          "name": "Thieving",
          "rank": 6491,
          "level": 99,
          "xp": 18153080
        },
        {
          "index": 19,
          "name": "Slayer",
          "rank": 29660,
          "level": 97,
          "xp": 11288256
        },
        {
          "index": 20,
          "name": "Farming",
          "rank": 26019,
          "level": 99,
          "xp": 14659094
        },
        {
          "index": 21,
          "name": "Runecraft",
          "rank": 29216,
          "level": 86,
          "xp": 3787146
        },
        {
          "index": 22,
          "name": "Hunter",
          "rank": 17478,
          "level": 96,
          "xp": 10110889
        },
        {
          "index": 23,
          "name": "Construction",
          "rank": 14441,
          "level": 99,
          "xp": 13043870
        }
      ],
      "activities": [
        {
          "index": 24,
          "name": "League Points",
          "rank": -1,
          "score": -1
        },
        {
          "index": 25,
          "name": "Bounty Hunter - Hunter",
          "rank": -1,
          "score": -1
        },
        {
          "index": 26,
          "name": "Bounty Hunter - Rogue",
          "rank": -1,
          "score": -1
        },
        {
          "index": 27,
          "name": "Clue Scrolls (all)",
          "rank": 41007,
          "score": 368
        },
        {
          "index": 28,
          "name": "Clue Scrolls (beginner)",
          "rank": 83774,
          "score": 13
        },
        {
          "index": 29,
          "name": "Clue Scrolls (easy)",
          "rank": 116215,
          "score": 13
        },
        {
          "index": 30,
          "name": "Clue Scrolls (medium)",
          "rank": 33839,
          "score": 130
        },
        {
          "index": 31,
          "name": "Clue Scrolls (hard)",
          "rank": 31435,
          "score": 164
        },
        {
          "index": 32,
          "name": "Clue Scrolls (elite)",
          "rank": 26475,
          "score": 33
        },
        {
          "index": 33,
          "name": "Clue Scrolls (master)",
          "rank": 17792,
          "score": 15
        },
        {
          "index": 34,
          "name": "LMS - Rank",
          "rank": -1,
          "score": -1
        },
        {
          "index": 35,
          "name": "PvP Arena - Rank",
          "rank": -1,
          "score": -1
        },
        {
          "index": 36,
          "name": "Soul Wars Zeal",
          "rank": -1,
          "score": -1
        },
        {
          "index": 37,
          "name": "Rifts closed",
          "rank": 42641,
          "score": 150
        },
        {
          "index": 38,
          "name": "Colosseum Glory",
          "rank": -1,
          "score": -1
        }
      ],
      "bosses": [
        {
          "index": 39,
          "name": "Abyssal Sire",
          "rank": 36071,
          "kills": 50
        },
        {
          "index": 40,
          "name": "Alchemical Hydra",
          "rank": 11604,
          "kills": 1132
        },
        {
          "index": 41,
          "name": "Artio",
          "rank": 11015,
          "kills": 95
        },
        {
          "index": 42,
          "name": "Barrows Chests",
          "rank": 9801,
          "kills": 1001
        },
        {
          "index": 43,
          "name": "Bryophyta",
          "rank": 27310,
          "kills": 6
        },
        {
          "index": 44,
          "name": "Callisto",
          "rank": 24694,
          "kills": 15
        },
        {
          "index": 45,
          "name": "Calvar'ion",
          "rank": 5123,
          "kills": 383
        },
        {
          "index": 46,
          "name": "Cerberus",
          "rank": 14227,
          "kills": 857
        },
        {
          "index": 47,
          "name": "Chambers of Xeric",
          "rank": 44224,
          "kills": 6
        },
        {
          "index": 48,
          "name": "Chambers of Xeric: Challenge Mode",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 49,
          "name": "Chaos Elemental",
          "rank": 2742,
          "kills": 302
        },
        {
          "index": 50,
          "name": "Chaos Fanatic",
          "rank": 26661,
          "kills": 25
        },
        {
          "index": 51,
          "name": "Commander Zilyana",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 52,
          "name": "Corporeal Beast",
          "rank": 2408,
          "kills": 700
        },
        {
          "index": 53,
          "name": "Crazy Archaeologist",
          "rank": 38672,
          "kills": 50
        },
        {
          "index": 54,
          "name": "Dagannoth Prime",
          "rank": 29890,
          "kills": 123
        },
        {
          "index": 55,
          "name": "Dagannoth Rex",
          "rank": 27423,
          "kills": 284
        },
        {
          "index": 56,
          "name": "Dagannoth Supreme",
          "rank": 28110,
          "kills": 135
        },
        {
          "index": 57,
          "name": "Deranged Archaeologist",
          "rank": 10216,
          "kills": 50
        },
        {
          "index": 58,
          "name": "Duke Sucellus",
          "rank": 14512,
          "kills": 9
        },
        {
          "index": 59,
          "name": "General Graardor",
          "rank": 5313,
          "kills": 1005
        },
        {
          "index": 60,
          "name": "Giant Mole",
          "rank": 32793,
          "kills": 50
        },
        {
          "index": 61,
          "name": "Grotesque Guardians",
          "rank": 24313,
          "kills": 50
        },
        {
          "index": 62,
          "name": "Hespori",
          "rank": 48329,
          "kills": 55
        },
        {
          "index": 63,
          "name": "Kalphite Queen",
          "rank": 22287,
          "kills": 96
        },
        {
          "index": 64,
          "name": "King Black Dragon",
          "rank": 31237,
          "kills": 52
        },
        {
          "index": 65,
          "name": "Kraken",
          "rank": 45091,
          "kills": 657
        },
        {
          "index": 66,
          "name": "Kree'Arra",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 67,
          "name": "K'ril Tsutsaroth",
          "rank": 36487,
          "kills": 62
        },
        {
          "index": 68,
          "name": "Lunar Chests",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 69,
          "name": "Mimic",
          "rank": 31175,
          "kills": 1
        },
        {
          "index": 70,
          "name": "Nex",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 71,
          "name": "Nightmare",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 72,
          "name": "Phosani's Nightmare",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 73,
          "name": "Obor",
          "rank": 35914,
          "kills": 5
        },
        {
          "index": 74,
          "name": "Phantom Muspah",
          "rank": 21396,
          "kills": 15
        },
        {
          "index": 75,
          "name": "Sarachnis",
          "rank": 23378,
          "kills": 64
        },
        {
          "index": 76,
          "name": "Scorpia",
          "rank": 18622,
          "kills": 25
        },
        {
          "index": 77,
          "name": "Scurrius",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 78,
          "name": "Skotizo",
          "rank": 14916,
          "kills": 44
        },
        {
          "index": 79,
          "name": "Sol Heredit",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 80,
          "name": "Spindel",
          "rank": 15989,
          "kills": 24
        },
        {
          "index": 81,
          "name": "Tempoross",
          "rank": 20934,
          "kills": 207
        },
        {
          "index": 82,
          "name": "The Gauntlet",
          "rank": 46319,
          "kills": 8
        },
        {
          "index": 83,
          "name": "The Corrupted Gauntlet",
          "rank": 39465,
          "kills": 169
        },
        {
          "index": 84,
          "name": "The Leviathan",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 85,
          "name": "The Whisperer",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 86,
          "name": "Theatre of Blood",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 87,
          "name": "Theatre of Blood: Hard Mode",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 88,
          "name": "Thermonuclear Smoke Devil",
          "rank": 39570,
          "kills": 33
        },
        {
          "index": 89,
          "name": "Tombs of Amascut",
          "rank": 22385,
          "kills": 28
        },
        {
          "index": 90,
          "name": "Tombs of Amascut: Expert Mode",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 91,
          "name": "TzKal-Zuk",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 92,
          "name": "TzTok-Jad",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 93,
          "name": "Vardorvis",
          "rank": 1103,
          "kills": 1729
        },
        {
          "index": 94,
          "name": "Venenatis",
          "rank": 18996,
          "kills": 41
        },
        {
          "index": 95,
          "name": "Vet'ion",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 96,
          "name": "Vorkath",
          "rank": 33135,
          "kills": 55
        },
        {
          "index": 97,
          "name": "Wintertodt",
          "rank": 2580,
          "kills": 1110
        },
        {
          "index": 98,
          "name": "Zalcano",
          "rank": 6083,
          "kills": 314
        },
        {
          "index": 99,
          "name": "Zulrah",
          "rank": 28526,
          "kills": 832
        }
      ]
    },
    "hardcore": {
      "skills": [
        {
          "index": 0,
          "name": "Overall",
          "rank": 262356,
          "level": 300,
          "xp": 1302582
        },
        {
          "index": 1,
          "name": "Attack",
          "rank": 440165,
          "level": 2,
          "xp": 116
        },
        {
          "index": 2,
          "name": "Defence",
          "rank": 513089,
          "level": 1,
          "xp": 0
        },
        {
          "index": 3,
          "name": "Strength",
          "rank": 527052,
          "level": 1,
          "xp": 12
        },
        {
          "index": 4,
          "name": "Hitpoints",
          "rank": 494345,
          "level": 10,
          "xp": 1219
        },
        {
          "index": 5,
          "name": "Ranged",
          "rank": 208689,
          "level": 2,
          "xp": 96
        },
        {
          "index": 6,
          "name": "Prayer",
          "rank": 299017,
          "level": 9,
          "xp": 1138
        },
        {
          "index": 7,
          "name": "Magic",
          "rank": 577975,
          "level": 1,
          "xp": 7
        },
        {
          "index": 8,
          "name": "Cooking",
          "rank": 502317,
          "level": 4,
          "xp": 370
        },
        {
          "index": 9,
          "name": "Woodcutting",
          "rank": 173828,
          "level": 51,
          "xp": 119486
        },
        {
          "index": 10,
          "name": "Fletching",
          "rank": 148026,
          "level": 38,
          "xp": 31414
        },
        {
          "index": 11,
          "name": "Fishing",
          "rank": 295367,
          "level": 24,
          "xp": 7185
        },
        {
          "index": 12,
          "name": "Firemaking",
          "rank": 130313,
          "level": 74,
          "xp": 1112892
        },
        {
          "index": 13,
          "name": "Crafting",
          "rank": 229819,
          "level": 8,
          "xp": 960
        },
        {
          "index": 14,
          "name": "Smithing",
          "rank": 515470,
          "level": 1,
          "xp": 18
        },
        {
          "index": 15,
          "name": "Mining",
          "rank": 322323,
          "level": 15,
          "xp": 2460
        },
        {
          "index": 16,
          "name": "Herblore",
          "rank": 370519,
          "level": 1,
          "xp": 0
        },
        {
          "index": 17,
          "name": "Agility",
          "rank": 268463,
          "level": 1,
          "xp": 10
        },
        {
          "index": 18,
          "name": "Thieving",
          "rank": 140947,
          "level": 34,
          "xp": 20744
        },
        {
          "index": 19,
          "name": "Slayer",
          "rank": 385473,
          "level": 1,
          "xp": 0
        },
        {
          "index": 20,
          "name": "Farming",
          "rank": 364509,
          "level": 1,
          "xp": 0
        },
        {
          "index": 21,
          "name": "Runecraft",
          "rank": 358764,
          "level": 1,
          "xp": 0
        },
        {
          "index": 22,
          "name": "Hunter",
          "rank": 371943,
          "level": 1,
          "xp": 0
        },
        {
          "index": 23,
          "name": "Construction",
          "rank": 135920,
          "level": 19,
          "xp": 4455
        }
      ],
      "activities": [
        {
          "index": 24,
          "name": "League Points",
          "rank": -1,
          "score": -1
        },
        {
          "index": 25,
          "name": "Bounty Hunter - Hunter",
          "rank": -1,
          "score": -1
        },
        {
          "index": 26,
          "name": "Bounty Hunter - Rogue",
          "rank": -1,
          "score": -1
        },
        {
          "index": 27,
          "name": "Clue Scrolls (all)",
          "rank": -1,
          "score": -1
        },
        {
          "index": 28,
          "name": "Clue Scrolls (beginner)",
          "rank": -1,
          "score": -1
        },
        {
          "index": 29,
          "name": "Clue Scrolls (easy)",
          "rank": -1,
          "score": -1
        },
        {
          "index": 30,
          "name": "Clue Scrolls (medium)",
          "rank": -1,
          "score": -1
        },
        {
          "index": 31,
          "name": "Clue Scrolls (hard)",
          "rank": -1,
          "score": -1
        },
        {
          "index": 32,
          "name": "Clue Scrolls (elite)",
          "rank": -1,
          "score": -1
        },
        {
          "index": 33,
          "name": "Clue Scrolls (master)",
          "rank": -1,
          "score": -1
        },
        {
          "index": 34,
          "name": "LMS - Rank",
          "rank": -1,
          "score": -1
        },
        {
          "index": 35,
          "name": "PvP Arena - Rank",
          "rank": -1,
          "score": -1
        },
        {
          "index": 36,
          "name": "Soul Wars Zeal",
          "rank": -1,
          "score": -1
        },
        {
          "index": 37,
          "name": "Rifts closed",
          "rank": -1,
          "score": -1
        },
        {
          "index": 38,
          "name": "Colosseum Glory",
          "rank": -1,
          "score": -1
        }
      ],
      "bosses": [
        {
          "index": 39,
          "name": "Abyssal Sire",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 40,
          "name": "Alchemical Hydra",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 41,
          "name": "Artio",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 42,
          "name": "Barrows Chests",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 43,
          "name": "Bryophyta",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 44,
          "name": "Callisto",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 45,
          "name": "Calvar'ion",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 46,
          "name": "Cerberus",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 47,
          "name": "Chambers of Xeric",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 48,
          "name": "Chambers of Xeric: Challenge Mode",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 49,
          "name": "Chaos Elemental",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 50,
          "name": "Chaos Fanatic",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 51,
          "name": "Commander Zilyana",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 52,
          "name": "Corporeal Beast",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 53,
          "name": "Crazy Archaeologist",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 54,
          "name": "Dagannoth Prime",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 55,
          "name": "Dagannoth Rex",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 56,
          "name": "Dagannoth Supreme",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 57,
          "name": "Deranged Archaeologist",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 58,
          "name": "Duke Sucellus",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 59,
          "name": "General Graardor",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 60,
          "name": "Giant Mole",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 61,
          "name": "Grotesque Guardians",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 62,
          "name": "Hespori",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 63,
          "name": "Kalphite Queen",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 64,
          "name": "King Black Dragon",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 65,
          "name": "Kraken",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 66,
          "name": "Kree'Arra",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 67,
          "name": "K'ril Tsutsaroth",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 68,
          "name": "Lunar Chests",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 69,
          "name": "Mimic",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 70,
          "name": "Nex",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 71,
          "name": "Nightmare",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 72,
          "name": "Phosani's Nightmare",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 73,
          "name": "Obor",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 74,
          "name": "Phantom Muspah",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 75,
          "name": "Sarachnis",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 76,
          "name": "Scorpia",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 77,
          "name": "Scurrius",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 78,
          "name": "Skotizo",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 79,
          "name": "Sol Heredit",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 80,
          "name": "Spindel",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 81,
          "name": "Tempoross",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 82,
          "name": "The Gauntlet",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 83,
          "name": "The Corrupted Gauntlet",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 84,
          "name": "The Leviathan",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 85,
          "name": "The Whisperer",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 86,
          "name": "Theatre of Blood",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 87,
          "name": "Theatre of Blood: Hard Mode",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 88,
          "name": "Thermonuclear Smoke Devil",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 89,
          "name": "Tombs of Amascut",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 90,
          "name": "Tombs of Amascut: Expert Mode",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 91,
          "name": "TzKal-Zuk",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 92,
          "name": "TzTok-Jad",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 93,
          "name": "Vardorvis",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 94,
          "name": "Venenatis",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 95,
          "name": "Vet'ion",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 96,
          "name": "Vorkath",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 97,
          "name": "Wintertodt",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 98,
          "name": "Zalcano",
          "rank": -1,
          "kills": -1
        },
        {
          "index": 99,
          "name": "Zulrah",
          "rank": -1,
          "kills": -1
        }
      ]
    },
    "ultimate": {
      "skills": [],
      "activities": [],
      "bosses": []
    }
  }
}
