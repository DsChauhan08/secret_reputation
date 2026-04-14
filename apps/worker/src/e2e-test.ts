const WS_URL = process.env.WS_URL ?? "wss://secret-reputation.singhdschauhan10.workers.dev";
const HTTP_URL = process.env.HTTP_URL ?? "https://secret-reputation.singhdschauhan10.workers.dev";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

function connectWS(roomCode: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${WS_URL}/api/rooms/${roomCode}/ws`);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error(`WS connect timeout for ${roomCode}`));
    }, 10000);
    ws.onopen = () => {
      clearTimeout(timeout);
      resolve(ws);
    };
    ws.onerror = (e) => {
      clearTimeout(timeout);
      reject(new Error(`WS error: ${e}`));
    };
  });
}

function waitForMessage(ws: WebSocket, expectedType?: string, timeoutMs = 5000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timeout waiting for ${expectedType || "any"}`)), timeoutMs);
    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        if (!expectedType || data.type === expectedType) {
          clearTimeout(timeout);
          ws.removeEventListener("message", handler);
          resolve(data);
        }
      } catch {}
    };
    ws.addEventListener("message", handler);
  });
}

function send(ws: WebSocket, event: any) {
  ws.send(JSON.stringify(event));
}

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function testHealthEndpoint() {
  console.log("\n🔍 TEST: Health endpoint");
  const res = await fetch(`${HTTP_URL}/`);
  const body = await res.json();
  assert(res.status === 200, "Health returns 200");
  assert(body.status === "ok", "Health body is {status: ok}");
}

async function testNotFoundEndpoint() {
  console.log("\n🔍 TEST: 404 for unknown routes");
  const res = await fetch(`${HTTP_URL}/api/nonexistent`);
  assert(res.status === 404, "Unknown route returns 404");
}

async function testNonWSUpgrade() {
  console.log("\n🔍 TEST: Non-WebSocket request to WS endpoint");
  const res = await fetch(`${HTTP_URL}/api/rooms/ABCDEF/ws`);
  assert(res.status === 426, "Returns 426 without Upgrade header");
}

async function testRoomStatusEmpty() {
  console.log("\n🔍 TEST: Room status for nonexistent room");
  const res = await fetch(`${HTTP_URL}/api/rooms/ZZZZZZ`);
  const body = await res.json();
  assert(body.exists === false, "Nonexistent room returns exists=false");
}

async function testCreateRoom() {
  console.log("\n🔍 TEST: Create room flow");
  const code = randomCode();

  const ws = await connectWS(code);
  assert(ws.readyState === WebSocket.OPEN, "WebSocket connected");

  send(ws, {
    type: "CREATE_ROOM",
    payload: { playerName: "TestHost", playerColor: "#845EC2", roomName: "Test Room", mode: "normal-chaos" },
  });

  const msg = await waitForMessage(ws, "ROOM_CREATED");
  assert(msg.type === "ROOM_CREATED", "Received ROOM_CREATED");
  assert(msg.payload.room.code === code, `Room code matches: ${msg.payload.room.code}`);
  assert(msg.payload.room.players.length === 1, "Room has 1 player");
  assert(msg.payload.room.players[0].name === "TestHost", "Host name is correct");
  assert(msg.payload.room.players[0].isHost === true, "Host flag is true");
  assert(msg.payload.room.status === "lobby", "Room status is lobby");
  assert(msg.payload.room.mode === "normal-chaos", "Mode is correct");
  assert(msg.payload.room.categories.length > 0, "Categories loaded");
  assert(msg.payload.playerId.length === 12, "Player ID is 12 chars");

  ws.close();
  return { code, hostId: msg.payload.playerId };
}

async function testJoinRoom() {
  console.log("\n🔍 TEST: Join room flow");
  const code = randomCode();

  const hostWs = await connectWS(code);
  send(hostWs, {
    type: "CREATE_ROOM",
    payload: { playerName: "Host", playerColor: "#845EC2", roomName: "Join Test", mode: "light-roast" },
  });
  await waitForMessage(hostWs, "ROOM_CREATED");

  const p2Ws = await connectWS(code);
  assert(p2Ws.readyState === WebSocket.OPEN, "Player 2 connected");

  const p2JoinedPromise = waitForMessage(p2Ws, "ROOM_JOINED");
  const hostNotifPromise = waitForMessage(hostWs, "PLAYER_JOINED");

  send(p2Ws, {
    type: "JOIN_ROOM",
    payload: { code, playerName: "Player2", playerColor: "#FF8066" },
  });

  const joined = await p2JoinedPromise;
  assert(joined.type === "ROOM_JOINED", "Player 2 received ROOM_JOINED");
  assert(joined.payload.room.players.length === 2, "Room has 2 players");

  const notif = await hostNotifPromise;
  assert(notif.type === "PLAYER_JOINED", "Host received PLAYER_JOINED");
  assert(notif.payload.player.name === "Player2", "Notification has correct player name");

  hostWs.close();
  p2Ws.close();
  return code;
}

async function testReconnectFlow() {
  console.log("\n🔒 SECURITY: Reconnect restores player session");
  const code = randomCode();

  const hostWs = await connectWS(code);
  send(hostWs, {
    type: "CREATE_ROOM",
    payload: { playerName: "Host", playerColor: "#845EC2", roomName: "Reconnect Test", mode: "light-roast" },
  });

  const created = await waitForMessage(hostWs, "ROOM_CREATED");
  const hostId = created.payload.playerId as string;
  const hostToken = created.payload.reconnectToken as string;
  assert(typeof hostToken === "string" && hostToken.length > 10, "Host receives reconnect token");

  const p2JoinNotif = waitForMessage(hostWs, "PLAYER_JOINED");
  const p2Ws = await connectWS(code);
  send(p2Ws, {
    type: "JOIN_ROOM",
    payload: { code, playerName: "P2", playerColor: "#FF8066" },
  });
  await waitForMessage(p2Ws, "ROOM_JOINED");
  await p2JoinNotif;

  const p3JoinNotif = waitForMessage(hostWs, "PLAYER_JOINED");
  const p3Ws = await connectWS(code);
  send(p3Ws, {
    type: "JOIN_ROOM",
    payload: { code, playerName: "P3", playerColor: "#4B4453" },
  });
  await waitForMessage(p3Ws, "ROOM_JOINED");
  await p3JoinNotif;

  const cats = created.payload.room.categories;
  const gsHost = waitForMessage(hostWs, "GAME_STARTED");
  const gsP2 = waitForMessage(p2Ws, "GAME_STARTED");
  const gsP3 = waitForMessage(p3Ws, "GAME_STARTED");
  send(hostWs, {
    type: "START_GAME",
    payload: { selectedCategoryIds: [cats[0].id, cats[1].id, cats[2].id] },
  });
  const started = await gsHost;
  await gsP2;
  await gsP3;

  const cat = started.payload.room.selectedCategoryIds[0];

  hostWs.close();
  const reconnectWs = await connectWS(code);
  send(reconnectWs, { type: "RECONNECT", payload: { playerId: hostId, reconnectToken: hostToken } });
  const rejoined = await waitForMessage(reconnectWs, "ROOM_JOINED");
  assert(rejoined.payload.playerId === hostId, "Reconnected socket keeps same playerId");

  send(reconnectWs, { type: "SUBMIT_VOTE", payload: { categoryId: cat, votedForId: rejoined.payload.room.players[1].id } });
  const voteAck = await waitForMessage(reconnectWs, "VOTE_RECEIVED");
  assert(voteAck.type === "VOTE_RECEIVED", "Reconnected player can vote");

  reconnectWs.close();
  p2Ws.close();
  p3Ws.close();
}

async function testJoinNonexistentRoom() {
  console.log("\n🔍 TEST: Join nonexistent room");
  const code = randomCode();
  const ws = await connectWS(code);

  send(ws, {
    type: "JOIN_ROOM",
    payload: { code, playerName: "Ghost", playerColor: "#C34A36" },
  });

  const msg = await waitForMessage(ws, "ERROR");
  assert(msg.type === "ERROR", "Received ERROR");
  assert(msg.payload.message === "Room does not exist", "Correct error message");

  ws.close();
}

async function testFullGameFlow() {
  console.log("\n🔍 TEST: Full game flow (create → join 3 → vote → reveal)");
  const code = randomCode();

  const hostWs = await connectWS(code);
  send(hostWs, {
    type: "CREATE_ROOM",
    payload: { playerName: "Alice", playerColor: "#845EC2", roomName: "Full Game", mode: "normal-chaos" },
  });
  const created = await waitForMessage(hostWs, "ROOM_CREATED");
  const hostId = created.payload.playerId;
  assert(!!hostId, "Host has ID");

  const hostP2Notif = waitForMessage(hostWs, "PLAYER_JOINED");
  const p2Ws = await connectWS(code);
  send(p2Ws, { type: "JOIN_ROOM", payload: { code, playerName: "Bob", playerColor: "#FF8066" } });
  const p2Joined = await waitForMessage(p2Ws, "ROOM_JOINED");
  const p2Id = p2Joined.payload.playerId;
  await hostP2Notif;

  const hostP3Notif = waitForMessage(hostWs, "PLAYER_JOINED");
  const p2P3Notif = waitForMessage(p2Ws, "PLAYER_JOINED");
  const p3Ws = await connectWS(code);
  send(p3Ws, { type: "JOIN_ROOM", payload: { code, playerName: "Charlie", playerColor: "#4B4453" } });
  const p3Joined = await waitForMessage(p3Ws, "ROOM_JOINED");
  const p3Id = p3Joined.payload.playerId;
  await hostP3Notif;
  await p2P3Notif;

  assert(p2Id !== p3Id, "Player IDs are unique");

  const categories = created.payload.room.categories;
  const selectedIds = categories.slice(0, 3).map((c: any) => c.id);

  const hostStartPromise = waitForMessage(hostWs, "GAME_STARTED");
  const p2StartPromise = waitForMessage(p2Ws, "GAME_STARTED");
  const p3StartPromise = waitForMessage(p3Ws, "GAME_STARTED");

  send(hostWs, { type: "START_GAME", payload: { selectedCategoryIds: selectedIds } });

  const hostStarted = await hostStartPromise;
  const p2Started = await p2StartPromise;
  const p3Started = await p3StartPromise;
  const runtimeSelectedIds = hostStarted.payload.room.selectedCategoryIds as string[];
  assert(hostStarted.payload.room.status === "voting", "Status is voting");
  assert(hostStarted.payload.room.totalRounds === 3, "Total rounds = 3");
  assert(runtimeSelectedIds.length === 3, "Runtime selected category count is 3");
  assert(p2Started.type === "GAME_STARTED", "P2 received GAME_STARTED");
  assert(p3Started.type === "GAME_STARTED", "P3 received GAME_STARTED");

  console.log("  📋 Round 1: Voting...");
  const cat1 = runtimeSelectedIds[0];

  send(hostWs, { type: "SUBMIT_VOTE", payload: { categoryId: cat1, votedForId: p2Id } });
  const vr1 = await waitForMessage(hostWs, "VOTE_RECEIVED");
  assert(vr1.payload.votesSubmitted === 1, "Vote count = 1 after host vote");

  send(p2Ws, { type: "SUBMIT_VOTE", payload: { categoryId: cat1, votedForId: p3Id } });
  await waitForMessage(p2Ws, "VOTE_RECEIVED");

  const revealHostPromise = waitForMessage(hostWs, "REVEAL_RESULT");
  const revealP2Promise = waitForMessage(p2Ws, "REVEAL_RESULT");
  const revealP3Promise = waitForMessage(p3Ws, "REVEAL_RESULT");

  send(p3Ws, { type: "SUBMIT_VOTE", payload: { categoryId: cat1, votedForId: p2Id } });

  const reveal = await revealHostPromise;
  await revealP2Promise;
  await revealP3Promise;
  assert(reveal.type === "REVEAL_RESULT", "Received REVEAL_RESULT");
  assert(reveal.payload.result.categoryId === cat1, "Correct category");
  assert(reveal.payload.result.winnerId === p2Id, "Bob wins (2 votes)");
  assert(reveal.payload.result.winnerName === "Bob", "Winner name correct");
  assert(reveal.payload.result.winnerVotes === 2, "Winner has 2 votes");
  assert(reveal.payload.result.totalVotes === 3, "Total votes = 3");
  assert(reveal.payload.result.commentary.length > 0, "Commentary generated");
  assert(reveal.payload.result.voteCounts.length === 3, "Vote counts for all 3 players");

  console.log("  📋 Round 2: Next round...");
  const nextHostPromise = waitForMessage(hostWs, "NEXT_ROUND");
  const nextP2Promise = waitForMessage(p2Ws, "NEXT_ROUND");
  const nextP3Promise = waitForMessage(p3Ws, "NEXT_ROUND");

  send(hostWs, { type: "NEXT_ROUND", payload: {} });

  const nextRound = await nextHostPromise;
  await nextP2Promise;
  await nextP3Promise;
  assert(nextRound.payload.currentRound === 1, "Round advanced to 1");
  assert(nextRound.payload.categoryId === runtimeSelectedIds[1], "Correct category for round 2");

  const cat2 = runtimeSelectedIds[1];
  send(hostWs, { type: "SUBMIT_VOTE", payload: { categoryId: cat2, votedForId: p3Id } });
  await waitForMessage(hostWs, "VOTE_RECEIVED");

  send(p2Ws, { type: "SUBMIT_VOTE", payload: { categoryId: cat2, votedForId: p3Id } });
  await waitForMessage(p2Ws, "VOTE_RECEIVED");

  const reveal2HostPromise = waitForMessage(hostWs, "REVEAL_RESULT");
  const reveal2P3Promise = waitForMessage(p3Ws, "REVEAL_RESULT");

  send(p3Ws, { type: "SUBMIT_VOTE", payload: { categoryId: cat2, votedForId: hostId } });

  const reveal2 = await reveal2P3Promise;
  await reveal2HostPromise;
  assert(reveal2.payload.result.winnerId === p3Id, "Charlie wins round 2 (2 votes)");

  console.log("  📋 Round 3: Final round...");
  const nextToRound3Host = waitForMessage(hostWs, "NEXT_ROUND");
  const nextToRound3P2 = waitForMessage(p2Ws, "NEXT_ROUND");
  const nextToRound3P3 = waitForMessage(p3Ws, "NEXT_ROUND");

  send(hostWs, { type: "NEXT_ROUND", payload: {} });
  await nextToRound3Host;
  await nextToRound3P2;
  await nextToRound3P3;

  const cat3 = runtimeSelectedIds[2];
  send(hostWs, { type: "SUBMIT_VOTE", payload: { categoryId: cat3, votedForId: p2Id } });
  await waitForMessage(hostWs, "VOTE_RECEIVED");

  send(p2Ws, { type: "SUBMIT_VOTE", payload: { categoryId: cat3, votedForId: p3Id } });
  await waitForMessage(p2Ws, "VOTE_RECEIVED");

  const reveal3Host = waitForMessage(hostWs, "REVEAL_RESULT");
  const reveal3P2 = waitForMessage(p2Ws, "REVEAL_RESULT");
  const reveal3P3 = waitForMessage(p3Ws, "REVEAL_RESULT");

  send(p3Ws, { type: "SUBMIT_VOTE", payload: { categoryId: cat3, votedForId: p2Id } });

  await reveal3Host;
  await reveal3P2;
  await reveal3P3;

  const endHostPromise = waitForMessage(hostWs, "GAME_ENDED");
  const endP2Promise = waitForMessage(p2Ws, "GAME_ENDED");
  const endP3Promise = waitForMessage(p3Ws, "GAME_ENDED");

  send(hostWs, { type: "NEXT_ROUND", payload: {} });

  const ended = await endHostPromise;
  await endP2Promise;
  await endP3Promise;
  assert(ended.type === "GAME_ENDED", "Received GAME_ENDED");
  assert(ended.payload.results.length === 3, "3 results in final summary");

  hostWs.close();
  p2Ws.close();
  p3Ws.close();
}

async function testSecuritySelfVote() {
  console.log("\n🔒 SECURITY: Self-voting prevention");
  const code = randomCode();

  const hostWs = await connectWS(code);
  send(hostWs, { type: "CREATE_ROOM", payload: { playerName: "SelfVoter", playerColor: "#845EC2", roomName: "Sec Test", mode: "light-roast" } });
  const created = await waitForMessage(hostWs, "ROOM_CREATED");
  const hostId = created.payload.playerId;

  const hostP2Notif = waitForMessage(hostWs, "PLAYER_JOINED");
  const p2Ws = await connectWS(code);
  send(p2Ws, { type: "JOIN_ROOM", payload: { code, playerName: "P2", playerColor: "#FF8066" } });
  await waitForMessage(p2Ws, "ROOM_JOINED");
  await hostP2Notif;

  const hostP3Notif = waitForMessage(hostWs, "PLAYER_JOINED");
  const p3Ws = await connectWS(code);
  send(p3Ws, { type: "JOIN_ROOM", payload: { code, playerName: "P3", playerColor: "#4B4453" } });
  const p3Joined = await waitForMessage(p3Ws, "ROOM_JOINED");
  const p3Id = p3Joined.payload.playerId;
  await hostP3Notif;

  const cats = created.payload.room.categories;
  const gs1 = waitForMessage(hostWs, "GAME_STARTED");
  const gs2 = waitForMessage(p2Ws, "GAME_STARTED");
  const gs3 = waitForMessage(p3Ws, "GAME_STARTED");
  send(hostWs, {
    type: "START_GAME",
    payload: { selectedCategoryIds: [cats[0].id, cats[1].id, cats[2].id] },
  });
  const started = await gs1;
  await gs2;
  await gs3;

  const currentCategoryId = started.payload.room.selectedCategoryIds[0];

  send(hostWs, { type: "SUBMIT_VOTE", payload: { categoryId: currentCategoryId, votedForId: hostId } });
  const err = await waitForMessage(hostWs, "ERROR");
  assert(err.type === "ERROR", "Self-vote rejected");
  assert(err.payload.message === "Cannot vote for yourself", "Correct error for self-vote");

  hostWs.close();
  p2Ws.close();
  p3Ws.close();
}

async function testSecurityNonHostStart() {
  console.log("\n🔒 SECURITY: Non-host cannot start game");
  const code = randomCode();

  const hostWs = await connectWS(code);
  send(hostWs, { type: "CREATE_ROOM", payload: { playerName: "Host", playerColor: "#845EC2", roomName: "Auth Test", mode: "light-roast" } });
  const created = await waitForMessage(hostWs, "ROOM_CREATED");

  const hostP2Notif = waitForMessage(hostWs, "PLAYER_JOINED");
  const p2Ws = await connectWS(code);
  send(p2Ws, { type: "JOIN_ROOM", payload: { code, playerName: "Imposter", playerColor: "#C34A36" } });
  await waitForMessage(p2Ws, "ROOM_JOINED");
  await hostP2Notif;

  const hostP3Notif = waitForMessage(hostWs, "PLAYER_JOINED");
  const p3Ws = await connectWS(code);
  send(p3Ws, { type: "JOIN_ROOM", payload: { code, playerName: "P3", playerColor: "#4B4453" } });
  await waitForMessage(p3Ws, "ROOM_JOINED");
  await hostP3Notif;

  send(p2Ws, { type: "START_GAME", payload: { selectedCategoryIds: [created.payload.room.categories[0].id] } });
  const err = await waitForMessage(p2Ws, "ERROR");
  assert(err.type === "ERROR", "Non-host start rejected");
  assert(err.payload.message === "Only the host can start", "Correct error message");

  hostWs.close();
  p2Ws.close();
  p3Ws.close();
}

async function testSecurityMinPlayers() {
  console.log("\n🔒 SECURITY: Min 3 players to start");
  const code = randomCode();

  const hostWs = await connectWS(code);
  send(hostWs, { type: "CREATE_ROOM", payload: { playerName: "Solo", playerColor: "#845EC2", roomName: "Min Test", mode: "light-roast" } });
  const created = await waitForMessage(hostWs, "ROOM_CREATED");

  const hostP2Notif = waitForMessage(hostWs, "PLAYER_JOINED");
  const p2Ws = await connectWS(code);
  send(p2Ws, { type: "JOIN_ROOM", payload: { code, playerName: "P2", playerColor: "#FF8066" } });
  await waitForMessage(p2Ws, "ROOM_JOINED");
  await hostP2Notif;

  send(hostWs, { type: "START_GAME", payload: { selectedCategoryIds: [created.payload.room.categories[0].id] } });
  const err = await waitForMessage(hostWs, "ERROR");
  assert(err.type === "ERROR", "Start with 2 players rejected");
  assert(err.payload.message === "Need at least 3 players", "Correct min player error");

  hostWs.close();
  p2Ws.close();
}

async function testSecurityMinCategories() {
  console.log("\n🔒 SECURITY: Min 3 categories to start");
  const code = randomCode();

  const hostWs = await connectWS(code);
  send(hostWs, { type: "CREATE_ROOM", payload: { playerName: "Host", playerColor: "#845EC2", roomName: "Min Cat", mode: "light-roast" } });
  const created = await waitForMessage(hostWs, "ROOM_CREATED");

  const hostP2Notif = waitForMessage(hostWs, "PLAYER_JOINED");
  const p2Ws = await connectWS(code);
  send(p2Ws, { type: "JOIN_ROOM", payload: { code, playerName: "P2", playerColor: "#FF8066" } });
  await waitForMessage(p2Ws, "ROOM_JOINED");
  await hostP2Notif;

  const hostP3Notif = waitForMessage(hostWs, "PLAYER_JOINED");
  const p3Ws = await connectWS(code);
  send(p3Ws, { type: "JOIN_ROOM", payload: { code, playerName: "P3", playerColor: "#4B4453" } });
  await waitForMessage(p3Ws, "ROOM_JOINED");
  await hostP3Notif;

  send(hostWs, { type: "START_GAME", payload: { selectedCategoryIds: [created.payload.room.categories[0].id] } });
  const err = await waitForMessage(hostWs, "ERROR");
  assert(err.type === "ERROR", "Start with 1 category rejected");
  assert(err.payload.message.includes("Select at least 3"), "Correct min category error");

  hostWs.close();
  p2Ws.close();
  p3Ws.close();
}

async function testSecurityInvalidJSON() {
  console.log("\n🔒 SECURITY: Invalid JSON handling");
  const code = randomCode();
  const ws = await connectWS(code);

  ws.send("not valid json {{{");
  const err = await waitForMessage(ws, "ERROR");
  assert(err.type === "ERROR", "Invalid JSON returns ERROR");
  assert(err.payload.message === "Invalid message format", "Correct error for bad JSON");

  ws.close();
}

async function testSecurityRoomFull() {
  console.log("\n🔒 SECURITY: Room capacity (10 max)");
  const code = randomCode();
  const hostWs = await connectWS(code);
  send(hostWs, { type: "CREATE_ROOM", payload: { playerName: "Host", playerColor: "#845EC2", roomName: "Full Room", mode: "light-roast" } });
  await waitForMessage(hostWs, "ROOM_CREATED");

  const sockets: WebSocket[] = [hostWs];
  for (let i = 0; i < 9; i++) {
    const ws = await connectWS(code);
    send(ws, { type: "JOIN_ROOM", payload: { code, playerName: `P${i+2}`, playerColor: "#FF8066" } });
    await waitForMessage(ws, "ROOM_JOINED");
    sockets.push(ws);
  }

  assert(sockets.length === 10, "10 players connected");

  const overflowWs = await connectWS(code);
  send(overflowWs, { type: "JOIN_ROOM", payload: { code, playerName: "Overflow", playerColor: "#C34A36" } });
  const err = await waitForMessage(overflowWs, "ERROR");
  assert(err.type === "ERROR", "11th player rejected");
  assert(err.payload.message === "Room is full", "Correct room full error");

  overflowWs.close();
  sockets.forEach(s => s.close());
}

async function testInvitePage() {
  console.log("\n🔍 TEST: Invite page");
  const res = await fetch(`${HTTP_URL}/invite?room=ABCD23`);
  assert(res.status === 200, "Invite returns 200");
  const html = await res.text();
  assert(html.includes("Secret Reputation"), "Has app name");
  assert(html.includes("ABCD23"), "Has sanitized room code");
  assert(html.includes("secretrep://join?room=ABCD23"), "Has deep link");
  assert(html.includes("releases/latest"), "Has download fallback");

  const badRes = await fetch(`${HTTP_URL}/invite?room=<script>alert(1)</script>`);
  const badHtml = await badRes.text();
  assert(!badHtml.includes("<script>alert"), "XSS in room code sanitized");
}

async function testCustomCategories() {
  console.log("\n🔍 TEST: Custom categories in START_GAME");
  const code = randomCode();

  const hostWs = await connectWS(code);
  send(hostWs, { type: "CREATE_ROOM", payload: { playerName: "Host", playerColor: "#845EC2", roomName: "Custom Test", mode: "light-roast" } });
  const created = await waitForMessage(hostWs, "ROOM_CREATED");

  const p2Notif = waitForMessage(hostWs, "PLAYER_JOINED");
  const p2Ws = await connectWS(code);
  send(p2Ws, { type: "JOIN_ROOM", payload: { code, playerName: "P2", playerColor: "#FF8066" } });
  await waitForMessage(p2Ws, "ROOM_JOINED");
  await p2Notif;

  const p3Notif = waitForMessage(hostWs, "PLAYER_JOINED");
  const p3Ws = await connectWS(code);
  send(p3Ws, { type: "JOIN_ROOM", payload: { code, playerName: "P3", playerColor: "#4B4453" } });
  await waitForMessage(p3Ws, "ROOM_JOINED");
  await p3Notif;

  const builtinIds = created.payload.room.categories.slice(0, 2).map((c: any) => c.id);
  const customCats = [
    { id: "custom_test_one", text: "most likely to make a custom question" },
    { id: "custom_test_two", text: "most likely to add their own category rules" },
  ];

  const gs1 = waitForMessage(hostWs, "GAME_STARTED");
  const gs2 = waitForMessage(p2Ws, "GAME_STARTED");
  send(hostWs, {
    type: "START_GAME",
    payload: {
      selectedCategoryIds: [...builtinIds, "custom_test_one"],
      customCategories: customCats,
    },
  });

  const started = await gs1;
  await gs2;
  assert(started.payload.room.status === "voting", "Game started with custom categories");

  const hasCust = started.payload.room.categories.some((c: any) => c.id === "custom_test_one" && c.isCustom);
  assert(hasCust, "Custom category merged into room");
  assert(started.payload.room.totalRounds === 3, "3 rounds (2 builtin + 1 custom)");

  hostWs.close();
  p2Ws.close();
  p3Ws.close();
}

async function testCustomCategoryModeration() {
  console.log("\n🔒 SECURITY: Custom category moderation");
  const code = randomCode();

  const hostWs = await connectWS(code);
  send(hostWs, { type: "CREATE_ROOM", payload: { playerName: "Host", playerColor: "#845EC2", roomName: "Mod Test", mode: "light-roast" } });
  const created = await waitForMessage(hostWs, "ROOM_CREATED");

  const p2Notif = waitForMessage(hostWs, "PLAYER_JOINED");
  const p2Ws = await connectWS(code);
  send(p2Ws, { type: "JOIN_ROOM", payload: { code, playerName: "P2", playerColor: "#FF8066" } });
  await waitForMessage(p2Ws, "ROOM_JOINED");
  await p2Notif;

  const p3Notif = waitForMessage(hostWs, "PLAYER_JOINED");
  const p3Ws = await connectWS(code);
  send(p3Ws, { type: "JOIN_ROOM", payload: { code, playerName: "P3", playerColor: "#4B4453" } });
  await waitForMessage(p3Ws, "ROOM_JOINED");
  await p3Notif;

  const builtinIds = created.payload.room.categories.slice(0, 3).map((c: any) => c.id);
  send(hostWs, {
    type: "START_GAME",
    payload: {
      selectedCategoryIds: builtinIds,
      customCategories: [{ id: "custom_bad", text: "most likely to kill yourself" }],
    },
  });

  const err = await waitForMessage(hostWs, "ERROR");
  assert(err.type === "ERROR", "Bad custom category rejected");
  assert(err.payload.message.includes("inappropriate"), "Moderation reason given");

  hostWs.close();
  p2Ws.close();
  p3Ws.close();
}

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  SECRET REPUTATION — E2E TEST SUITE v2");
  console.log(`  Target: ${WS_URL}`);
  console.log("═══════════════════════════════════════════");

  try {
    await testHealthEndpoint();
    await testNotFoundEndpoint();
    await testNonWSUpgrade();
    await testRoomStatusEmpty();
    await testInvitePage();
    await testCreateRoom();
    await testJoinRoom();
    await testJoinNonexistentRoom();
    await testReconnectFlow();
    await testCustomCategories();
    await testFullGameFlow();
    await testSecuritySelfVote();
    await testSecurityNonHostStart();
    await testSecurityMinPlayers();
    await testSecurityMinCategories();
    await testSecurityInvalidJSON();
    await testSecurityRoomFull();
    await testCustomCategoryModeration();
  } catch (err) {
    console.error("\n💥 FATAL ERROR:", err);
    failed++;
  }

  console.log("\n═══════════════════════════════════════════");
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log("═══════════════════════════════════════════");

  if (failed > 0) process.exit(1);
}

main();
