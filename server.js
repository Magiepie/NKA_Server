const WebSocket = require('ws');

const port = 24247; 
const wss = new WebSocket.Server({ port });
console.log(`WebSocket server started on ws://localhost:${port}`);

const clients = new Set();
let clientIdCounter = 1; 

const TYPE_SETNAME = 1,
      TYPE_CHAT = 2,
      TYPE_DISCONNECT = 3,
      TYPE_POSITION = 4,
      TYPE_NOTIFICATION = 5;

const networkHandlers = {
        [TYPE_SETNAME]: serverSetName,
        [TYPE_CHAT]: serverChat,
        [TYPE_POSITION]: serverPosition,
        [TYPE_NOTIFICATION]: serverNotification,
      };

wss.on('connection', (ws) => {
    // Assign a unique ID to the connected client
    ws.id = clientIdCounter++;
    ws.username = getRandomName() //`Client${ws.id}`;  // Default name, can be set later /setname client side
    clients.add(ws);  // Add the new client to the set
    console.log(`Client ${ws.id} connected`);

    const newClientMessage = Buffer.from(`${ws.username}`);
    broadcastBinaryMessage(ws, TYPE_SETNAME, newClientMessage); // tell client its randomly assigned name.


    ws.on('message', (data) => { // handle incomming data
            console.log(`Received binary ${ws.username}:`, data);

            const messageType = data.readUInt8(0); // Read the first byte (command type)
            const messageBody = data.slice(1); // Get the rest of the data

            const NEThandler = networkHandlers[messageType];

            if (NEThandler) {
                NEThandler(ws, messageBody);
              } else {
                console.log(`Unknown binary message type: ${messageType}`);
              }
    });

    ws.on('close', () => {
        console.log(`Client ${ws.id} (${ws.username}) disconnected`);
        const disconnectMessage = Buffer.from(`${ws.username} has disconnected.`);
        broadcastBinaryMessage(ws, TYPE_NOTIFICATION, disconnectMessage); 
        clients.delete(ws); 
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error with Client ${ws.id}: ${error.message}`);
        clients.delete(ws); 
    });
});

// Function to broadcast binary messages to all clients
function broadcastBinaryMessage(sender, messageType, messageBody) {
    clients.forEach((client) => {
        if ( client.readyState === WebSocket.OPEN) {
            const fullMessage = Buffer.concat([Buffer.from([messageType]), messageBody]);
            client.send(fullMessage);
        }
    });
}

function sendBinaryMessageToClient(client, messageType, messageBody) {
    if (client.readyState === WebSocket.OPEN) {
        const fullMessage = Buffer.concat([Buffer.from([messageType]), messageBody]);
        client.send(fullMessage);
    } else {
        console.log(`Cannot send message to client ${client.id} (${client.username}): WebSocket is not open`);
    }
}

//////////////////////////////////////////////////////////////////////////////////////
//                            networkHandlers                                       //
//////////////////////////////////////////////////////////////////////////////////////
function serverSetName(client,messageBody) { // TYPE_SETNAME
    const playerNameLength = messageBody.readUInt8(0);
    const playerName = messageBody.slice(1, 1 + playerNameLength).toString('utf8');

    let oldname = client.username
    client.username = playerName;
     
     const nameupdatemsg = Buffer.from(`_${oldname} _is changing name to: ${playerName}`);

     sendBinaryMessageToClient(client, TYPE_NOTIFICATION, nameupdatemsg); 
}

function serverChat(client,messageBody){ // TYPE_CHAT
    const playerNameLength = messageBody.readUInt8(0);
    const playerName = messageBody.slice(1, 1 + playerNameLength).toString('utf8'); // can do away with this now we have setname server side
    const chatMessageLength = messageBody.readUInt16BE(1 + playerNameLength);
    const chatMessage = messageBody.slice(1 + playerNameLength + 2, 1 + playerNameLength + 2 + chatMessageLength).toString('utf8');
    
    console.log(`Player ${playerName} says: ${chatMessage}`);
    
    broadcastBinaryMessage(client, TYPE_CHAT, messageBody);
}

function serverPosition(client,messageBody){ // TYPE_POSITION
    const x = messageBody.readFloatBE(0);
    const y = messageBody.readFloatBE(4);
    console.log(`Received coordinates from ${client.username}: (${x}, ${y})`);
    
    // Optionally update the server state, or just broadcast to other clients
    broadcastBinaryMessage(client, TYPE_POSITION, messageBody);
}

function serverNotification(client,messageBody){ // TYPE_NOTIFICATION
    
    broadcastBinaryMessage(client, TYPE_NOTIFICATION, messageBody);
}
//////////////////////////////////////////////////////////////////////////////////////
//                           END_networkHandlers                                    //
//////////////////////////////////////////////////////////////////////////////////////


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
