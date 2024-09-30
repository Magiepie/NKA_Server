const WebSocket = require('ws');

const port = 24247; 
const wss = new WebSocket.Server({ port });
console.log(`WebSocket server started on ws://localhost:${port}`);

const clients = new Set();
let clientIdCounter = 1; 

wss.on('connection', (ws) => {
    // Assign a unique ID to the connected client
    ws.id = clientIdCounter++;
    ws.username = getRandomName() //`Client${ws.id}`;  // Default name, can be set later /setname client side
    clients.add(ws);  // Add the new client to the set
    console.log(`Client ${ws.id} connected`);

    const newClientMessage = Buffer.from(`${ws.username}`);
    broadcastBinaryMessage(ws, 1, newClientMessage); // Assuming message type `1` for connection notifications

    ws.on('message', (data) => {
            console.log(`Received binary ${ws.username}:`, data);

            const messageType = data.readUInt8(0); // Read the first byte (command type)
            const messageBody = data.slice(1); // Get the rest of the data
            switch(messageType){
                case 1:
                    let oldname = ws.username
                   // ws.username = messageBody.toString('utf8');
                    const nameupdatemsg = Buffer.from(`_${oldname} _is changing name to: ${ws.username}`);
                    broadcastBinaryMessage(ws, 2, nameupdatemsg); 
                break;
                case 2:
                    handleBinaryMessage(ws, messageType, messageBody);
                break;
                default:
                    console.log(`Received mmessageType: ${messageBody}`)
                break;
            }
    });

    ws.on('close', () => {
        console.log(`Client ${ws.id} (${ws.username}) disconnected`);
        const disconnectMessage = Buffer.from(`${ws.username} has disconnected.`);
        broadcastBinaryMessage(ws, 2, disconnectMessage); // Assuming message type `1` for disconnection notifications
  
        clients.delete(ws); 
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error with Client ${ws.id}: ${error.message}`);
        clients.delete(ws); 
    });
});

function handleBinaryMessage(client, messageType, messageBody) {
    switch (messageType) {
        case 2: // chat message
            const playerNameLength = messageBody.readUInt8(0);
            const playerName = messageBody.slice(1, 1 + playerNameLength).toString('utf8');
            const chatMessageLength = messageBody.readUInt16BE(1 + playerNameLength);
            const chatMessage = messageBody.slice(1 + playerNameLength + 2, 1 + playerNameLength + 2 + chatMessageLength).toString('utf8');
            
            console.log(`Player ${playerName} says: ${chatMessage}`);
            
            broadcastBinaryMessage(client, messageType, messageBody);
            break;

        case 3: // player coordinates
            const x = messageBody.readFloatBE(0);
            const y = messageBody.readFloatBE(4);
            console.log(`Received coordinates from ${client.username}: (${x}, ${y})`);
            
            // Optionally update the server state, or just broadcast to other clients
            broadcastBinaryMessage(client, messageType, messageBody);
            break;

        default:
            console.log(`Unknown binary message type: ${messageType}`);
            break;
    }
}

// Function to broadcast binary messages to all clients
function broadcastBinaryMessage(sender, messageType, messageBody) {
    clients.forEach((client) => {
        if ( client.readyState === WebSocket.OPEN) {
            const fullMessage = Buffer.concat([Buffer.from([messageType]), messageBody]);
            client.send(fullMessage);
        }
    });
}

function getRandomName() {
    const randomIndex = Math.floor(Math.random() * names.length);
    return names[randomIndex];
}

const names = [
    "NoobSlayer", "CouchPotato", "LaughTillUPee", "OopsIDidItAgain", "MisterTickles",
    "BananaPeel", "PranksterParadise", "GiggleGoblin", "ChucklesTheClown", "FartyPants",
    "silly sausage", "ComicSans", "BellyLaughs", "Punster", "JollyJester", "KneeSlapper",
    "Goofball", "WhoopeeCushion", "ClownAround", "TicklishTaco", "MemeMachine",
    "Jokester", "HahaHooligan", "GigglyPuff", "LOLerCoaster", "SillyGoose", "GuffawGuru",
    "BazingaBoy", "ChuckleBerry", "SnortSnarf", "FrostByte", "NightHawk", "BladeRunner",
    "ShadowPhantom", "IceBerg", "StealthBomber", "DarkMatter", "SilverSurfer", "QuantumLeap",
    "NeonFlash", "BlackMamba", "CyberPunk", "SkyWalker", "IronClad", "CoolWhip", "BlueMoon",
    "WinterWolf", "Maverick", "ThunderStrike", "IceBreaker", "StormChaser", "ChillFactor",
    "DeepFreeze", "Zenith", "Silverback", "FrostFire", "PhantomStrike", "TitanFall",
    "StarLord", "polar vortex", "CaesarSword", "PlatoPhilosopher", "Cleopatra queen",
    "DaVinciCode", "ShakespeareQuill", "JoanOfArc", "Churchill", "LincolnLog", "GenghisKhan",
    "NeroFlame", "SocratesMind", "TeslaCoil", "DarwinEvolve", "Einsteinium", "KingTut",
    "AlexanderGreat", "NapoleonComplex", "MarieCurie", "Freudian slip", "VikingRaider",
    "SamuraiSoul", "BeethovenRhapsody", "HannibalTactic", "SpartacusRebel", "GalileoStar",
    "MachiavelliPrince", "PicassoBrush", "MozartMagic", "Columbus1492", "MagellanExplorer",
    "StarShooter", "MegaMind", "ThunderGod", "InfinitePower", "BlazeKing", "GalacticGuardian",
    "QuantumSurfer", "MysticMarauder", "SolarSorcerer", "RiftRider", "NeonNinja",
    "UltimateWarrior", "AbyssWatcher", "TerraTamer", "PhantomPharaoh", "CosmicCrusader",
    "TitanTerror", "OmegaOrbit", "SkySlicer", "QuantumQueen", "StellarSage", "VoidVoyager",
    "SolarSentinel", "NightNavigator", "InfiniteIllusionist", "LunarLancer",
    "CelestialChampion", "GalacticGladiator", "PhantomPilot", "TerraTitan", "EliteEnforcer",
    "PrimePilot", "BeatBuster", "RiffRanger", "MelodyMaven", "BassBlaster", "DrumlineDevil",
    "EchoChamber", "TempoMaster", "LyricLegend", "SymphonySeeker", "VinylVoyager",
    "HarmonyHero", "NoteNinja", "ChordCrafter", "TuneTracker", "PitchPerfect",
    "OperaOverlord", "JazzJuggler", "DiscoDancer", "PopPioneer", "RockRuler", "SoulSurfer",
    "ElectroEnthusiast", "IndieIcon", "HipHopHerald", "ClassicChamp", "RhythmRogue",
    "GrooveGuardian", "SonataSentry", "ReggaeRaider", "FunkFanatic", "CodeIgniter",
    "VisionaryVibe", "DreamDesigner", "CraftCraze", "ArtisticAura", "BuildBard",
    "ConceptCatcher", "DesignDeviant", "MuseMagnet", "PatternPioneer", "SketchSoul",
    "InnovateInstinct", "CraftyCreator", "PalettePaladin", "FantasyForge", "ImaginationInk",
    "ArtisanAlly", "VisionVanguard", "CreationCrafter", "MuseMarshal", "PixelPilot",
    "SculptureSleuth", "ColorCurator", "Dreamweaver", "IdeaInstigator", "ConceptChampion",
    "MotifMaestro", "FormFinder", "InnovationIcon", "CraftCommanderApexAce", "MasterMindX",
    "AlphaWolf", "OmegaStrike", "BravoBrigade", "DeltaDawn", "EchoElite", "FoxtrotFury",
    "GolfGuardian", "HotelHero", "IndiaIndigo", "JulietJuggernaut", "KiloKingpin",
    "LimaLegend", "MikeMaverick", "NovemberNoble", "OscarOperator", "PapaPhantom",
    "QuebecQuest", "RomeoRaider", "SierraStriker", "TangoTactician", "UniformUnleashed",
    "VictorVanguard", "WhiskeyWarrior", "XrayXpert", "YankeeYardstick", "ZuluZealot"
  ];
