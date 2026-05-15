// CASES catalog. Loaded by index2.html before app.js.
// Exposes window.CASES (array) and window.IC (icon shortcuts).
// To add a case: add an entry to CASES below AND mirror it in samptonweb/worker.js (CASES = { ... }) with short prop names (n, r, v).
// Rarity tiers: consumer, industrial, milspec, restricted, classified, covert, chroma, legendary.

(function(){
  const IC={pistol:"\uD83D\uDD2B",knife:"\uD83D\uDD2A",rifle:"\uD83C\uDFF9",shield:"\uD83D\uDEE1\uFE0F",gem:"\uD83D\uDC8E",fire:"\uD83D\uDD25",bolt:"\u26A1",skull:"\uD83D\uDC80",star:"\u2B50",crown:"\uD83D\uDC51",sword:"\u2694\uFE0F",bomb:"\uD83D\uDCA3",crystal:"\uD83D\uDD2E",rocket:"\uD83D\uDE80",snake:"\uD83D\uDC0D",dragon:"\uD83D\uDC09",eye:"\uD83D\uDC41\uFE0F",rose:"\uD83C\uDF39",moon:"\uD83C\uDF19",comet:"\u2604\uFE0F",chain:"\u26D3\uFE0F",ring:"\uD83D\uDC8D",trophy:"\uD83C\uDFC6",wolf:"\uD83D\uDC3A",octopus:"\uD83D\uDC19",gear:"\u2699\uFE0F",anchor:"\u2693",leaf:"\uD83C\uDF43",tornado:"\uD83C\uDF2A\uFE0F",snowflake:"\u2744\uFE0F"};

  const CASES=[
    {id:"scrap",name:"Scrap Box",price:30,color:"#78716c",icon:"\uD83D\uDDD1\uFE0F",items:[{name:"Rust Bucket",rarity:"consumer",value:3,icon:IC.gear},{name:"Tin Foil",rarity:"consumer",value:5,icon:IC.shield},{name:"Bent Nail",rarity:"consumer",value:8,icon:IC.chain},{name:"Duct Tape",rarity:"consumer",value:10,icon:IC.gear},{name:"Scrap Metal",rarity:"consumer",value:14,icon:IC.anchor},{name:"Copper Tube",rarity:"industrial",value:28,icon:IC.bolt},{name:"Old Spring",rarity:"industrial",value:38,icon:IC.gear},{name:"Silver Screw",rarity:"milspec",value:80,icon:IC.crystal},{name:"Brass Fitting",rarity:"restricted",value:180,icon:IC.gem},{name:"Gold Wire",rarity:"classified",value:450,icon:IC.ring},{name:"Platinum Shard",rarity:"covert",value:1200,icon:IC.gem},{name:"\u2605 Wrench",rarity:"chroma",value:4000,icon:IC.knife}]},
    {id:"worn",name:"Worn Case",price:75,color:"#6b7280",icon:"\uD83D\uDCE6",items:[{name:"Sand Dune",rarity:"consumer",value:8,icon:IC.pistol},{name:"Storm",rarity:"consumer",value:12,icon:IC.bolt},{name:"Mudder",rarity:"consumer",value:16,icon:IC.shield},{name:"Scorched",rarity:"consumer",value:22,icon:IC.fire},{name:"Predator",rarity:"industrial",value:45,icon:IC.skull},{name:"Blue Spruce",rarity:"industrial",value:60,icon:IC.crystal},{name:"Abyss",rarity:"milspec",value:130,icon:IC.eye},{name:"Oxide Blaze",rarity:"milspec",value:175,icon:IC.fire},{name:"Crimson Kimono",rarity:"restricted",value:340,icon:IC.rose},{name:"Night Stripe",rarity:"classified",value:780,icon:IC.moon},{name:"Slate",rarity:"covert",value:2000,icon:IC.gem},{name:"\u2605 Shadow Daggers",rarity:"chroma",value:7500,icon:IC.knife}]},
    {id:"militia",name:"Militia Case",price:120,color:"#65a30d",icon:"\uD83C\uDF92",items:[{name:"Dry Season",rarity:"consumer",value:12,icon:IC.leaf},{name:"Buckshot",rarity:"consumer",value:20,icon:IC.bomb},{name:"Warbird",rarity:"consumer",value:28,icon:IC.shield},{name:"Copperhead",rarity:"consumer",value:34,icon:IC.snake},{name:"Mako",rarity:"industrial",value:70,icon:IC.bolt},{name:"Jackal",rarity:"industrial",value:95,icon:IC.wolf},{name:"Rattler",rarity:"milspec",value:210,icon:IC.snake},{name:"Torque",rarity:"milspec",value:280,icon:IC.chain},{name:"Basilisk",rarity:"restricted",value:580,icon:IC.eye},{name:"Nightfall",rarity:"classified",value:1300,icon:IC.moon},{name:"Venom Strike",rarity:"covert",value:3200,icon:IC.snake},{name:"\u2605 Gut Knife",rarity:"chroma",value:11000,icon:IC.knife}]},
    {id:"standard",name:"Armory Case",price:250,color:"#3b82f6",icon:"\uD83E\uDDF0",items:[{name:"Groundwater",rarity:"consumer",value:25,icon:IC.pistol},{name:"Shag",rarity:"consumer",value:38,icon:IC.shield},{name:"Urban DDPAT",rarity:"consumer",value:45,icon:IC.rifle},{name:"Stained",rarity:"industrial",value:85,icon:IC.knife},{name:"Brass",rarity:"industrial",value:125,icon:IC.bolt},{name:"Cobalt Halftone",rarity:"milspec",value:320,icon:IC.crystal},{name:"Pulse",rarity:"milspec",value:420,icon:IC.bolt},{name:"Asiimov",rarity:"restricted",value:950,icon:IC.rocket},{name:"Hyperbeast",rarity:"classified",value:2300,icon:IC.dragon},{name:"Dragon Lore",rarity:"covert",value:6500,icon:IC.dragon},{name:"\u2605 Butterfly Knife",rarity:"chroma",value:28000,icon:IC.knife}]},
    {id:"hazard",name:"Hazard Case",price:400,color:"#f97316",icon:"\u2622\uFE0F",items:[{name:"Reactor",rarity:"consumer",value:42,icon:IC.bolt},{name:"Fallout",rarity:"consumer",value:58,icon:IC.bomb},{name:"Toxin",rarity:"consumer",value:68,icon:IC.skull},{name:"Meltdown",rarity:"industrial",value:140,icon:IC.fire},{name:"Corroded",rarity:"industrial",value:190,icon:IC.chain},{name:"Radiant",rarity:"milspec",value:420,icon:IC.crystal},{name:"Isotope",rarity:"milspec",value:580,icon:IC.gem},{name:"Biohazard",rarity:"restricted",value:1500,icon:IC.skull},{name:"Chernobyl",rarity:"classified",value:3400,icon:IC.fire},{name:"Plutonium",rarity:"covert",value:11000,icon:IC.comet},{name:"\u2605 Bayonet Tiger Tooth",rarity:"chroma",value:38000,icon:IC.knife}]},
    {id:"frost",name:"Frost Case",price:500,color:"#67e8f9",icon:"\u2744\uFE0F",items:[{name:"Icicle",rarity:"consumer",value:50,icon:IC.snowflake},{name:"Permafrost",rarity:"consumer",value:65,icon:IC.snowflake},{name:"Glacier",rarity:"consumer",value:80,icon:IC.crystal},{name:"Avalanche",rarity:"industrial",value:160,icon:IC.tornado},{name:"Tundra",rarity:"industrial",value:220,icon:IC.snowflake},{name:"Frostbite",rarity:"milspec",value:480,icon:IC.skull},{name:"Ice Queen",rarity:"milspec",value:650,icon:IC.crown},{name:"Blizzard",rarity:"restricted",value:1700,icon:IC.tornado},{name:"Absolute Zero",rarity:"classified",value:4000,icon:IC.crystal},{name:"Sub-Zero",rarity:"covert",value:13000,icon:IC.gem},{name:"\u2605 Huntsman Knife Ice",rarity:"chroma",value:45000,icon:IC.knife}]},
    {id:"prisma",name:"Prisma Case",price:700,color:"#8b5cf6",icon:"\uD83D\uDD6E",items:[{name:"Candy Apple",rarity:"consumer",value:55,icon:IC.pistol},{name:"Ossuary",rarity:"consumer",value:75,icon:IC.skull},{name:"Pole Position",rarity:"industrial",value:160,icon:IC.rocket},{name:"Tigris",rarity:"industrial",value:220,icon:IC.eye},{name:"Neon Rider",rarity:"milspec",value:520,icon:IC.bolt},{name:"Bloodsport",rarity:"milspec",value:740,icon:IC.fire},{name:"Phantom Disruptor",rarity:"restricted",value:1900,icon:IC.crystal},{name:"Printstream",rarity:"classified",value:4800,icon:IC.gem},{name:"Wild Lotus",rarity:"covert",value:16000,icon:IC.rose},{name:"\u2605 Karambit Fade",rarity:"chroma",value:65000,icon:IC.knife}]},
    {id:"shadow",name:"Shadow Case",price:1200,color:"#334155",icon:"\uD83C\uDF11",items:[{name:"Eclipse",rarity:"consumer",value:90,icon:IC.moon},{name:"Umbra",rarity:"consumer",value:120,icon:IC.eye},{name:"Wraith",rarity:"consumer",value:150,icon:IC.skull},{name:"Phantom",rarity:"industrial",value:300,icon:IC.crystal},{name:"Shade",rarity:"industrial",value:400,icon:IC.moon},{name:"Reaper",rarity:"milspec",value:850,icon:IC.skull},{name:"Void Walker",rarity:"milspec",value:1150,icon:IC.eye},{name:"Oblivion",rarity:"restricted",value:3200,icon:IC.comet},{name:"Abyss Lord",rarity:"classified",value:8500,icon:IC.dragon},{name:"Nyx",rarity:"covert",value:28000,icon:IC.crown},{name:"\u2605 Flip Knife Marble Fade",rarity:"chroma",value:85000,icon:IC.knife}]},
    {id:"deep",name:"Deep Sea Case",price:1600,color:"#0e7490",icon:"\uD83C\uDF0A",items:[{name:"Barnacle",rarity:"consumer",value:110,icon:IC.anchor},{name:"Kelp",rarity:"consumer",value:150,icon:IC.leaf},{name:"Coral",rarity:"consumer",value:190,icon:IC.rose},{name:"Anglerfish",rarity:"industrial",value:400,icon:IC.eye},{name:"Trident",rarity:"industrial",value:550,icon:IC.sword},{name:"Kraken",rarity:"milspec",value:1100,icon:IC.octopus},{name:"Leviathan",rarity:"milspec",value:1500,icon:IC.dragon},{name:"Maelstrom",rarity:"restricted",value:4200,icon:IC.tornado},{name:"Abyss Pearl",rarity:"classified",value:11000,icon:IC.gem},{name:"Poseidon",rarity:"covert",value:35000,icon:IC.crown},{name:"\u2605 Talon Knife Sapphire",rarity:"chroma",value:100000,icon:IC.knife}]},
    {id:"elite",name:"Classified Case",price:2500,color:"#ef4444",icon:"\uD83D\uDCBC",items:[{name:"Chalice",rarity:"consumer",value:160,icon:IC.gem},{name:"Blaze",rarity:"consumer",value:220,icon:IC.fire},{name:"Whiteout",rarity:"industrial",value:500,icon:IC.crystal},{name:"X-Ray",rarity:"industrial",value:700,icon:IC.eye},{name:"Fever Dream",rarity:"milspec",value:1400,icon:IC.rose},{name:"Neo-Noir",rarity:"milspec",value:1800,icon:IC.moon},{name:"Vulcan",rarity:"restricted",value:4500,icon:IC.bolt},{name:"Fire Serpent",rarity:"classified",value:14000,icon:IC.snake},{name:"Howl",rarity:"covert",value:45000,icon:IC.dragon},{name:"\u2605 M9 Crimson Web",rarity:"chroma",value:160000,icon:IC.knife}]},
    {id:"titan",name:"Titan Case",price:5000,color:"#fbbf24",icon:"\uD83C\uDFC6",items:[{name:"Gilded",rarity:"consumer",value:350,icon:IC.crown},{name:"Overture",rarity:"consumer",value:500,icon:IC.star},{name:"Monolith",rarity:"consumer",value:650,icon:IC.shield},{name:"Sovereign",rarity:"industrial",value:1400,icon:IC.ring},{name:"Titan Bore",rarity:"industrial",value:2000,icon:IC.rocket},{name:"Mjolnir",rarity:"milspec",value:4500,icon:IC.bolt},{name:"Excalibur",rarity:"milspec",value:6500,icon:IC.sword},{name:"Godslayer",rarity:"restricted",value:16000,icon:IC.skull},{name:"Ragnarok",rarity:"classified",value:45000,icon:IC.comet},{name:"Infinity",rarity:"covert",value:130000,icon:IC.star},{name:"\u2605 Karambit Sapphire",rarity:"chroma",value:500000,icon:IC.knife}]},
    {id:"void",name:"Void Case",price:10000,color:"#7c3aed",icon:"\uD83C\uDF0C",items:[{name:"Dark Matter",rarity:"consumer",value:600,icon:IC.crystal},{name:"Singularity",rarity:"consumer",value:850,icon:IC.eye},{name:"Event Horizon",rarity:"consumer",value:1100,icon:IC.comet},{name:"Neutron Star",rarity:"industrial",value:2500,icon:IC.star},{name:"Quasar",rarity:"industrial",value:3800,icon:IC.bolt},{name:"Pulsar",rarity:"milspec",value:8000,icon:IC.bolt},{name:"Nebula Core",rarity:"milspec",value:12000,icon:IC.crystal},{name:"Supernova",rarity:"restricted",value:30000,icon:IC.fire},{name:"Black Hole",rarity:"classified",value:80000,icon:IC.skull},{name:"Big Bang",rarity:"covert",value:250000,icon:IC.comet},{name:"\u2605 Skeleton Knife Ruby",rarity:"chroma",value:1000000,icon:IC.knife}]},
    {id:"royal",name:"Royal Case",price:50000,color:"#ffd700",icon:"\uD83D\uDC51",items:[{name:"Crown Jewel",rarity:"consumer",value:3200,icon:IC.gem},{name:"Regal Scepter",rarity:"consumer",value:4500,icon:IC.sword},{name:"Golden Throne",rarity:"consumer",value:6000,icon:IC.crown},{name:"Royal Guard",rarity:"industrial",value:14000,icon:IC.shield},{name:"King Cobra",rarity:"industrial",value:20000,icon:IC.snake},{name:"Imperial Eagle",rarity:"milspec",value:45000,icon:IC.star},{name:"Coronation",rarity:"milspec",value:65000,icon:IC.crown},{name:"Sovereign Will",rarity:"restricted",value:160000,icon:IC.ring},{name:"Dynasty",rarity:"classified",value:400000,icon:IC.dragon},{name:"Emperor",rarity:"covert",value:1200000,icon:IC.crown},{name:"\u2605 Karambit Black Pearl",rarity:"chroma",value:5000000,icon:IC.knife}]},
    {id:"apex",name:"Apex Case",price:100000,color:"#dc2626",icon:"\uD83D\uDD25",items:[{name:"Titanium Core",rarity:"consumer",value:6500,icon:IC.shield},{name:"Zenith Plate",rarity:"consumer",value:9000,icon:IC.crystal},{name:"Apex Predator",rarity:"consumer",value:12000,icon:IC.skull},{name:"Warlord",rarity:"industrial",value:28000,icon:IC.sword},{name:"Overlord",rarity:"industrial",value:42000,icon:IC.crown},{name:"Annihilator",rarity:"milspec",value:90000,icon:IC.bomb},{name:"Doomsday",rarity:"milspec",value:130000,icon:IC.comet},{name:"Armageddon",rarity:"restricted",value:320000,icon:IC.fire},{name:"World Ender",rarity:"classified",value:800000,icon:IC.dragon},{name:"God Particle",rarity:"covert",value:2500000,icon:IC.star},{name:"\u2605 Bayonet Emerald",rarity:"chroma",value:10000000,icon:IC.knife}]},
    {id:"divine",name:"Divine Case",price:1000000,color:"#f0e68c",icon:"\u2728",items:[{name:"Mortal Coin",rarity:"consumer",value:65000,icon:IC.ring},{name:"Angel Tear",rarity:"consumer",value:90000,icon:IC.crystal},{name:"Holy Grail",rarity:"consumer",value:120000,icon:IC.gem},{name:"Seraph Wing",rarity:"industrial",value:280000,icon:IC.star},{name:"Cherub Crown",rarity:"industrial",value:420000,icon:IC.crown},{name:"Archangel",rarity:"milspec",value:900000,icon:IC.sword},{name:"Genesis",rarity:"milspec",value:1300000,icon:IC.comet},{name:"Rapture",rarity:"restricted",value:3200000,icon:IC.fire},{name:"Ascension",rarity:"classified",value:8000000,icon:IC.dragon},{name:"Divine Wrath",rarity:"covert",value:25000000,icon:IC.crown},{name:"\u2605 The Forbidden One",rarity:"legendary",value:100000000,icon:IC.trophy}]},
    // Epstein: ADDED chroma tier "★ The Smoking Gun"
    {id:"epstein",name:"Epstein Island",price:50000000,color:"#8b6914",icon:"🏝️",items:[{name:"Denied Entry",rarity:"consumer",value:3000000,icon:IC.shield},{name:"Wrong Island",rarity:"consumer",value:4000000,icon:IC.anchor},{name:"Boat Sank",rarity:"consumer",value:5000000,icon:IC.anchor},{name:"Caught by Locals",rarity:"consumer",value:6500000,icon:IC.eye},{name:"Caught by Police",rarity:"consumer",value:8000000,icon:IC.bolt},{name:"Caught by Guards",rarity:"consumer",value:10000000,icon:IC.skull},{name:"Paparazzi Shot",rarity:"consumer",value:12000000,icon:IC.eye},{name:"Saw the Beach",rarity:"industrial",value:20000000,icon:IC.leaf},{name:"Saw the Homes",rarity:"industrial",value:25000000,icon:IC.crown},{name:"Inside the Villa",rarity:"industrial",value:30000000,icon:IC.gem},{name:"The Guest List",rarity:"milspec",value:50000000,icon:IC.ring},{name:"Flight Log Entry",rarity:"milspec",value:65000000,icon:IC.rocket},{name:"Elon at the Party",rarity:"restricted",value:120000000,icon:IC.bolt},{name:"Prince Andrew Photo",rarity:"restricted",value:160000000,icon:IC.crown},{name:"Clinton on the Island",rarity:"classified",value:350000000,icon:IC.skull},{name:"The Black Book",rarity:"classified",value:500000000,icon:IC.eye},{name:"The Church",rarity:"covert",value:1500000000,icon:IC.crystal},{name:"Invitation from Jeffrey",rarity:"covert",value:2500000000,icon:IC.gem},{name:"\u2605 The Smoking Gun",rarity:"chroma",value:5000000000,icon:IC.pistol},{name:"The Full Truth",rarity:"legendary",value:10000000000,icon:IC.trophy},{name:"Epstein Didnt Off Himself",rarity:"legendary",value:25000000000,icon:IC.trophy}]},
    {id:"sixtyseven",name:"67 Case",price:1000,color:"#ff6767",icon:"\uD83C\uDFB0",items:[{name:"Brainrot Kid",rarity:"consumer",value:12,icon:IC.skull},{name:"Skibidi Toilet",rarity:"consumer",value:25,icon:IC.bomb},{name:"Rizz Permit",rarity:"consumer",value:40,icon:IC.gear},{name:"Gyatt Certificate",rarity:"consumer",value:55,icon:IC.star},{name:"Sigma Stare",rarity:"consumer",value:67,icon:IC.eye},{name:"Azizbek",rarity:"industrial",value:120,icon:IC.crown},{name:"Ohio Final Boss",rarity:"industrial",value:180,icon:IC.dragon},{name:"Fanum Tax Receipt",rarity:"milspec",value:400,icon:IC.ring},{name:"Chroma from Wish",rarity:"milspec",value:650,icon:IC.crystal},{name:"Jeffrey Library Card",rarity:"restricted",value:1500,icon:IC.bomb},{name:"Diddy Party Invite",rarity:"restricted",value:2200,icon:IC.rose},{name:"Jeffrey Epstein",rarity:"classified",value:6700,icon:IC.skull},{name:"Sigma boy, gg you diddy.",rarity:"covert",value:16700,icon:IC.trophy},{name:"67",rarity:"legendary",value:167000,icon:IC.trophy}]},

    // ============ 5 NEW CASES ============

    // 1. Rail enthusiast case — Swedish railway theme
    {id:"rail",name:"Trafikverket Crate",price:850,color:"#dc2626",icon:"\uD83D\uDE82",items:[
      {name:"Spårhalt Sign",rarity:"consumer",value:60,icon:IC.shield},
      {name:"Pendeltåg Schedule",rarity:"consumer",value:90,icon:IC.gear},
      {name:"Spår 1 Bell",rarity:"consumer",value:120,icon:IC.bolt},
      {name:"Conductor Whistle",rarity:"consumer",value:160,icon:IC.bolt},
      {name:"ATC Module",rarity:"industrial",value:300,icon:IC.crystal},
      {name:"Signal Box Key",rarity:"industrial",value:420,icon:IC.ring},
      {name:"X60 Door Panel",rarity:"milspec",value:850,icon:IC.shield},
      {name:"Stationmaster Cap",rarity:"milspec",value:1200,icon:IC.crown},
      {name:"Trafikverket Manual",rarity:"restricted",value:2600,icon:IC.eye},
      {name:"Stockholm C Master Key",rarity:"classified",value:7000,icon:IC.ring},
      {name:"Gröna Tåget Prototype",rarity:"covert",value:22000,icon:IC.rocket},
      {name:"\u2605 Last X2000 Brake Lever",rarity:"chroma",value:90000,icon:IC.knife}
    ]},

    // 2. Cyber/neon case
    {id:"neon",name:"Neon City",price:1800,color:"#06b6d4",icon:"\uD83C\uDF06",items:[
      {name:"Holo Sticker",rarity:"consumer",value:140,icon:IC.crystal},
      {name:"LED Strip",rarity:"consumer",value:200,icon:IC.bolt},
      {name:"Glitch Glove",rarity:"consumer",value:260,icon:IC.shield},
      {name:"Synth Visor",rarity:"industrial",value:520,icon:IC.eye},
      {name:"Neon Wires",rarity:"industrial",value:720,icon:IC.bolt},
      {name:"Cyber Katana",rarity:"milspec",value:1500,icon:IC.sword},
      {name:"Vapor Mask",rarity:"milspec",value:2000,icon:IC.skull},
      {name:"Augmented Eye",rarity:"restricted",value:4800,icon:IC.eye},
      {name:"Backalley Mod",rarity:"classified",value:13000,icon:IC.gem},
      {name:"Megacorp Override",rarity:"covert",value:42000,icon:IC.crown},
      {name:"\u2605 Cyberblade Prototype",rarity:"chroma",value:140000,icon:IC.knife}
    ]},

    // 3. Mythic creature case
    {id:"mythic",name:"Mythic Beasts",price:3500,color:"#a855f7",icon:"\uD83D\uDC32",items:[
      {name:"Goblin Tooth",rarity:"consumer",value:280,icon:IC.skull},
      {name:"Pixie Dust",rarity:"consumer",value:380,icon:IC.crystal},
      {name:"Centaur Hair",rarity:"consumer",value:500,icon:IC.shield},
      {name:"Griffin Feather",rarity:"industrial",value:980,icon:IC.star},
      {name:"Werewolf Pelt",rarity:"industrial",value:1300,icon:IC.wolf},
      {name:"Hydra Scale",rarity:"milspec",value:2700,icon:IC.dragon},
      {name:"Manticore Stinger",rarity:"milspec",value:3800,icon:IC.bolt},
      {name:"Basilisk Eye",rarity:"restricted",value:9500,icon:IC.eye},
      {name:"Phoenix Feather",rarity:"classified",value:24000,icon:IC.fire},
      {name:"Cerberus Fang",rarity:"covert",value:75000,icon:IC.skull},
      {name:"\u2605 Dragon Heart",rarity:"chroma",value:280000,icon:IC.dragon}
    ]},

    // 4. Cursed/horror case
    {id:"cursed",name:"Cursed Vault",price:7500,color:"#7e22ce",icon:"\uD83D\uDC80",items:[
      {name:"Cracked Mirror",rarity:"consumer",value:600,icon:IC.crystal},
      {name:"Old Doll Hand",rarity:"consumer",value:850,icon:IC.skull},
      {name:"Bloodied Letter",rarity:"consumer",value:1100,icon:IC.eye},
      {name:"Whispering Ring",rarity:"industrial",value:2200,icon:IC.ring},
      {name:"Withered Rose",rarity:"industrial",value:3000,icon:IC.rose},
      {name:"Possessed Music Box",rarity:"milspec",value:6500,icon:IC.bolt},
      {name:"Bound Tome",rarity:"milspec",value:9000,icon:IC.eye},
      {name:"Soul Lantern",rarity:"restricted",value:22000,icon:IC.fire},
      {name:"Black Veil",rarity:"classified",value:58000,icon:IC.skull},
      {name:"Necronomicon Page",rarity:"covert",value:180000,icon:IC.crown},
      {name:"\u2605 Reaper's Scythe",rarity:"chroma",value:650000,icon:IC.sword}
    ]},

    // 5. Time travel case
    {id:"chronos",name:"Chronos Vault",price:25000,color:"#eab308",icon:"\u23F3",items:[
      {name:"Stopped Watch",rarity:"consumer",value:2000,icon:IC.gear},
      {name:"Hourglass Sand",rarity:"consumer",value:2800,icon:IC.crystal},
      {name:"Pocket Sundial",rarity:"consumer",value:3600,icon:IC.star},
      {name:"Roman Coin",rarity:"industrial",value:7500,icon:IC.ring},
      {name:"Viking Rune",rarity:"industrial",value:10000,icon:IC.gem},
      {name:"Pharaoh Mask",rarity:"milspec",value:22000,icon:IC.crown},
      {name:"Knight's Helm",rarity:"milspec",value:30000,icon:IC.shield},
      {name:"DeLorean Key",rarity:"restricted",value:72000,icon:IC.rocket},
      {name:"H.G. Wells Manuscript",rarity:"classified",value:190000,icon:IC.eye},
      {name:"Tesla's Notebook",rarity:"covert",value:600000,icon:IC.bolt},
      {name:"\u2605 Chronometer Prime",rarity:"chroma",value:2200000,icon:IC.comet}
    ]}
  ];

  window.IC = IC;
  window.CASES = CASES;
})();
