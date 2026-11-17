// ============================================================================
// ANIME STRIKE: ECLIPSE PROTOCOL - 5v5 ONLINE HOST/JOIN MULTIPLAYER (WEBRTC + BC)
// ============================================================================

class MultiplayerManager {
  constructor() {
    this.isHost = true;
    this.inRoom = false;
    this.roomCode = '';
    this.myPeerId = 'p_' + Math.random().toString(36).substring(2, 9);
    this.peer = null;
    this.connections = new Map(); // peerId -> PeerJS DataConnection
    this.bc = null;               // BroadcastChannel for instant multi-tab sync

    this.matchConfig = {
      mapId: 'neo_shibuya',
      gameMode: 'tactical_5v5', // 'tactical_5v5' (Valorant/CS2 Spike) or 'arena_5v5' (Overwatch Respawn)
      botDifficulty: 'medium',
      fillBots: true
    };

    // 10 Slots (5 Alpha vs 5 Omega)
    this.slots = [];
    this.onLobbyUpdated = null;
    this.onMatchStart = null;
    this.onNetworkPacket = null;
    this.onChatMessage = null;

    this.initDefaultLobby();
  }

  initDefaultLobby() {
    const heroes = window.GAME_DATA.heroes;
    this.slots = [];
    for (let i = 0; i < 5; i++) {
      this.slots.push({
        slotIndex: i,
        team: 'alpha',
        type: i === 0 ? 'human' : 'bot',
        peerId: i === 0 ? this.myPeerId : `bot_alpha_${i}`,
        name: i === 0 ? (window.SETTINGS ? window.SETTINGS.config.playerName : 'Host_Agente') : `Bot_${heroes[i % heroes.length].name}`,
        heroId: heroes[i % heroes.length].id
      });
    }
    for (let i = 0; i < 5; i++) {
      const h = heroes[(i + 2) % heroes.length];
      this.slots.push({
        slotIndex: i + 5,
        team: 'omega',
        type: 'bot',
        peerId: `bot_omega_${i}`,
        name: `Bot_${h.name}_${i + 1}`,
        heroId: h.id
      });
    }
  }

  generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  hostRoom(playerName, heroId) {
    this.cleanupConnections();
    this.isHost = true;
    this.inRoom = true;
    this.roomCode = this.generateCode();
    this.initDefaultLobby();
    this.slots[0].name = playerName;
    this.slots[0].heroId = heroId;

    // Setup BroadcastChannel for same-machine tabs
    this.setupBroadcastChannel(this.roomCode);

    // Setup PeerJS WebRTC Host
    if (window.Peer) {
      try {
        const peerBrokerId = `anime-strike-5v5-${this.roomCode}`;
        this.peer = new Peer(peerBrokerId);
        this.peer.on('open', () => {
          this.notifyStatus(`Sala Online Criada! Código: ${this.roomCode} (WebRTC P2P Ativo)`);
          this.triggerLobbyUI();
        });
        this.peer.on('connection', (conn) => {
          conn.on('open', () => {
            this.connections.set(conn.peer, conn);
            conn.on('data', (data) => this.handleIncomingPacket(data, conn.peer));
            conn.on('close', () => {
              this.connections.delete(conn.peer);
              this.removeDisconnectedPlayer(conn.peer);
            });
          });
        });
        this.peer.on('error', () => {
          this.notifyStatus(`Sala ${this.roomCode} ativa em modo híbrido.`);
        });
      } catch (e) {
        console.warn('PeerJS fallback:', e);
      }
    }

    this.triggerLobbyUI();
    return this.roomCode;
  }

  joinRoom(code, playerName, heroId) {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) return;

    this.cleanupConnections();
    this.isHost = false;
    this.inRoom = true;
    this.roomCode = cleanCode;

    this.setupBroadcastChannel(cleanCode);
    this.sendPacket({
      type: 'JOIN_REQUEST',
      peerId: this.myPeerId,
      name: playerName,
      heroId: heroId
    });

    if (window.Peer) {
      try {
        this.peer = new Peer();
        this.peer.on('open', () => {
          const hostBrokerId = `anime-strike-5v5-${cleanCode}`;
          const conn = this.peer.connect(hostBrokerId, { reliable: true });
          conn.on('open', () => {
            this.connections.set('host', conn);
            this.notifyStatus(`Conectado à Sala ${cleanCode}!`);
            conn.send({
              type: 'JOIN_REQUEST',
              peerId: this.myPeerId,
              name: playerName,
              heroId: heroId
            });
          });
          conn.on('data', (data) => this.handleIncomingPacket(data, 'host'));
        });
      } catch (e) {
        console.warn('PeerJS Join error:', e);
      }
    }
  }

  setupBroadcastChannel(code) {
    if (this.bc) this.bc.close();
    if ('BroadcastChannel' in window) {
      this.bc = new BroadcastChannel(`anime_strike_room_${code}`);
      this.bc.onmessage = (ev) => {
        if (ev.data && ev.data.senderId !== this.myPeerId) {
          this.handleIncomingPacket(ev.data, ev.data.senderId);
        }
      };
    }
  }

  sendPacket(payload) {
    const packet = Object.assign({}, payload, { senderId: this.myPeerId });
    if (this.bc) {
      try { this.bc.postMessage(packet); } catch (e) {}
    }
    this.connections.forEach((conn) => {
      if (conn && conn.open) {
        try { conn.send(packet); } catch (e) {}
      }
    });
  }

  handleIncomingPacket(data, fromId) {
    if (!data || !data.type) return;

    if (data.type === 'JOIN_REQUEST' && this.isHost) {
      // Assign human player to first bot/empty slot (alternating teams for 5v5 balance)
      let targetSlot = this.slots.find(s => s.peerId === data.peerId);
      if (!targetSlot) {
        const omegaBots = this.slots.filter(s => s.team === 'omega' && s.type !== 'human');
        const alphaBots = this.slots.filter(s => s.team === 'alpha' && s.type !== 'human');
        targetSlot = omegaBots.length >= alphaBots.length ? omegaBots[0] : alphaBots[0];
      }
      if (targetSlot) {
        targetSlot.type = 'human';
        targetSlot.peerId = data.peerId;
        targetSlot.name = data.name || 'Colega_Online';
        targetSlot.heroId = data.heroId || 'akira';
      }
      this.broadcastLobbyState();
      this.sendChat('SISTEMA', `${data.name} entrou no lobby 5v5!`);
    } else if (data.type === 'LOBBY_SYNC' && !this.isHost) {
      this.slots = data.slots;
      this.matchConfig = data.matchConfig;
      this.triggerLobbyUI();
    } else if (data.type === 'PLAYER_SLOT_UPDATE' && this.isHost) {
      const slot = this.slots.find(s => s.peerId === data.peerId);
      if (slot) {
        if (data.heroId) slot.heroId = data.heroId;
        if (data.name) slot.name = data.name;
        if (data.switchTeam) {
          const targetTeam = slot.team === 'alpha' ? 'omega' : 'alpha';
          const swapSlot = this.slots.find(s => s.team === targetTeam && s.type !== 'human');
          if (swapSlot) {
            const temp = { type: swapSlot.type, peerId: swapSlot.peerId, name: swapSlot.name, heroId: swapSlot.heroId };
            swapSlot.type = 'human';
            swapSlot.peerId = slot.peerId;
            swapSlot.name = slot.name;
            swapSlot.heroId = slot.heroId;

            slot.type = temp.type;
            slot.peerId = temp.peerId;
            slot.name = temp.name;
            slot.heroId = temp.heroId;
          }
        }
        this.broadcastLobbyState();
      }
    } else if (data.type === 'CHAT_MSG') {
      if (this.onChatMessage) this.onChatMessage(data.author, data.text);
    } else if (data.type === 'START_MATCH') {
      this.slots = data.slots || this.slots;
      this.matchConfig = data.matchConfig || this.matchConfig;
      if (this.onMatchStart) this.onMatchStart(this.slots, this.matchConfig);
    } else {
      // Gameplay packets (PLAYER_STATE, SHOOT_FX, ABILITY_CAST, HIT_EVENT, SPIKE_EVENT)
      if (this.onNetworkPacket) this.onNetworkPacket(data);
    }
  }

  broadcastLobbyState() {
    if (!this.isHost) return;
    this.sendPacket({
      type: 'LOBBY_SYNC',
      slots: this.slots,
      matchConfig: this.matchConfig
    });
    this.triggerLobbyUI();
  }

  updateMyHeroAndName(name, heroId) {
    const mySlot = this.slots.find(s => s.peerId === this.myPeerId);
    if (mySlot) {
      mySlot.name = name;
      mySlot.heroId = heroId;
    }
    if (this.isHost) {
      this.broadcastLobbyState();
    } else {
      this.sendPacket({
        type: 'PLAYER_SLOT_UPDATE',
        peerId: this.myPeerId,
        name,
        heroId
      });
    }
  }

  switchMyTeam() {
    if (this.isHost) {
      const mySlot = this.slots.find(s => s.peerId === this.myPeerId);
      if (mySlot) {
        const targetTeam = mySlot.team === 'alpha' ? 'omega' : 'alpha';
        const swapSlot = this.slots.find(s => s.team === targetTeam && s.type !== 'human');
        if (swapSlot) {
          const temp = { type: swapSlot.type, peerId: swapSlot.peerId, name: swapSlot.name, heroId: swapSlot.heroId };
          swapSlot.type = 'human';
          swapSlot.peerId = mySlot.peerId;
          swapSlot.name = mySlot.name;
          swapSlot.heroId = mySlot.heroId;
          mySlot.type = temp.type;
          mySlot.peerId = temp.peerId;
          mySlot.name = temp.name;
          mySlot.heroId = temp.heroId;
          this.broadcastLobbyState();
        }
      }
    } else {
      this.sendPacket({
        type: 'PLAYER_SLOT_UPDATE',
        peerId: this.myPeerId,
        switchTeam: true
      });
    }
  }

  setBotsEnabled(enabled) {
    if (!this.isHost) return;
    this.matchConfig.fillBots = enabled;
    const heroes = window.GAME_DATA.heroes;
    this.slots.forEach((slot, idx) => {
      if (slot.type !== 'human') {
        slot.type = enabled ? 'bot' : 'empty';
        const h = heroes[idx % heroes.length];
        slot.name = enabled ? `Bot_${h.name}` : 'Vaga Aberta';
      }
    });
    this.broadcastLobbyState();
  }

  removeDisconnectedPlayer(peerId) {
    const slot = this.slots.find(s => s.peerId === peerId);
    if (slot) {
      slot.type = this.matchConfig.fillBots ? 'bot' : 'empty';
      slot.peerId = `bot_${slot.slotIndex}`;
      slot.name = this.matchConfig.fillBots ? `Bot_${slot.heroId.toUpperCase()}` : 'Vaga Aberta';
      this.broadcastLobbyState();
    }
  }

  sendChat(author, text) {
    if (this.onChatMessage) this.onChatMessage(author, text);
    this.sendPacket({ type: 'CHAT_MSG', author, text });
  }

  hostStartMatch() {
    if (!this.isHost) return;
    this.sendPacket({
      type: 'START_MATCH',
      slots: this.slots,
      matchConfig: this.matchConfig
    });
    if (this.onMatchStart) this.onMatchStart(this.slots, this.matchConfig);
  }

  notifyStatus(msg) {
    const el = document.getElementById('mp-status-text');
    if (el) el.textContent = msg;
  }

  triggerLobbyUI() {
    if (this.onLobbyUpdated) this.onLobbyUpdated(this.slots, this.matchConfig, this.roomCode, this.isHost);
  }

  cleanupConnections() {
    this.connections.forEach(c => { try { c.close(); } catch (e) {} });
    this.connections.clear();
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
  }
}

window.NETWORK = new MultiplayerManager();
