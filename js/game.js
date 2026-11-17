// ============================================================================
// ANIME STRIKE: ECLIPSE PROTOCOL - CORE 3D FPS ENGINE (THREE.JS)
// ============================================================================

class AnimeStrikeGame {
  constructor() {
    this.container = document.getElementById('game-canvas-container');
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 450);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();
    this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'PAUSED'
    this.mode = 'tactical_5v5'; // 'tactical_5v5' | 'arena_5v5' | 'campaign' | 'tutorial'

    this.selectedHeroId = 'akira';
    this.selectedMapId = 'neo_shibuya';
    this.currentChapterIndex = 0;

    // Player Physics & Combat State
    this.player = {
      team: 'alpha',
      pos: new THREE.Vector3(0, 0, 52),
      vel: new THREE.Vector3(),
      yaw: 0,
      pitch: 0,
      height: 1.75,
      onGround: true,
      crouching: false,
      sprinting: false,
      ads: false,
      hp: 100,
      maxHp: 100,
      shield: 50,
      maxShield: 50,
      credits: 1600,
      alive: true,
      kills: 0,
      deaths: 0,
      streak: 0,
      ultCharge: 45,
      weaponId: 'pulse_rifle',
      ammo: 30,
      reserveAmmo: 120,
      reloading: false,
      reloadTimer: 0,
      fireCooldown: 0,
      dynamicSpread: 0,
      recoilKick: 0,
      cooldowns: { q: 0, e: 0, c: 0 },
      buffs: {
        deflectTimer: 0,
        dragonKatanaTimer: 0,
        stealthTimer: 0,
        requiemTimer: 0,
        stimTimer: 0,
        sonarTimer: 0,
        overshieldTimer: 0
      }
    };

    this.keys = {};
    this.mouseDown = false;
    this.rightMouseDown = false;
    this.isPointerLocked = false;

    // World & Entities
    this.mapData = null;
    this.viewmodel = null;
    this.menuShowcaseGroup = null;
    this.entities = []; // Bots & Remote Players
    this.activeEffects = []; // Smokes, Gravity Wells, Turrets, Barriers, Tracers
    this.particles = null;

    // Match & Spike State
    this.roundNumber = 1;
    this.scoreAlpha = 0;
    this.scoreOmega = 0;
    this.roundTimer = 100;
    this.spike = {
      planted: false,
      defused: false,
      exploded: false,
      timer: 40,
      beepTimer: 0,
      siteName: '',
      pos: new THREE.Vector3(),
      mesh: null,
      interactProgress: 0
    };

    // Campaign & Tutorial State
    this.campaign = {
      hackedCount: 0,
      bossSpawned: false,
      bossDefeated: false,
      bossEntity: null,
      interactProgress: 0
    };
    this.tutorial = {
      stepIndex: 0,
      killsInStep: 0,
      usedSkill: false,
      usedUlt: false,
      waypointMesh: null
    };

    this.netSyncTimer = 0;
    this.fpsCounter = 60;

    this.initSceneLights();
    this.setupMenuShowcase();
    this.bindInputEvents();
    this.setupUIHandlers();
    this.checkUrlInviteParams();

    this.animate();
  }

  initSceneLights() {
    this.scene.fog = new THREE.FogExp2('#190d2c', 0.0055);
    this.ambientLight = new THREE.AmbientLight('#7a6f9b', 1.15);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight('#ffffff', 1.35);
    this.dirLight.position.set(45, 75, 40);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.scene.add(this.dirLight);
  }

  setupMenuShowcase() {
    if (this.menuShowcaseGroup) {
      this.scene.remove(this.menuShowcaseGroup);
    }
    this.scene.background = new THREE.Color('#090d1e');
    this.menuShowcaseGroup = new THREE.Group();

    const showcaseLight = new THREE.PointLight('#ffffff', 1.6, 15);
    showcaseLight.position.set(1.2, 1.8, -1.2);
    this.menuShowcaseGroup.add(showcaseLight);

    // Glowing Anime Pedestal
    const pedGeo = new THREE.CylinderGeometry(1.4, 1.7, 0.25, 24);
    const pedMat = window.MODELS.createAnimeMaterial('#161d38', '#05d5fa', 0.35);
    const ped = new THREE.Mesh(pedGeo, pedMat);
    ped.position.set(0.9, -0.95, -3.2);
    this.menuShowcaseGroup.add(ped);

    const ringGeo = new THREE.TorusGeometry(1.55, 0.04, 8, 32);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: '#ff2a6d' }));
    ring.position.set(0.9, -0.8, -3.2);
    this.menuShowcaseGroup.add(ring);

    const hero = this.getHeroData(this.selectedHeroId);
    const charMesh = window.MODELS.createHeroCharacterMesh(hero, 'alpha', hero.name, false);
    charMesh.position.set(0.9, -0.82, -3.2);
    if (charMesh.userData.nameplate) charMesh.userData.nameplate.visible = false;
    this.menuShowcaseGroup.userData.charMesh = charMesh;
    this.menuShowcaseGroup.add(charMesh);

    this.scene.add(this.menuShowcaseGroup);
    this.camera.position.set(0, 0.5, 0);
    this.camera.rotation.set(0, 0, 0);
  }

  getHeroData(heroId) {
    return window.GAME_DATA.heroes.find(h => h.id === heroId) || window.GAME_DATA.heroes[0];
  }

  getMapData(mapId) {
    return window.GAME_DATA.maps.find(m => m.id === mapId) || window.GAME_DATA.maps[0];
  }

  // ==========================================================================
  // INPUT & POINTER LOCK BINDINGS
  // ==========================================================================
  bindInputEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('keydown', (e) => {
      const code = e.code;
      this.keys[code] = true;

      if (this.state === 'PLAYING') {
        if (code === 'KeyR') this.startReload();
        if (code === 'KeyQ') this.castAbility('q');
        if (code === 'KeyE') this.castAbility('e');
        if (code === 'KeyC') this.castAbility('c');
        if (code === 'KeyX') this.castAbility('x');
        if (code === 'KeyB') this.toggleBuyMenu();
        if (code === 'Tab') {
          e.preventDefault();
          document.getElementById('scoreboard-modal').classList.remove('hidden');
          this.updateScoreboardUI();
        }
        if (code === 'Escape') {
          this.pauseGame();
        }
      } else if (this.state === 'PAUSED' && code === 'Escape') {
        this.resumeGame();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'Tab') {
        document.getElementById('scoreboard-modal').classList.add('hidden');
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.state !== 'PLAYING' || !this.player.alive) return;
      if (!document.getElementById('buy-menu-modal').classList.contains('hidden')) return;
      let dx = e.movementX || 0;
      let dy = e.movementY || 0;
      if (!this.isPointerLocked) {
        if (this.lastMouseX !== undefined && this.lastMouseY !== undefined) {
          dx = e.clientX - this.lastMouseX;
          dy = e.clientY - this.lastMouseY;
        }
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
      const cfg = window.SETTINGS.config;
      const sensMult = (this.player.ads ? cfg.adsSens : 1.0) * cfg.mouseSens * 0.0025;
      this.player.yaw -= dx * sensMult;
      const pitchDelta = dy * sensMult * (cfg.invertY ? -1 : 1);
      this.player.pitch = Math.max(-1.48, Math.min(1.48, this.player.pitch - pitchDelta));
    });

    window.addEventListener('mousedown', (e) => {
      if (this.state !== 'PLAYING') return;
      // Ignore clicks on open modals or UI buttons
      if (!document.getElementById('buy-menu-modal').classList.contains('hidden')) return;
      if (e.target && e.target.closest && e.target.closest('button, input, select, .modal-card, .mode-card')) return;

      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      if (!this.isPointerLocked) {
        this.requestLock();
      }
      if (e.button === 0) {
        this.mouseDown = true;
        this.tryShoot();
      } else if (e.button === 2) {
        this.rightMouseDown = true;
        this.setADS(true);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseDown = false;
      if (e.button === 2) {
        this.rightMouseDown = false;
        this.setADS(false);
      }
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
    });
  }

  requestLock() {
    try {
      const p = this.renderer.domElement.requestPointerLock();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {});
      }
    } catch (e) {}
  }

  exitLock() {
    if (document.pointerLockElement) {
      try { document.exitPointerLock(); } catch (e) {}
    }
  }

  setADS(active) {
    this.player.ads = active;
    const wpn = window.GAME_DATA.weapons[this.player.weaponId];
    const baseFov = window.SETTINGS.config.fov || 90;
    const scopeOverlay = document.getElementById('fx-sniper-scope');

    if (active && wpn && wpn.scopedZoom) {
      this.camera.fov = baseFov / wpn.scopedZoom;
      if (scopeOverlay) scopeOverlay.style.display = 'block';
      if (this.viewmodel) this.viewmodel.visible = false;
    } else if (active) {
      this.camera.fov = baseFov * 0.8;
      if (scopeOverlay) scopeOverlay.style.display = 'none';
      if (this.viewmodel) this.viewmodel.visible = true;
    } else {
      this.camera.fov = baseFov;
      if (scopeOverlay) scopeOverlay.style.display = 'none';
      if (this.viewmodel) this.viewmodel.visible = true;
    }
    this.camera.updateProjectionMatrix();
  }

  // ==========================================================================
  // MATCH / CAMPAIGN / TUTORIAL INITIALIZATION
  // ==========================================================================
  startMatch(mode, mapId, customSlots = null) {
    window.SOUND.init();
    this.mode = mode;
    this.selectedMapId = mapId || this.selectedMapId;
    this.state = 'PLAYING';

    // Hide Menu overlays, show In-Game HUD
    document.getElementById('main-menu-overlay').classList.add('hidden');
    document.getElementById('pause-menu-modal').classList.add('hidden');
    document.getElementById('buy-menu-modal').classList.add('hidden');
    document.getElementById('ingame-hud').classList.remove('hidden');

    if (this.menuShowcaseGroup) this.menuShowcaseGroup.visible = false;

    // Clear previous world objects
    this.clearWorld();

    const mapCfg = this.getMapData(this.selectedMapId);
    this.scene.background = new THREE.Color(mapCfg.skyTop);
    this.scene.fog = new THREE.FogExp2(mapCfg.fogColor, 0.0048);

    // Build 3D Map Geometry
    this.mapData = window.MODELS.buildMapGeometry(this.scene, mapCfg, mode === 'campaign');
    this.createEnvironmentalParticles(mapCfg);

    // Initialize Local Player with Selected Hero
    const hero = this.getHeroData(this.selectedHeroId);
    this.player.maxHp = hero.hp;
    this.player.hp = hero.hp;
    this.player.maxShield = hero.shield;
    this.player.shield = hero.shield;
    this.player.weaponId = hero.defaultWeapon;
    const wpn = window.GAME_DATA.weapons[this.player.weaponId];
    this.player.ammo = wpn.magSize;
    this.player.reserveAmmo = wpn.reserveAmmo;
    this.player.credits = mode === 'tactical_5v5' ? 1600 : 9000;
    this.player.kills = 0;
    this.player.deaths = 0;
    this.player.ultCharge = mode === 'tutorial' ? 100 : 35;

    // Create 3D First-Person Viewmodel attached to Camera
    this.setupViewmodel();

    this.roundNumber = 1;
    this.scoreAlpha = 0;
    this.scoreOmega = 0;

    if (mode === 'tactical_5v5' || mode === 'arena_5v5') {
      this.setup5v5Entities(customSlots || window.NETWORK.slots);
      this.startNewRound();
    } else if (mode === 'campaign') {
      this.setupCampaignChapter(mapCfg);
    } else if (mode === 'tutorial') {
      this.setupTutorialMode();
    }

    this.updateHUD();
    this.requestLock();
  }

  clearWorld() {
    if (this.mapData && this.mapData.mapGroup) {
      this.scene.remove(this.mapData.mapGroup);
    }
    this.entities.forEach(ent => {
      if (ent.mesh) this.scene.remove(ent.mesh);
    });
    this.entities = [];

    this.activeEffects.forEach(ef => {
      if (ef.mesh) this.scene.remove(ef.mesh);
    });
    this.activeEffects = [];

    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles = null;
    }
    if (this.spike.mesh) {
      this.scene.remove(this.spike.mesh);
      this.spike.mesh = null;
    }
    if (this.tutorial.waypointMesh) {
      this.scene.remove(this.tutorial.waypointMesh);
      this.tutorial.waypointMesh = null;
    }
  }

  setupViewmodel() {
    if (this.viewmodel) {
      this.camera.remove(this.viewmodel);
    }
    const hero = this.getHeroData(this.selectedHeroId);
    this.viewmodel = window.MODELS.createFirstPersonViewmodel(hero, this.player.weaponId);
    this.camera.add(this.viewmodel);
    if (!this.scene.children.includes(this.camera)) {
      this.scene.add(this.camera);
    }
  }

  createEnvironmentalParticles(mapCfg) {
    const count = 240;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 140;
      positions[i * 3 + 1] = Math.random() * 28 + 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 140;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const colorMap = {
      neon_sparks: '#05d5fa',
      sakura_petals: '#ff9ebb',
      snow_flakes: '#ffffff',
      sand_embers: '#fcbf49',
      cosmic_stars: '#b537f2'
    };
    const mat = new THREE.PointsMaterial({
      color: colorMap[mapCfg.particleType] || '#ffffff',
      size: 0.45,
      transparent: true,
      opacity: 0.8
    });
    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  // ==========================================================================
  // 5v5 ENTITIES & BOT AI SPAWNING
  // ==========================================================================
  setup5v5Entities(slots) {
    const mySlot = slots.find(s => s.peerId === window.NETWORK.myPeerId);
    this.player.team = mySlot ? mySlot.team : 'alpha';

    slots.forEach((slot, idx) => {
      if (slot.peerId === window.NETWORK.myPeerId) return;
      if (slot.type === 'empty') return;

      const hero = this.getHeroData(slot.heroId);
      const mesh = window.MODELS.createHeroCharacterMesh(hero, slot.team, slot.name, false);
      this.scene.add(mesh);

      this.entities.push({
        id: slot.peerId,
        name: slot.name,
        team: slot.team,
        isBot: slot.type === 'bot',
        isBoss: false,
        heroId: slot.heroId,
        heroData: hero,
        mesh,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        yaw: 0,
        hp: hero.hp,
        maxHp: hero.hp,
        shield: hero.shield,
        maxShield: hero.shield,
        alive: true,
        kills: 0,
        deaths: 0,
        fireCooldown: Math.random() * 0.8,
        aiState: 'advance',
        aiTargetPos: new THREE.Vector3(),
        aiStrafeDir: Math.random() > 0.5 ? 1 : -1,
        aiStrafeTimer: 0,
        frozenTimer: 0,
        blindTimer: 0,
        respawnTimer: 0
      });
    });
  }

  startNewRound() {
    const hero = this.getHeroData(this.selectedHeroId);
    this.player.alive = true;
    this.player.hp = hero.hp;
    this.player.shield = hero.shield;
    this.player.pos.set(
      (Math.random() - 0.5) * 14,
      0,
      this.player.team === 'alpha' ? 56 : -56
    );
    this.player.yaw = this.player.team === 'alpha' ? 0 : Math.PI;
    this.player.pitch = 0;
    const wpn = window.GAME_DATA.weapons[this.player.weaponId];
    this.player.ammo = wpn.magSize;

    // Reset Spike
    this.spike.planted = false;
    this.spike.defused = false;
    this.spike.exploded = false;
    this.spike.timer = 40;
    this.spike.interactProgress = 0;
    if (this.spike.mesh) {
      this.scene.remove(this.spike.mesh);
      this.spike.mesh = null;
    }

    this.roundTimer = 100;

    // Spawn all 5v5 entities at their team bases
    this.entities.forEach((ent, i) => {
      ent.alive = true;
      ent.hp = ent.maxHp;
      ent.shield = ent.maxShield;
      ent.mesh.visible = true;
      const spreadX = ((i % 5) - 2) * 5.5;
      const spawnZ = ent.team === 'alpha' ? 54 : -54;
      ent.pos.set(spreadX, 0, spawnZ);
      ent.mesh.position.copy(ent.pos);
      if (ent.mesh.userData.nameplate) {
        ent.mesh.userData.nameplate.userData.updateBar(ent.hp, ent.maxHp, ent.shield, ent.maxShield);
      }
      // Assign initial tactical objective (Site A or Site B or Mid)
      const laneChoice = i % 3 === 0 ? -42 : i % 3 === 1 ? 42 : 0;
      ent.aiTargetPos.set(laneChoice + (Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 16);
    });

    this.showBanner(`RODADA ${this.roundNumber} - COMBATE INICIADO!`);
    document.getElementById('hud-objective-box').innerHTML = `
      <h4>MODO ${this.mode === 'tactical_5v5' ? '5v5 TÁTICO (SPIKE)' : '5v5 ARENA HERO'}</h4>
      <p>• Elimine o esquadrão inimigo ou plante/desarme a Spike nos Sites A e B segurando <b>[F]</b>.<br>• Pressione <b>[B]</b> para Loja de Armas.</p>
    `;
  }

  // ==========================================================================
  // SEMI-OPEN WORLD CAMPAIGN CHAPTER SETUP
  // ==========================================================================
  setupCampaignChapter(mapCfg) {
    this.player.pos.set(0, 0, 62);
    this.player.yaw = 0;
    this.player.pitch = 0;
    this.campaign.hackedCount = 0;
    this.campaign.bossSpawned = false;
    this.campaign.bossDefeated = false;
    this.campaign.bossEntity = null;

    // Spawn Semi-Open World Enemy Patrol Squads guarding the 3 Relays
    const guardLocations = [
      { x: -42, z: -18, heroId: 'akira' },
      { x: -36, z: -26, heroId: 'ren' },
      { x: 42, z: 18, heroId: 'kaito' },
      { x: 36, z: 26, heroId: 'yuki' },
      { x: -12, z: 6, heroId: 'sora' },
      { x: 12, z: -6, heroId: 'hana' },
      { x: 0, z: -28, heroId: 'akira' }
    ];

    guardLocations.forEach((g, idx) => {
      const h = this.getHeroData(g.heroId);
      const mesh = window.MODELS.createHeroCharacterMesh(h, 'omega', `Guarda Eclipse #${idx + 1}`, false);
      mesh.position.set(g.x, 0, g.z);
      this.scene.add(mesh);

      this.entities.push({
        id: `camp_guard_${idx}`,
        name: `Guarda Eclipse #${idx + 1}`,
        team: 'omega',
        isBot: true,
        isBoss: false,
        heroId: g.heroId,
        heroData: h,
        mesh,
        pos: new THREE.Vector3(g.x, 0, g.z),
        vel: new THREE.Vector3(),
        yaw: 0,
        hp: 110,
        maxHp: 110,
        shield: 40,
        maxShield: 40,
        alive: true,
        kills: 0,
        deaths: 0,
        fireCooldown: 0.5,
        aiState: 'patrol',
        aiTargetPos: new THREE.Vector3(g.x, 0, g.z),
        aiStrafeDir: 1,
        aiStrafeTimer: 0,
        frozenTimer: 0,
        blindTimer: 0,
        respawnTimer: 0
      });
    });

    const story = mapCfg.campaignStory;
    this.showBanner(story.title);
    this.showVNDialogue(story.npcName, story.introLines[0]);
    this.updateCampaignObjectiveUI();
  }

  updateCampaignObjectiveUI() {
    const mapCfg = this.getMapData(this.selectedMapId);
    const story = mapCfg.campaignStory;
    const box = document.getElementById('hud-objective-box');
    if (!box) return;

    if (!this.campaign.bossSpawned) {
      box.innerHTML = `
        <h4>${story.title}</h4>
        <p>• Explore o mapa semi-aberto.<br>• Hackeie os Terminais Táticos segurando <b>[F]</b>: <b>(${this.campaign.hackedCount}/3)</b><br>• Patrulhas restantes: <b>${this.entities.filter(e => e.alive).length}</b></p>
      `;
    } else if (!this.campaign.bossDefeated) {
      const bossHp = this.campaign.bossEntity ? Math.max(0, Math.ceil(this.campaign.bossEntity.hp)) : 0;
      box.innerHTML = `
        <h4>ALERTA DE CHEFE DE CAPÍTULO!</h4>
        <p style="color:#ff2a6d;font-weight:700;">⚔️ Derrote ${story.bossName}!<br>HP do Chefe: ${bossHp}</p>
      `;
    } else {
      box.innerHTML = `
        <h4>CAPÍTULO CONCLUÍDO!</h4>
        <p style="color:#00f59b;">Setor libertado! Pressione <b>[ESC]</b> para avançar ao próximo Mapa da Campanha.</p>
      `;
    }
  }

  spawnCampaignBoss() {
    this.campaign.bossSpawned = true;
    const mapCfg = this.getMapData(this.selectedMapId);
    const story = mapCfg.campaignStory;
    const bossHero = this.getHeroData(story.bossHero);

    const mesh = window.MODELS.createHeroCharacterMesh(bossHero, 'omega', story.bossName, true);
    mesh.position.set(0, 3.3, 0);
    this.scene.add(mesh);

    const bossEnt = {
      id: 'campaign_boss',
      name: story.bossName,
      team: 'omega',
      isBot: true,
      isBoss: true,
      heroId: story.bossHero,
      heroData: bossHero,
      mesh,
      pos: new THREE.Vector3(0, 3.3, 0),
      vel: new THREE.Vector3(),
      yaw: 0,
      hp: story.bossHp,
      maxHp: story.bossHp,
      shield: 250,
      maxShield: 250,
      alive: true,
      kills: 0,
      deaths: 0,
      fireCooldown: 0.4,
      aiState: 'boss',
      aiTargetPos: new THREE.Vector3(0, 3.3, 0),
      aiStrafeDir: 1,
      aiStrafeTimer: 0,
      frozenTimer: 0,
      blindTimer: 0,
      respawnTimer: 0
    };

    this.entities.push(bossEnt);
    this.campaign.bossEntity = bossEnt;
    window.SOUND.playAbility('x');
    this.showBanner(`⚠️ CHEFE: ${story.bossName}!`);
    this.showVNDialogue(story.bossName, 'Vocês jamais tomarão este setor da Corporação Eclipse! Prepare-se para ser obliterado!');
    this.updateCampaignObjectiveUI();
  }

  // ==========================================================================
  // INTERACTIVE TUTORIAL MODE SETUP
  // ==========================================================================
  setupTutorialMode() {
    this.player.pos.set(0, 0, 42);
    this.player.yaw = 0;
    this.player.pitch = 0;
    this.tutorial.stepIndex = 0;
    this.tutorial.killsInStep = 0;
    this.tutorial.usedSkill = false;
    this.tutorial.usedUlt = false;

    // Create Glowing Waypoint on Central Platform for Step 1
    const wpGeo = new THREE.CylinderGeometry(2.2, 2.2, 5, 24, 1, true);
    const wpMat = new THREE.MeshBasicMaterial({
      color: '#05d5fa',
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    this.tutorial.waypointMesh = new THREE.Mesh(wpGeo, wpMat);
    this.tutorial.waypointMesh.position.set(0, 5.7, 0);
    this.scene.add(this.tutorial.waypointMesh);

    // Spawn 5 Training Drones / Bots
    const dronePositions = [
      [-12, -16], [0, -20], [12, -16], [-24, -10], [24, -10]
    ];
    dronePositions.forEach(([dx, dz], idx) => {
      const h = window.GAME_DATA.heroes[idx % window.GAME_DATA.heroes.length];
      const mesh = window.MODELS.createHeroCharacterMesh(h, 'omega', `Bot_Treino_${idx + 1}`, false);
      mesh.position.set(dx, 0, dz);
      this.scene.add(mesh);

      this.entities.push({
        id: `tut_bot_${idx}`,
        name: `Bot_Treino_${idx + 1}`,
        team: 'omega',
        isBot: true,
        isBoss: false,
        isTrainingBot: true,
        heroId: h.id,
        heroData: h,
        mesh,
        pos: new THREE.Vector3(dx, 0, dz),
        vel: new THREE.Vector3(),
        yaw: 0,
        hp: 100,
        maxHp: 100,
        shield: 25,
        maxShield: 25,
        alive: true,
        kills: 0,
        deaths: 0,
        fireCooldown: 999, // Training bots strafe but don't kill the student during tutorial
        aiState: 'strafe_only',
        aiTargetPos: new THREE.Vector3(dx, 0, dz),
        aiStrafeDir: idx % 2 === 0 ? 1 : -1,
        aiStrafeTimer: 0,
        frozenTimer: 0,
        blindTimer: 0,
        respawnTimer: 0
      });
    });

    this.refreshTutorialStepUI();
  }

  refreshTutorialStepUI() {
    const steps = window.GAME_DATA.tutorialSteps;
    const step = steps[this.tutorial.stepIndex];
    if (!step) {
      this.showBanner('🎓 TUTORIAL CONCLUÍDO! ACADEMIA LIVRE ATIVA!');
      this.showVNDialogue('Comandante Rei', 'Parabéns, Agente Graduado! Agora você pode treinar livremente aqui ou pressionar [ESC] para jogar o 5v5 Online ou Modo Campanha!');
      document.getElementById('hud-objective-box').innerHTML = `
        <h4>🎓 GRADUADO NA ACADEMIA AEGIS</h4>
        <p>• Treino Livre ativo! Os bots renascem automaticamente.<br>• Pressione <b>[B]</b> para testar qualquer arma.</p>
      `;
      return;
    }

    this.showBanner(step.title);
    this.showVNDialogue(step.speaker, step.dialogue);
    document.getElementById('hud-objective-box').innerHTML = `
      <h4>${step.title}</h4>
      <p>• ${step.objectiveText}</p>
    `;
  }

  advanceTutorialStep() {
    window.SOUND.playKillStreak(3);
    this.tutorial.stepIndex++;
    if (this.tutorial.stepIndex === 3) {
      this.player.ultCharge = 100;
    }
    this.refreshTutorialStepUI();
  }

  // ==========================================================================
  // WEAPON SHOOTING, BALLISTICS & HEADSHOT DETECTION
  // ==========================================================================
  tryShoot() {
    if (!this.player.alive || this.player.reloading || this.player.fireCooldown > 0) return;

    // Check if Akira's Ultimate Dragon Katana is active
    if (this.player.buffs.dragonKatanaTimer > 0) {
      this.fireDragonBladeWave();
      return;
    }

    const wpn = window.GAME_DATA.weapons[this.player.weaponId];
    if (this.player.ammo <= 0) {
      this.startReload();
      return;
    }

    this.player.ammo--;
    const rateMult = this.player.buffs.overshieldTimer > 0 ? 0.72 : 1.0;
    this.player.fireCooldown = wpn.fireRate * rateMult;

    window.SOUND.playShoot(this.player.weaponId);

    // Calculate CS2 / Valorant movement inaccuracy + recoil spread
    const moveSpeed = Math.hypot(this.player.vel.x, this.player.vel.z);
    let spread = wpn.spread;
    if (moveSpeed > 2.0) spread += 0.032;
    if (!this.player.onGround) spread += 0.055;
    if (this.player.crouching) spread *= 0.55;
    if (this.player.ads) spread *= 0.35;
    spread += this.player.dynamicSpread * 0.002;

    this.player.dynamicSpread = Math.min(22, this.player.dynamicSpread + 4.5);
    this.player.recoilKick = Math.min(0.14, this.player.recoilKick + wpn.recoil);
    this.player.pitch = Math.min(1.48, this.player.pitch + wpn.recoil * 0.45);

    // Raycast from Camera through slight spread cone
    const dir = new THREE.Vector3(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread,
      -1
    ).normalize();
    dir.applyQuaternion(this.camera.quaternion);

    const rayOrigin = this.camera.getWorldPosition(new THREE.Vector3());
    const raycaster = new THREE.Raycaster(rayOrigin, dir, 0.2, 220);

    // Collect enemy hitbox meshes & map wall meshes
    const wallMeshes = this.mapData ? this.mapData.colliders.map(c => c.mesh).filter(Boolean) : [];
    const wallHits = raycaster.intersectObjects(wallMeshes, false);
    const maxDist = wallHits.length > 0 ? wallHits[0].distance : 220;

    let hitEntity = null;
    let isHeadshot = false;
    let hitPoint = rayOrigin.clone().addScaledVector(dir, maxDist);
    let closestCharDist = maxDist;

    this.entities.forEach(ent => {
      if (!ent.alive || ent.team === this.player.team) return;
      const hits = raycaster.intersectObjects(ent.mesh.children, true);
      if (hits.length > 0 && hits[0].distance < closestCharDist) {
        closestCharDist = hits[0].distance;
        hitEntity = ent;
        hitPoint = hits[0].point;
        isHeadshot = hits[0].object.userData && hits[0].object.userData.hitboxType === 'head';
      }
    });

    // Spawn Anime Neon Bullet Tracer
    this.spawnBulletTracer(
      rayOrigin.clone().add(new THREE.Vector3(0, -0.1, 0)),
      hitPoint,
      wpn.color
    );

    if (hitEntity) {
      let dmg = wpn.damage * (isHeadshot ? wpn.headshotMult : 1.0);
      if (this.player.buffs.requiemTimer > 0) dmg *= 1.4;
      dmg = Math.round(dmg);

      this.applyDamageToEntity(hitEntity, dmg, isHeadshot, wpn.name);
      window.SOUND.playHit(isHeadshot);
      window.SETTINGS.triggerHitmarker(isHeadshot);
      this.spawnFloatingDamage(hitPoint, dmg, isHeadshot, false);

      // Lifesteal during Ren's Ultimate
      if (this.player.buffs.requiemTimer > 0) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + Math.round(dmg * 0.4));
      }
    }

    // Broadcast shot over network if in room
    if (window.NETWORK.inRoom) {
      window.NETWORK.sendPacket({
        type: 'SHOOT_FX',
        origin: [rayOrigin.x, rayOrigin.y, rayOrigin.z],
        target: [hitPoint.x, hitPoint.y, hitPoint.z],
        color: wpn.color
      });
    }

    this.updateHUD();
  }

  fireDragonBladeWave() {
    this.player.fireCooldown = 0.36;
    window.SOUND.playAbility('q');
    const origin = this.camera.getWorldPosition(new THREE.Vector3());
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const endPos = origin.clone().addScaledVector(dir, 36);
    this.spawnBulletTracer(origin, endPos, '#ff2a6d', 0.18);

    // Wide slash hitbox
    this.entities.forEach(ent => {
      if (!ent.alive || ent.team === this.player.team) return;
      const toEnt = ent.pos.clone().add(new THREE.Vector3(0, 1.1, 0)).sub(origin);
      const dist = toEnt.length();
      if (dist < 28 && toEnt.normalize().dot(dir) > 0.85) {
        this.applyDamageToEntity(ent, 135, true, 'Lâmina do Dragão Jin');
        window.SETTINGS.triggerHitmarker(true);
        this.spawnFloatingDamage(ent.pos.clone().add(new THREE.Vector3(0, 1.8, 0)), 135, true, true);
      }
    });
  }

  applyDamageToEntity(ent, dmg, isHeadshot, sourceName) {
    if (!ent.alive) return;

    let remaining = dmg;
    if (ent.shield > 0) {
      const absorbed = Math.min(ent.shield, remaining);
      ent.shield -= absorbed;
      remaining -= absorbed;
    }
    ent.hp -= remaining;

    this.player.ultCharge = Math.min(100, this.player.ultCharge + Math.ceil(dmg * 0.18));

    if (ent.mesh.userData.nameplate) {
      ent.mesh.userData.nameplate.userData.updateBar(ent.hp, ent.maxHp, ent.shield, ent.maxShield);
    }

    if (ent.hp <= 0) {
      ent.hp = 0;
      ent.alive = false;
      ent.deaths++;
      ent.mesh.visible = false;
      ent.respawnTimer = (this.mode === 'arena_5v5' || ent.isTrainingBot) ? 4.5 : 999;

      this.player.kills++;
      this.player.streak++;
      this.player.credits += 300;
      this.player.ultCharge = Math.min(100, this.player.ultCharge + 20);

      // Ren's Requiem resets cooldowns on kill
      if (this.player.buffs.requiemTimer > 0) {
        this.player.cooldowns = { q: 0, e: 0, c: 0 };
      }

      window.SOUND.playKillStreak(this.player.streak);
      this.addKillfeedItem(window.SETTINGS.config.playerName, ent.name, sourceName, isHeadshot);

      if (this.player.streak >= 5) {
        this.showBanner('🔥 ACE! ESQUADRÃO ANIQUILADO! 🔥');
      } else if (isHeadshot) {
        this.showBanner(`🎯 HEADSHOT! (${this.player.streak}K)`);
      }

      // Tutorial Step 2 check
      if (this.mode === 'tutorial' && this.tutorial.stepIndex === 1) {
        this.tutorial.killsInStep++;
        if (this.tutorial.killsInStep >= 3) {
          this.advanceTutorialStep();
        } else {
          document.getElementById('hud-objective-box').innerHTML = `
            <h4>2. Precisão de Tiro & Headshot</h4>
            <p>• Elimine 3 Bots/Drones de Treino com sua arma (${this.tutorial.killsInStep}/3)</p>
          `;
        }
      }

      // Campaign Boss check
      if (this.mode === 'campaign') {
        if (ent.isBoss) {
          this.campaign.bossDefeated = true;
          this.showBanner('🏆 CHEFE DE CAPÍTULO DERROTADO! SETOR LIBERTADO!');
          const nextIdx = (this.currentChapterIndex + 1) % window.GAME_DATA.maps.length;
          const nextMap = window.GAME_DATA.maps[nextIdx];
          this.showVNDialogue(
            'Comandante Rei',
            `Excelente trabalho! O setor está seguro. Pressione [ESC] ou clique em Próximo Capítulo no Menu de Campanha para viajar para: ${nextMap.name}!`
          );
        }
        this.updateCampaignObjectiveUI();
      }

      this.checkRoundWinCondition();
    } else if (this.mode === 'campaign' && ent.isBoss) {
      this.updateCampaignObjectiveUI();
    }
  }

  startReload() {
    const wpn = window.GAME_DATA.weapons[this.player.weaponId];
    if (this.player.reloading || this.player.ammo >= wpn.magSize || this.player.reserveAmmo <= 0) return;
    this.player.reloading = true;
    const speedMult = this.player.buffs.stimTimer > 0 ? 0.65 : 1.0;
    this.player.reloadTimer = wpn.reloadTime * speedMult;
    window.SOUND.playReload();

    if (this.mode === 'tutorial' && this.tutorial.stepIndex === 2) {
      this.advanceTutorialStep();
    }
  }

  // ==========================================================================
  // HERO ABILITIES & ULTIMATES ENGINE (ALL 6 HEROES / 24 POWERS)
  // ==========================================================================
  castAbility(slot) {
    if (!this.player.alive) return;
    const hero = this.getHeroData(this.selectedHeroId);
    const ab = hero.abilities[slot];
    if (!ab) return;

    if (slot === 'x') {
      if (this.player.ultCharge < 100) {
        this.showBanner('⚡ ULTIMATE AINDA CARREGANDO!');
        return;
      }
      this.player.ultCharge = 0;
    } else {
      if (this.player.cooldowns[slot] > 0) return;
      this.player.cooldowns[slot] = ab.cooldown;
    }

    window.SOUND.playAbility(slot);
    const origin = this.camera.getWorldPosition(new THREE.Vector3());
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const flatForward = new THREE.Vector3(forward.x, 0, forward.z).normalize();

    if (slot === 'x') {
      this.triggerScreenVignette('fx-ult-vignette');
      this.showBanner(`✨ ULTIMATE: ${ab.name}! ✨`);
    }

    // Track Tutorial Step 4
    if (this.mode === 'tutorial' && this.tutorial.stepIndex === 3) {
      if (slot === 'x') this.tutorial.usedUlt = true;
      else this.tutorial.usedSkill = true;
      if (this.tutorial.usedSkill && this.tutorial.usedUlt) {
        this.advanceTutorialStep();
      }
    }

    // Execute Hero-Specific Ability Logic
    const hid = this.selectedHeroId;

    if (hid === 'akira') {
      if (slot === 'q') {
        // Shunpo Lightning Dash
        this.player.vel.addScaledVector(flatForward, 26);
        this.player.vel.y = 3.5;
        this.spawnAreaSphereEffect(this.player.pos.clone().add(new THREE.Vector3(0, 1, 0)), 2.2, '#05d5fa', 0.45);
      } else if (slot === 'e') {
        // 3 Explosive Plasma Kunai Fan
        [-0.12, 0, 0.12].forEach(angleOffset => {
          const kDir = forward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angleOffset);
          const targetPoint = origin.clone().addScaledVector(kDir, 26);
          this.spawnBulletTracer(origin, targetPoint, '#ff2a6d', 0.12);
          this.damageEnemiesNearPoint(targetPoint, 6.5, 55, 'Kunais de Plasma');
        });
      } else if (slot === 'c') {
        // Katana Deflect Stance
        this.player.buffs.deflectTimer = 2.6;
        this.showBanner('⚔️ POSTURA DEFLETORA ATIVA!');
      } else if (slot === 'x') {
        // Dragon Jin Overdrive
        this.player.buffs.dragonKatanaTimer = 8.0;
        if (this.viewmodel) {
          const w = this.viewmodel.getObjectByName('vm_weapon');
          const k = this.viewmodel.getObjectByName('vm_katana');
          if (w) w.visible = false;
          if (k) k.visible = true;
        }
      }
    } else if (hid === 'sora') {
      const targetPos = origin.clone().addScaledVector(forward, 18);
      targetPos.y = Math.max(1.5, targetPos.y);
      if (slot === 'q') {
        // Cosmic Smoke Dome
        this.spawnAreaSphereEffect(targetPos, 6.2, '#b537f2', 7.0, 'smoke');
      } else if (slot === 'e') {
        // Gravity Well Vortex
        this.spawnAreaSphereEffect(targetPos, 5.5, '#00f5d4', 4.5, 'gravity_well');
      } else if (slot === 'c') {
        // Dimensional Blink Teleport
        this.player.pos.addScaledVector(flatForward, 11);
        this.player.pos.y += 4.5;
        this.player.vel.y = 4;
      } else if (slot === 'x') {
        // Event Horizon Orbital Singularity
        this.spawnAreaSphereEffect(targetPos, 11.0, '#b537f2', 6.0, 'singularity');
        this.damageEnemiesNearPoint(targetPos, 12.0, 110, 'Horizonte de Eventos');
      }
    } else if (hid === 'kaito') {
      if (slot === 'q') {
        // Hexagonal Energy Barrier Wall
        const wallPos = this.player.pos.clone().addScaledVector(flatForward, 4.5);
        wallPos.y += 1.8;
        const wallMesh = new THREE.Mesh(
          new THREE.BoxGeometry(7.5, 3.8, 0.35),
          new THREE.MeshBasicMaterial({ color: '#05d5fa', transparent: true, opacity: 0.55 })
        );
        wallMesh.position.copy(wallPos);
        wallMesh.rotation.y = this.player.yaw;
        this.scene.add(wallMesh);
        this.activeEffects.push({ type: 'barrier', mesh: wallMesh, timer: 8.0, pos: wallPos });
      } else if (slot === 'e') {
        // Deploy Auto-Turret Pochi-MK2
        const tPos = this.player.pos.clone().addScaledVector(flatForward, 3.2);
        const tGroup = new THREE.Group();
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 0.9, 12), window.MODELS.createAnimeMaterial('#05d5fa'));
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.9), window.MODELS.createAnimeMaterial('#ffd166'));
        head.position.y = 0.7;
        tGroup.add(base, head);
        tGroup.position.copy(tPos);
        this.scene.add(tGroup);
        this.activeEffects.push({ type: 'turret', mesh: tGroup, timer: 14.0, pos: tPos, fireCd: 0.5 });
      } else if (slot === 'c') {
        // Nano-Repair Field
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 60);
        this.player.shield = Math.min(this.player.maxShield, this.player.shield + 40);
        this.triggerScreenVignette('fx-heal-vignette');
      } else if (slot === 'x') {
        // Aegis Core Overcharge
        this.player.maxShield = 150;
        this.player.shield = 150;
        this.player.buffs.overshieldTimer = 10.0;
        this.entities.filter(e => e.team === this.player.team && e.alive).forEach(ally => {
          ally.shield = 150;
        });
      }
    } else if (hid === 'yuki') {
      const targetPos = origin.clone().addScaledVector(forward, 22);
      if (slot === 'q') {
        // Cryo-Sonar Recon Arrow
        this.player.buffs.sonarTimer = 6.0;
        this.spawnAreaSphereEffect(targetPos, 14.0, '#4cc9f0', 1.2);
        this.showBanner('📡 SONAR CRIO-ATIVADO: INIMIGOS REVELADOS!');
      } else if (slot === 'e') {
        // Blizzard Grenade
        targetPos.y = 0.5;
        this.spawnAreaSphereEffect(targetPos, 6.5, '#4cc9f0', 5.0, 'blizzard');
        this.damageEnemiesNearPoint(targetPos, 7.0, 45, 'Granada Nevasca', true);
      } else if (slot === 'c') {
        // Updraft Tailwind
        this.player.vel.y = 14.5;
        this.player.onGround = false;
      } else if (slot === 'x') {
        // Absolute Zero Freeze Storm
        this.spawnBulletTracer(origin, targetPos, '#4cc9f0', 0.45);
        this.damageEnemiesNearPoint(targetPos, 14.0, 125, 'Zero Absoluto', true);
      }
    } else if (hid === 'ren') {
      const targetPos = origin.clone().addScaledVector(forward, 16);
      if (slot === 'q') {
        // Phoenix Flashbang Orb
        this.spawnAreaSphereEffect(targetPos, 4.0, '#ff9f1c', 0.6);
        this.entities.forEach(ent => {
          if (ent.alive && ent.team !== this.player.team && ent.pos.distanceTo(targetPos) < 18) {
            ent.blindTimer = 3.5;
          }
        });
        this.showBanner('☀️ ORBE FÊNIX: INIMIGOS CEGADOS!');
      } else if (slot === 'e') {
        // Shadow Cloak Stealth
        this.player.buffs.stealthTimer = 4.5;
        this.showBanner('🌑 MANTO DAS SOMBRAS (FURTIVO)!');
      } else if (slot === 'c') {
        // Soul Siphon Drain
        this.damageEnemiesNearPoint(targetPos, 10.0, 50, 'Sifão de Alma');
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 50);
        this.triggerScreenVignette('fx-heal-vignette');
      } else if (slot === 'x') {
        // Phantom Requiem
        this.player.buffs.requiemTimer = 9.0;
      }
    } else if (hid === 'hana') {
      if (slot === 'q') {
        // Healing Melody Wave
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 75);
        this.entities.filter(e => e.team === this.player.team && e.alive).forEach(ally => {
          ally.hp = Math.min(ally.maxHp, ally.hp + 75);
        });
        this.triggerScreenVignette('fx-heal-vignette');
      } else if (slot === 'e') {
        // Sonic Repulsor Knockback
        const pulseCenter = this.player.pos.clone().addScaledVector(flatForward, 5);
        this.spawnAreaSphereEffect(pulseCenter, 5.5, '#ff70a6', 0.5);
        this.entities.forEach(ent => {
          if (ent.alive && ent.team !== this.player.team && ent.pos.distanceTo(this.player.pos) < 14) {
            const pushDir = ent.pos.clone().sub(this.player.pos).normalize();
            ent.pos.addScaledVector(pushDir, 9.0);
            this.applyDamageToEntity(ent, 60, false, 'Repulsor Sônico');
          }
        });
      } else if (slot === 'c') {
        // Arcane Stim Beacon
        this.player.buffs.stimTimer = 6.5;
        this.showBanner('🎵 ESTÍMULO NEON: VELOCIDADE +35%!');
      } else if (slot === 'x') {
        // Supernova Resurrection & Full Heal
        this.player.hp = this.player.maxHp;
        this.player.shield = this.player.maxShield;
        let revivedCount = 0;
        this.entities.filter(e => e.team === this.player.team).forEach(ally => {
          if (!ally.alive) {
            ally.alive = true;
            ally.mesh.visible = true;
            revivedCount++;
          }
          ally.hp = ally.maxHp;
          ally.shield = ally.maxShield;
        });
        this.triggerScreenVignette('fx-heal-vignette');
        this.showBanner(`🌟 SUPERNOVA! ${revivedCount > 0 ? revivedCount + ' ALIADOS REVIVIDOS!' : 'ESQUADRÃO RESTAURADO!'}`);
      }
    }

    this.updateHUD();
  }

  damageEnemiesNearPoint(center, radius, dmg, abilityName, freeze = false) {
    this.entities.forEach(ent => {
      if (!ent.alive || ent.team === this.player.team) return;
      if (ent.pos.distanceTo(center) <= radius) {
        if (freeze) ent.frozenTimer = 3.5;
        this.applyDamageToEntity(ent, dmg, false, abilityName);
        this.spawnFloatingDamage(ent.pos.clone().add(new THREE.Vector3(0, 1.6, 0)), dmg, false, true);
      }
    });
  }

  spawnBulletTracer(start, end, colorHex, thickness = 0.045) {
    const dist = start.distanceTo(end);
    const geo = new THREE.CylinderGeometry(thickness, thickness, dist, 6);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(start).lerp(end, 0.5);
    mesh.lookAt(end);
    this.scene.add(mesh);
    this.activeEffects.push({ type: 'tracer', mesh, timer: 0.085 });
  }

  spawnAreaSphereEffect(pos, radius, colorHex, duration, effectType = 'burst') {
    const geo = new THREE.SphereGeometry(radius, 20, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: effectType === 'smoke' ? 0.68 : 0.36,
      wireframe: effectType === 'singularity'
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    this.scene.add(mesh);
    this.activeEffects.push({
      type: effectType,
      mesh,
      pos: pos.clone(),
      radius,
      timer: duration,
      dmgTick: 0.4
    });
  }

  // ==========================================================================
  // MAIN GAME LOOP & PHYSICS / AI / SPIKE / CAMPAIGN UPDATES
  // ==========================================================================
  animate() {
    requestAnimationFrame(() => this.animate());
    const dt = Math.min(0.05, this.clock.getDelta());
    this.fpsCounter = Math.round(0.9 * this.fpsCounter + 0.1 * (1 / Math.max(0.001, dt)));

    // Poll Gamepad every frame
    const pad = window.SETTINGS.pollGamepad();

    if (this.state === 'MENU') {
      if (this.menuShowcaseGroup && this.menuShowcaseGroup.userData.charMesh) {
        this.menuShowcaseGroup.userData.charMesh.rotation.y += dt * 0.65;
      }
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (this.state === 'PLAYING') {
      this.updatePlayerMovementAndInput(dt, pad);
      this.updateActiveEffects(dt);
      this.updateEntitiesAndBotAI(dt);
      this.updateSpikeAndObjectives(dt, pad);
      this.updateCameraAndViewmodel(dt);
      this.renderHUDCanvases(dt);
    }

    this.renderer.render(this.scene, this.camera);
  }

  updatePlayerMovementAndInput(dt, pad) {
    // Handle Gamepad actions if connected
    if (pad) {
      if (pad.pause) {
        this.pauseGame();
        return;
      }
      const cfg = window.SETTINGS.config;
      const lookSpeed = cfg.padSens * (this.player.ads ? cfg.adsSens : 1.0) * 2.4 * dt;
      this.player.yaw -= pad.lookX * lookSpeed;
      const pDelta = pad.lookY * lookSpeed * (cfg.invertY ? -1 : 1);
      this.player.pitch = Math.max(-1.48, Math.min(1.48, this.player.pitch - pDelta));

      // Controller Magnetic Aim Assist toward closest visible enemy near crosshair
      if (cfg.padAimAssist > 0 && (Math.abs(pad.lookX) > 0.05 || pad.ads || pad.shoot)) {
        this.applyGamepadAimAssist(dt, cfg.padAimAssist);
      }

      if (pad.ads !== this.rightMouseDown) {
        this.rightMouseDown = pad.ads;
        this.setADS(pad.ads);
      }
      if (pad.shoot) this.tryShoot();
      if (pad.reloadOrInteract) this.startReload();
      if (pad.abilityQ) this.castAbility('q');
      if (pad.abilityE) this.castAbility('e');
      if (pad.abilityC) this.castAbility('c');
      if (pad.ultimate) this.castAbility('x');
      if (pad.buyMenu) this.toggleBuyMenu();
    }

    // Continuous auto-fire for automatic weapons
    const wpn = window.GAME_DATA.weapons[this.player.weaponId];
    if (this.mouseDown && wpn && wpn.auto) {
      this.tryShoot();
    }

    // Update timers & buffs
    if (this.player.fireCooldown > 0) this.player.fireCooldown -= dt;
    this.player.dynamicSpread = Math.max(0, this.player.dynamicSpread - dt * 28);
    this.player.recoilKick = Math.max(0, this.player.recoilKick - dt * 0.45);

    ['q', 'e', 'c'].forEach(k => {
      if (this.player.cooldowns[k] > 0) {
        this.player.cooldowns[k] = Math.max(0, this.player.cooldowns[k] - dt);
      }
    });

    Object.keys(this.player.buffs).forEach(bKey => {
      if (this.player.buffs[bKey] > 0) {
        this.player.buffs[bKey] = Math.max(0, this.player.buffs[bKey] - dt);
        if (bKey === 'dragonKatanaTimer' && this.player.buffs[bKey] === 0 && this.viewmodel) {
          const w = this.viewmodel.getObjectByName('vm_weapon');
          const k = this.viewmodel.getObjectByName('vm_katana');
          if (w) w.visible = true;
          if (k) k.visible = false;
        }
      }
    });

    if (this.player.reloading) {
      this.player.reloadTimer -= dt;
      if (this.player.reloadTimer <= 0) {
        this.player.reloading = false;
        const needed = wpn.magSize - this.player.ammo;
        const taken = Math.min(needed, this.player.reserveAmmo);
        this.player.ammo += taken;
        this.player.reserveAmmo -= taken;
      }
    }

    if (!this.player.alive) return;

    // Movement vector (WASD + Controller Left Stick)
    let moveForward = 0;
    let moveRight = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveForward += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveForward -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveRight += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveRight -= 1;

    if (pad) {
      moveRight += pad.moveX;
      moveForward -= pad.moveZ;
    }

    this.player.crouching = !!(this.keys['ControlLeft'] || this.keys['KeyZ'] || (pad && pad.crouch));
    this.player.sprinting = !!(this.keys['ShiftLeft'] || (pad && pad.sprint)) && !this.player.crouching && !this.player.ads;

    const hero = this.getHeroData(this.selectedHeroId);
    let baseSpeed = 9.2 * hero.speed;
    if (this.player.sprinting) baseSpeed *= 1.35;
    if (this.player.crouching) baseSpeed *= 0.58;
    if (this.player.buffs.dragonKatanaTimer > 0 || this.player.buffs.stealthTimer > 0 || this.player.buffs.stimTimer > 0) {
      baseSpeed *= 1.35;
    }

    const forwardVec = new THREE.Vector3(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw));
    const rightVec = new THREE.Vector3(Math.cos(this.player.yaw), 0, -Math.sin(this.player.yaw));
    const wishDir = new THREE.Vector3()
      .addScaledVector(forwardVec, moveForward)
      .addScaledVector(rightVec, moveRight);
    if (wishDir.lengthSq() > 1) wishDir.normalize();

    this.player.vel.x = THREE.MathUtils.lerp(this.player.vel.x, wishDir.x * baseSpeed, dt * 12);
    this.player.vel.z = THREE.MathUtils.lerp(this.player.vel.z, wishDir.z * baseSpeed, dt * 12);

    // Jump & Gravity
    if ((this.keys['Space'] || (pad && pad.jump)) && this.player.onGround) {
      this.player.vel.y = 9.6;
      this.player.onGround = false;
    }
    this.player.vel.y -= 24.0 * dt;

    // Apply & Resolve Map Colliders + Ramps + Jump Pads
    const nextX = this.player.pos.x + this.player.vel.x * dt;
    const nextZ = this.player.pos.z + this.player.vel.z * dt;
    let floorY = 0;

    if (this.mapData) {
      // Check walkable ramps
      this.mapData.ramps.forEach(r => {
        if (nextX >= r.minX && nextX <= r.maxX && nextZ >= r.minZ && nextZ <= r.maxZ) {
          const t = r.dirZ < 0
            ? (r.maxZ - nextZ) / (r.maxZ - r.minZ)
            : (nextZ - r.minZ) / (r.maxZ - r.minZ);
          floorY = Math.max(floorY, Math.max(0, Math.min(r.topY, t * r.topY)));
        }
      });

      // Check solid AABB colliders
      const pRadius = 0.55;
      this.mapData.colliders.forEach(box => {
        if (
          nextX + pRadius > box.minX &&
          nextX - pRadius < box.maxX &&
          nextZ + pRadius > box.minZ &&
          nextZ - pRadius < box.maxZ
        ) {
          if (this.player.pos.y >= box.maxY - 0.35) {
            floorY = Math.max(floorY, box.maxY);
          } else if (this.player.pos.y + 1.7 > box.minY) {
            // Horizontal pushback
            if (this.player.pos.x + pRadius <= box.minX || this.player.pos.x - pRadius >= box.maxX) {
              this.player.vel.x = 0;
            }
            if (this.player.pos.z + pRadius <= box.minZ || this.player.pos.z - pRadius >= box.maxZ) {
              this.player.vel.z = 0;
            }
          }
        }
      });

      // Check Jump Pads
      this.mapData.jumpPads.forEach(padObj => {
        if (Math.hypot(this.player.pos.x - padObj.x, this.player.pos.z - padObj.z) < padObj.radius && this.player.pos.y < 1.5) {
          this.player.vel.y = padObj.force;
          this.player.onGround = false;
          window.SOUND.playAbility('c');
        }
      });
    }

    this.player.pos.x += this.player.vel.x * dt;
    this.player.pos.z += this.player.vel.z * dt;
    this.player.pos.y += this.player.vel.y * dt;

    if (this.player.pos.y <= floorY) {
      this.player.pos.y = floorY;
      this.player.vel.y = 0;
      this.player.onGround = true;
    }

    // Tutorial Step 1 Waypoint Check
    if (this.mode === 'tutorial' && this.tutorial.stepIndex === 0) {
      if (Math.hypot(this.player.pos.x, this.player.pos.z) < 4.5) {
        if (this.tutorial.waypointMesh) this.tutorial.waypointMesh.visible = false;
        this.advanceTutorialStep();
      }
    }

    this.updateHUD();
  }

  applyGamepadAimAssist(dt, strength) {
    const camPos = this.camera.getWorldPosition(new THREE.Vector3());
    const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    let bestEnt = null;
    let bestDot = 0.94;

    this.entities.forEach(ent => {
      if (!ent.alive || ent.team === this.player.team) return;
      const targetChest = ent.pos.clone().add(new THREE.Vector3(0, 1.35, 0));
      const toTarget = targetChest.sub(camPos).normalize();
      const dot = camForward.dot(toTarget);
      if (dot > bestDot) {
        bestDot = dot;
        bestEnt = ent;
      }
    });

    if (bestEnt) {
      const dx = bestEnt.pos.x - this.player.pos.x;
      const dz = bestEnt.pos.z - this.player.pos.z;
      const desiredYaw = Math.atan2(-dx, -dz);
      let diff = desiredYaw - this.player.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.player.yaw += diff * dt * 3.5 * strength;
    }
  }

  updateCameraAndViewmodel(dt) {
    const eyeHeight = this.player.crouching ? 1.15 : 1.72;
    this.camera.position.set(this.player.pos.x, this.player.pos.y + eyeHeight, this.player.pos.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.player.yaw;
    this.camera.rotation.x = this.player.pitch;

    if (this.viewmodel) {
      const speed = Math.hypot(this.player.vel.x, this.player.vel.z);
      const bobTime = performance.now() * 0.01;
      const bobAmt = this.player.onGround ? Math.min(1, speed / 9) * 0.018 : 0;
      const adsOffsetX = this.player.ads ? -0.14 : 0;
      const reloadDipY = this.player.reloading ? -0.22 : 0;

      this.viewmodel.position.set(
        adsOffsetX + Math.cos(bobTime) * bobAmt,
        reloadDipY + Math.abs(Math.sin(bobTime)) * bobAmt - this.player.recoilKick * 0.35,
        this.player.recoilKick * 0.85
      );
      this.viewmodel.rotation.x = this.player.reloading ? -0.45 : this.player.recoilKick * 1.4;
    }
  }

  updateActiveEffects(dt) {
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const ef = this.activeEffects[i];
      ef.timer -= dt;

      if (ef.type === 'gravity_well' || ef.type === 'singularity') {
        ef.mesh.rotation.y += dt * 3.5;
        this.entities.forEach(ent => {
          if (ent.alive && ent.team !== this.player.team && ent.pos.distanceTo(ef.pos) < ef.radius + 3) {
            const pull = ef.pos.clone().sub(ent.pos).setY(0).normalize();
            ent.pos.addScaledVector(pull, dt * 6.5);
          }
        });
      } else if (ef.type === 'turret') {
        ef.fireCd -= dt;
        if (ef.fireCd <= 0) {
          const target = this.entities.find(e => e.alive && e.team !== this.player.team && e.pos.distanceTo(ef.pos) < 28);
          if (target) {
            ef.fireCd = 0.65;
            const start = ef.pos.clone().add(new THREE.Vector3(0, 0.9, 0));
            const end = target.pos.clone().add(new THREE.Vector3(0, 1.2, 0));
            this.spawnBulletTracer(start, end, '#ffd166', 0.03);
            this.applyDamageToEntity(target, 18, false, 'Torreta Pochi-MK2');
          }
        }
      }

      if (ef.timer <= 0) {
        this.scene.remove(ef.mesh);
        this.activeEffects.splice(i, 1);
      }
    }

    // Rotate orbital core if on Map 5
    if (this.mapData && this.mapData.mapGroup) {
      const core = this.mapData.mapGroup.getObjectByName('orbital_core');
      if (core) {
        core.rotation.y += dt * 0.8;
        core.rotation.x += dt * 0.4;
      }
    }
  }

  // ==========================================================================
  // SMART 5v5 BOT AI & CHARACTER ANIMATION
  // ==========================================================================
  updateEntitiesAndBotAI(dt) {
    const diffMult = window.NETWORK.matchConfig.botDifficulty === 'hard'
      ? 1.35
      : window.NETWORK.matchConfig.botDifficulty === 'easy'
      ? 0.65
      : 1.0;

    this.entities.forEach(ent => {
      if (!ent.alive) {
        if (ent.respawnTimer < 500) {
          ent.respawnTimer -= dt;
          if (ent.respawnTimer <= 0) {
            ent.alive = true;
            ent.hp = ent.maxHp;
            ent.shield = ent.maxShield;
            ent.mesh.visible = true;
            if (!ent.isTrainingBot) {
              ent.pos.set((Math.random() - 0.5) * 20, 0, ent.team === 'alpha' ? 54 : -54);
            }
            if (ent.mesh.userData.nameplate) {
              ent.mesh.userData.nameplate.userData.updateBar(ent.hp, ent.maxHp, ent.shield, ent.maxShield);
            }
          }
        }
        return;
      }

      if (ent.frozenTimer > 0) {
        ent.frozenTimer -= dt;
        return;
      }
      if (ent.blindTimer > 0) ent.blindTimer -= dt;

      if (ent.isBot) {
        // Find closest opposing target (Player or opposing Bot)
        let targetPos = null;
        let targetIsPlayer = false;
        let closestDist = 95;

        if (ent.team !== this.player.team && this.player.alive && this.player.buffs.stealthTimer <= 0) {
          const d = ent.pos.distanceTo(this.player.pos);
          if (d < closestDist) {
            closestDist = d;
            targetPos = this.player.pos;
            targetIsPlayer = true;
          }
        }

        this.entities.forEach(other => {
          if (!other.alive || other.team === ent.team) return;
          const d = ent.pos.distanceTo(other.pos);
          if (d < closestDist) {
            closestDist = d;
            targetPos = other.pos;
            targetIsPlayer = false;
          }
        });

        // Movement & Strafe behavior
        ent.aiStrafeTimer -= dt;
        if (ent.aiStrafeTimer <= 0) {
          ent.aiStrafeDir *= -1;
          ent.aiStrafeTimer = 1.2 + Math.random() * 1.4;
        }

        const speed = ent.isBoss ? 6.5 : 5.8;
        if (ent.aiState === 'strafe_only') {
          ent.pos.x += ent.aiStrafeDir * 3.8 * dt;
          ent.yaw = 0;
        } else if (targetPos && closestDist < 38) {
          // Face target & tactical strafe
          const toT = targetPos.clone().sub(ent.pos);
          ent.yaw = Math.atan2(toT.x, toT.z);
          const strafeVec = new THREE.Vector3(Math.cos(ent.yaw), 0, -Math.sin(ent.yaw));
          ent.pos.addScaledVector(strafeVec, ent.aiStrafeDir * speed * 0.65 * dt);
          if (closestDist > 16) {
            ent.pos.addScaledVector(toT.normalize().setY(0), speed * 0.55 * dt);
          }

          // Bot Shooting
          if (ent.blindTimer <= 0) {
            ent.fireCooldown -= dt * diffMult;
            if (ent.fireCooldown <= 0) {
              ent.fireCooldown = (ent.isBoss ? 0.42 : 0.78) + Math.random() * 0.35;
              const start = ent.pos.clone().add(new THREE.Vector3(0, 1.35, 0));
              const end = targetPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.4, 1.1, (Math.random() - 0.5) * 1.4));
              this.spawnBulletTracer(start, end, ent.team === 'alpha' ? '#05d5fa' : '#ff2a6d', 0.032);

              const hitChance = (ent.isBoss ? 0.58 : 0.38) * diffMult;
              if (Math.random() < hitChance) {
                const dmg = ent.isBoss ? 22 : 14;
                if (targetIsPlayer) {
                  this.damageLocalPlayer(dmg, ent.name);
                } else {
                  const victim = this.entities.find(o => o.pos === targetPos);
                  if (victim) this.applyBotToBotDamage(ent, victim, dmg);
                }
              }
            }
          }
        } else if (ent.aiState !== 'patrol') {
          // Advance toward objective / site
          const toGoal = ent.aiTargetPos.clone().sub(ent.pos).setY(0);
          if (toGoal.length() > 3) {
            toGoal.normalize();
            ent.pos.addScaledVector(toGoal, speed * dt);
            ent.yaw = Math.atan2(toGoal.x, toGoal.z);
          } else {
            ent.aiTargetPos.set((Math.random() - 0.5) * 70, 0, (Math.random() - 0.5) * 40);
          }
        }
      }

      // Clamp inside arena bounds
      ent.pos.x = Math.max(-74, Math.min(74, ent.pos.x));
      ent.pos.z = Math.max(-74, Math.min(74, ent.pos.z));
      ent.mesh.position.copy(ent.pos);
      ent.mesh.rotation.y = ent.yaw;

      // Animate legs & arms while moving
      const walkCycle = performance.now() * 0.008;
      if (ent.mesh.userData.leftLeg && ent.mesh.userData.rightLeg) {
        ent.mesh.userData.leftLeg.rotation.x = Math.sin(walkCycle) * 0.45;
        ent.mesh.userData.rightLeg.rotation.x = -Math.sin(walkCycle) * 0.45;
      }
    });
  }

  applyBotToBotDamage(attacker, victim, dmg) {
    victim.hp -= dmg;
    if (victim.mesh.userData.nameplate) {
      victim.mesh.userData.nameplate.userData.updateBar(victim.hp, victim.maxHp, victim.shield, victim.maxShield);
    }
    if (victim.hp <= 0) {
      victim.alive = false;
      victim.mesh.visible = false;
      victim.deaths++;
      attacker.kills++;
      victim.respawnTimer = this.mode === 'arena_5v5' ? 4.5 : 999;
      this.addKillfeedItem(attacker.name, victim.name, attacker.heroData.defaultWeapon, false);
      this.checkRoundWinCondition();
    }
  }

  damageLocalPlayer(dmg, attackerName) {
    if (!this.player.alive) return;
    if (this.player.buffs.deflectTimer > 0) {
      dmg = Math.round(dmg * 0.15);
    }

    let rem = dmg;
    if (this.player.shield > 0) {
      const abs = Math.min(this.player.shield, rem);
      this.player.shield -= abs;
      rem -= abs;
    }
    this.player.hp -= rem;
    this.triggerScreenVignette('fx-damage-vignette');

    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.player.alive = false;
      this.player.deaths++;
      this.player.streak = 0;
      this.addKillfeedItem(attackerName, window.SETTINGS.config.playerName, 'Rifle Tático', false);

      if (this.mode === 'arena_5v5' || this.mode === 'campaign' || this.mode === 'tutorial') {
        this.showBanner('⚠️ VOCÊ FOI ABATIDO! RENASCENDO EM 3s...');
        setTimeout(() => {
          if (this.state !== 'PLAYING') return;
          this.player.alive = true;
          this.player.hp = this.player.maxHp;
          this.player.shield = this.player.maxShield;
          this.player.pos.set(0, 0, 56);
        }, 3000);
      } else {
        this.showBanner('💀 ABATIDO NA RODADA! AGUARDANDO PRÓXIMA RODADA...');
        this.checkRoundWinCondition();
      }
    }
  }

  checkRoundWinCondition() {
    if (this.mode !== 'tactical_5v5' && this.mode !== 'arena_5v5') return;

    if (this.mode === 'arena_5v5') {
      const alphaKills = this.player.kills + this.entities.filter(e => e.team === 'alpha').reduce((s, e) => s + e.kills, 0);
      const omegaKills = this.entities.filter(e => e.team === 'omega').reduce((s, e) => s + e.kills, 0);
      this.scoreAlpha = alphaKills;
      this.scoreOmega = omegaKills;
      return;
    }

    const alphaAlive = (this.player.team === 'alpha' && this.player.alive ? 1 : 0) +
      this.entities.filter(e => e.team === 'alpha' && e.alive).length;
    const omegaAlive = (this.player.team === 'omega' && this.player.alive ? 1 : 0) +
      this.entities.filter(e => e.team === 'omega' && e.alive).length;

    if (omegaAlive === 0 && !this.spike.exploded) {
      this.endRound('alpha', 'ESQUADRÃO ALFA VENCEU A RODADA!');
    } else if (alphaAlive === 0 && !this.spike.planted) {
      this.endRound('omega', 'ESQUADRÃO OMEGA VENCEU A RODADA!');
    }
  }

  endRound(winnerTeam, bannerText) {
    if (winnerTeam === 'alpha') this.scoreAlpha++;
    else this.scoreOmega++;

    this.player.credits = Math.min(9000, this.player.credits + 2400);
    this.roundNumber++;
    this.showBanner(bannerText);
    window.SOUND.playKillStreak(4);

    setTimeout(() => {
      if (this.state === 'PLAYING' && this.mode === 'tactical_5v5') {
        this.startNewRound();
      }
    }, 3500);
  }

  // ==========================================================================
  // SPIKE PLANT / DEFUSE & CAMPAIGN TERMINAL HACKING ([F] KEY)
  // ==========================================================================
  updateSpikeAndObjectives(dt, pad) {
    const holdingInteract = !!(this.keys['KeyF'] || (pad && pad.reloadOrInteract));
    const interBar = document.getElementById('hud-interaction-bar');
    const interLabel = document.getElementById('interaction-label');
    const interFill = document.getElementById('interaction-progress-fill');

    // Round Clock update
    if (this.mode === 'tactical_5v5') {
      if (!this.spike.planted) {
        this.roundTimer = Math.max(0, this.roundTimer - dt);
        if (this.roundTimer === 0) {
          this.endRound('omega', 'TEMPO ESGOTADO! DEFENSORES VENCEM!');
        }
      } else if (!this.spike.defused && !this.spike.exploded) {
        this.spike.timer -= dt;
        this.spike.beepTimer -= dt;
        if (this.spike.beepTimer <= 0) {
          this.spike.beepTimer = this.spike.timer < 10 ? 0.25 : 0.75;
          window.SOUND.playSpikeBeep(this.spike.timer < 10);
        }
        if (this.spike.timer <= 0) {
          this.spike.exploded = true;
          this.spawnAreaSphereEffect(this.spike.pos, 26, '#ff2a6d', 2.0);
          this.endRound('alpha', '💥 SPIKE DETONADA! ATACANTES VENCEM!');
        }
      }
    }

    // Check Campaign Terminals ([F])
    if (this.mode === 'campaign' && this.mapData && this.mapData.campaignTerminals) {
      const nearTerm = this.mapData.campaignTerminals.find(
        t => !t.hacked && Math.hypot(this.player.pos.x - t.x, this.player.pos.z - t.z) < 4.5
      );
      if (nearTerm) {
        interBar.classList.remove('hidden');
        interLabel.textContent = holdingInteract
          ? `HACKEANDO ${nearTerm.label}...`
          : `SEGURE [F] PARA HACKEAR ${nearTerm.label}`;
        if (holdingInteract) {
          this.campaign.interactProgress += dt / 2.2;
          interFill.style.width = `${Math.min(100, this.campaign.interactProgress * 100)}%`;
          if (this.campaign.interactProgress >= 1) {
            nearTerm.hacked = true;
            nearTerm.beaconRing.material.color.set('#05d5fa');
            this.campaign.interactProgress = 0;
            this.campaign.hackedCount++;
            this.player.credits += 1000;
            window.SOUND.playKillStreak(2);
            this.showBanner(`🔓 TERMINAL HACKEADO (${this.campaign.hackedCount}/3)!`);
            if (this.campaign.hackedCount >= 3 && !this.campaign.bossSpawned) {
              this.spawnCampaignBoss();
            } else {
              this.updateCampaignObjectiveUI();
            }
          }
        } else {
          this.campaign.interactProgress = 0;
          interFill.style.width = '0%';
        }
        return;
      }
    }

    // Check Spike Plant / Defuse on Site A or Site B ([F])
    if ((this.mode === 'tactical_5v5' || this.mode === 'tutorial') && this.mapData && this.player.alive) {
      const nearSite = this.mapData.sitePositions.find(
        s => Math.hypot(this.player.pos.x - s.x, this.player.pos.z - s.z) < 7.5
      );

      if (!this.spike.planted && nearSite) {
        interBar.classList.remove('hidden');
        interLabel.textContent = holdingInteract
          ? `PLANTANDO SPIKE NO ${nearSite.name}...`
          : `SEGURE [F] PARA PLANTAR A SPIKE (${nearSite.name})`;
        if (holdingInteract) {
          this.spike.interactProgress += dt / 3.0;
          interFill.style.width = `${Math.min(100, this.spike.interactProgress * 100)}%`;
          if (this.spike.interactProgress >= 1) {
            this.spike.planted = true;
            this.spike.interactProgress = 0;
            this.spike.siteName = nearSite.name;
            this.spike.pos.set(nearSite.x, 0.6, nearSite.z);

            const spikeGeo = new THREE.OctahedronGeometry(0.65, 1);
            const spikeMat = new THREE.MeshBasicMaterial({ color: '#ffd166' });
            this.spike.mesh = new THREE.Mesh(spikeGeo, spikeMat);
            this.spike.mesh.position.copy(this.spike.pos);
            this.scene.add(this.spike.mesh);

            window.SOUND.playAbility('x');
            this.showBanner(`⚠️ SPIKE PLANTADA NO ${nearSite.name}! ⚠️`);

            if (this.mode === 'tutorial' && this.tutorial.stepIndex === 4) {
              this.advanceTutorialStep();
            }
          }
        } else {
          this.spike.interactProgress = 0;
          interFill.style.width = '0%';
        }
        return;
      } else if (this.spike.planted && !this.spike.defused && this.player.pos.distanceTo(this.spike.pos) < 5.5) {
        interBar.classList.remove('hidden');
        interLabel.textContent = holdingInteract
          ? 'DESARMANDO A SPIKE...'
          : 'SEGURE [F] PARA DESARMAR A SPIKE';
        if (holdingInteract) {
          this.spike.interactProgress += dt / 3.5;
          interFill.style.width = `${Math.min(100, this.spike.interactProgress * 100)}%`;
          if (this.spike.interactProgress >= 1) {
            this.spike.defused = true;
            this.endRound('omega', '🛡️ SPIKE DESARMADA! DEFENSORES VENCEM!');
          }
        } else {
          this.spike.interactProgress = 0;
          interFill.style.width = '0%';
        }
        return;
      }
    }

    interBar.classList.add('hidden');
  }

  // ==========================================================================
  // HUD, MINIMAP, CROSSHAIR & FLOATING DAMAGE RENDERERS
  // ==========================================================================
  renderHUDCanvases(dt) {
    // 1. Live Crosshair Canvas
    const chCanvas = document.getElementById('hud-crosshair-canvas');
    if (chCanvas) {
      const ctx = chCanvas.getContext('2d');
      window.SETTINGS.drawCrosshairOnContext(ctx, chCanvas.width, chCanvas.height, this.player.dynamicSpread, dt);
    }

    // 2. Live Tactical Radar / Minimap Canvas
    const mmCanvas = document.getElementById('minimap-canvas');
    if (mmCanvas) {
      const ctx = mmCanvas.getContext('2d');
      const w = mmCanvas.width;
      const h = mmCanvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const scale = 1.05;

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this.player.yaw);

      // Draw Sites A & B
      if (this.mapData && this.mapData.sitePositions) {
        this.mapData.sitePositions.forEach(s => {
          const rx = (s.x - this.player.pos.x) * scale;
          const rz = (s.z - this.player.pos.z) * scale;
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(rx, rz, 8, 0, Math.PI * 2);
          ctx.stroke();
        });
      }

      // Draw Campaign Terminals
      if (this.mode === 'campaign' && this.mapData && this.mapData.campaignTerminals) {
        this.mapData.campaignTerminals.forEach(t => {
          if (t.hacked) return;
          const rx = (t.x - this.player.pos.x) * scale;
          const rz = (t.z - this.player.pos.z) * scale;
          ctx.fillStyle = '#ffd166';
          ctx.fillRect(rx - 4, rz - 4, 8, 8);
        });
      }

      // Draw Allies & Enemies
      this.entities.forEach(ent => {
        if (!ent.alive) return;
        const rx = (ent.pos.x - this.player.pos.x) * scale;
        const rz = (ent.pos.z - this.player.pos.z) * scale;
        ctx.fillStyle = ent.team === this.player.team ? '#05d5fa' : '#ff2a6d';
        ctx.beginPath();
        ctx.arc(rx, rz, ent.isBoss ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      // Player center arrow
      ctx.fillStyle = '#00f59b';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 6);
      ctx.lineTo(cx - 5, cy + 5);
      ctx.lineTo(cx + 5, cy + 5);
      ctx.closePath();
      ctx.fill();
    }
  }

  updateHUD() {
    const hero = this.getHeroData(this.selectedHeroId);
    const wpn = window.GAME_DATA.weapons[this.player.weaponId];

    document.getElementById('hud-hero-avatar').textContent = hero.name.substring(0, 2);
    document.getElementById('hud-hp-num').textContent = Math.max(0, Math.ceil(this.player.hp));
    document.getElementById('hud-shield-num').textContent = `🛡️ ${Math.max(0, Math.ceil(this.player.shield))}`;
    document.getElementById('hud-hp-bar').style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
    document.getElementById('hud-shield-bar').style.width = `${(this.player.shield / Math.max(50, this.player.maxShield)) * 100}%`;

    document.getElementById('hud-weapon-name').textContent = this.player.buffs.dragonKatanaTimer > 0
      ? '⚔️ LÂMINA DO DRAGÃO JIN'
      : wpn.name;
    document.getElementById('hud-ammo-cur').textContent = this.player.reloading ? 'REC' : this.player.ammo;
    document.getElementById('hud-ammo-res').textContent = `/ ${this.player.reserveAmmo}`;
    document.getElementById('hud-credits').textContent = `¤ ${this.player.credits}`;

    document.getElementById('hud-score-alpha').textContent = this.scoreAlpha;
    document.getElementById('hud-score-omega').textContent = this.scoreOmega;
    document.getElementById('hud-round-label').textContent = this.spike.planted
      ? `⚠️ SPIKE (${this.spike.siteName})`
      : `RODADA ${this.roundNumber}`;

    const timeVal = this.spike.planted ? Math.ceil(this.spike.timer) : Math.ceil(this.roundTimer);
    const mins = Math.floor(timeVal / 60);
    const secs = (timeVal % 60).toString().padStart(2, '0');
    document.getElementById('hud-round-clock').textContent = `${mins}:${secs}`;

    const tel = document.getElementById('hud-telemetry');
    if (tel) {
      tel.textContent = `FPS: ${this.fpsCounter} | MAPA: ${this.getMapData(this.selectedMapId).name}`;
    }

    // Abilities HUD slots
    ['q', 'e', 'c'].forEach(k => {
      const cd = this.player.cooldowns[k];
      const slotEl = document.getElementById(`hud-ab-${k}`);
      const nameEl = document.getElementById(`hud-ab-${k}-name`);
      const cdEl = document.getElementById(`hud-ab-${k}-cd`);
      if (nameEl) nameEl.textContent = hero.abilities[k].name;
      if (cdEl) cdEl.textContent = cd > 0 ? `${ cd.toFixed(1) }s` : 'PRONTO';
      if (slotEl) slotEl.classList.toggle('on-cooldown', cd > 0);
    });

    const ultName = document.getElementById('hud-ab-x-name');
    const ultCd = document.getElementById('hud-ab-x-cd');
    if (ultName) ultName.textContent = hero.abilities.x.name;
    if (ultCd) ultCd.textContent = this.player.ultCharge >= 100 ? '🔥 100%' : `${Math.floor(this.player.ultCharge)}%`;
  }

  spawnFloatingDamage(worldPos, dmg, isCrit, isAbility) {
    const layer = document.getElementById('damage-numbers-layer');
    if (!layer) return;
    const screenPos = worldPos.clone().project(this.camera);
    if (screenPos.z > 1) return;

    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

    const el = document.createElement('div');
    el.className = `dmg-number ${isCrit ? 'crit' : ''} ${isAbility ? 'ability' : ''}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.textContent = isCrit ? `💥 ${dmg}` : `${dmg}`;
    layer.appendChild(el);
    setTimeout(() => el.remove(), 850);
  }

  triggerScreenVignette(className) {
    const el = document.getElementById(className);
    if (!el) return;
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, 320);
  }

  showBanner(text) {
    const container = document.getElementById('hud-center-announcement');
    if (!container) return;
    container.innerHTML = `<div class="announcement-banner">${text}</div>`;
    clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      container.innerHTML = '';
    }, 3200);
  }

  showVNDialogue(speaker, message) {
    const box = document.getElementById('vn-dialogue-overlay');
    if (!box) return;
    document.getElementById('vn-speaker-name').textContent = speaker;
    document.getElementById('vn-message-text').textContent = message;
    document.getElementById('vn-portrait-initials').textContent = speaker.substring(0, 2).toUpperCase();
    box.classList.remove('hidden');
    clearTimeout(this.vnTimeout);
    this.vnTimeout = setTimeout(() => {
      box.classList.add('hidden');
    }, 7500);
  }

  addKillfeedItem(killer, victim, weaponName, isHeadshot) {
    const feed = document.getElementById('hud-killfeed');
    if (!feed) return;
    const item = document.createElement('div');
    item.className = 'killfeed-item';
    item.innerHTML = `
      <span style="color:#05d5fa">${killer}</span>
      <span style="color:#ffd166">[${weaponName}${isHeadshot ? ' 🎯' : ''}]</span>
      <span style="color:#ff2a6d">${victim}</span>
    `;
    feed.prepend(item);
    setTimeout(() => item.remove(), 5000);
  }

  // ==========================================================================
  // BUY MENU (B), SCOREBOARD (TAB), PAUSE MENU & MAIN MENU UI WIRING
  // ==========================================================================
  toggleBuyMenu() {
    const modal = document.getElementById('buy-menu-modal');
    const isHidden = modal.classList.contains('hidden');
    if (isHidden) {
      this.exitLock();
      this.renderBuyMenuItems();
      modal.classList.remove('hidden');
    } else {
      modal.classList.add('hidden');
      this.requestLock();
    }
  }

  renderBuyMenuItems() {
    const grid = document.getElementById('buy-items-grid');
    document.getElementById('buy-credits-display').textContent = `CRÉDITOS DISPONÍVEIS: ¤ ${this.player.credits}`;
    grid.innerHTML = '';

    Object.values(window.GAME_DATA.weapons).forEach(w => {
      const card = document.createElement('div');
      card.className = 'buy-item-card';
      card.innerHTML = `
        <div style="font-size:11px;color:#05d5fa;font-weight:700;">${w.category.toUpperCase()}</div>
        <h4 style="font-family:var(--font-display);font-size:16px;margin:4px 0;">${w.name}</h4>
        <div style="font-size:12.5px;color:#8b9bb4;margin-bottom:8px;">Dano: ${w.damage} | HS: ${w.headshotMult}x | Mag: ${w.magSize}</div>
        <div class="price">¤ ${w.price}</div>
      `;
      card.onclick = () => {
        if (this.player.credits >= w.price) {
          this.player.credits -= w.price;
          this.player.weaponId = w.id;
          this.player.ammo = w.magSize;
          this.player.reserveAmmo = w.reserveAmmo;
          this.setupViewmodel();
          window.SOUND.playUI('click');
          this.renderBuyMenuItems();
          this.updateHUD();
          if (this.mode === 'tutorial' && this.tutorial.stepIndex === 2) {
            this.advanceTutorialStep();
          }
        }
      };
      grid.appendChild(card);
    });

    // Heavy Shield Item
    const shieldCard = document.createElement('div');
    shieldCard.className = 'buy-item-card';
    shieldCard.innerHTML = `
      <div style="font-size:11px;color:#00f59b;font-weight:700;">BLINDAGEM AEGIS</div>
      <h4 style="font-family:var(--font-display);font-size:16px;margin:4px 0;">Escudo Pesado (+100)</h4>
      <div style="font-size:12.5px;color:#8b9bb4;margin-bottom:8px;">Restaura e expande seu Escudo Tático para 100.</div>
      <div class="price">¤ 1000</div>
    `;
    shieldCard.onclick = () => {
      if (this.player.credits >= 1000) {
        this.player.credits -= 1000;
        this.player.maxShield = 100;
        this.player.shield = 100;
        window.SOUND.playUI('click');
        this.renderBuyMenuItems();
        this.updateHUD();
      }
    };
    grid.appendChild(shieldCard);
  }

  updateScoreboardUI() {
    const tbody = document.getElementById('scoreboard-tbody');
    if (!tbody) return;
    const rows = [
      {
        name: window.SETTINGS.config.playerName + ' (VOCÊ)',
        team: this.player.team,
        hero: this.selectedHeroId.toUpperCase(),
        kills: this.player.kills,
        deaths: this.player.deaths,
        credits: this.player.credits
      },
      ...this.entities.map(e => ({
        name: e.name,
        team: e.team,
        hero: e.heroId.toUpperCase(),
        kills: e.kills,
        deaths: e.deaths,
        credits: 2400
      }))
    ];

    tbody.innerHTML = rows.map(r => `
      <tr style="color:${r.team === 'alpha' ? '#05d5fa' : '#ff2a6d'};font-weight:700;">
        <td>${r.team.toUpperCase()}</td>
        <td>${r.name}</td>
        <td>${r.hero}</td>
        <td>${r.kills}</td>
        <td>${r.deaths}</td>
        <td>¤ ${r.credits}</td>
      </tr>
    `).join('');
  }

  pauseGame() {
    this.state = 'PAUSED';
    this.exitLock();
    document.getElementById('pause-menu-modal').classList.remove('hidden');
  }

  resumeGame() {
    this.state = 'PLAYING';
    document.getElementById('pause-menu-modal').classList.add('hidden');
    this.requestLock();
  }

  returnToMainMenu() {
    this.state = 'MENU';
    this.exitLock();
    this.clearWorld();
    document.getElementById('pause-menu-modal').classList.add('hidden');
    document.getElementById('buy-menu-modal').classList.add('hidden');
    document.getElementById('ingame-hud').classList.add('hidden');
    document.getElementById('vn-dialogue-overlay').classList.add('hidden');
    document.getElementById('main-menu-overlay').classList.remove('hidden');
    this.setupMenuShowcase();
  }

  // ==========================================================================
  // UI INITIALIZATION (HERO DOCK, 5v5 LOBBY, CAMPAIGN 5 MAPS, SETTINGS)
  // ==========================================================================
  setupUIHandlers() {
    const nameInput = document.getElementById('player-name-input');
    if (nameInput) {
      nameInput.value = window.SETTINGS.config.playerName;
      nameInput.addEventListener('change', () => {
        window.SETTINGS.config.playerName = nameInput.value.trim() || 'Agente_Aegis';
        window.SETTINGS.save();
        window.NETWORK.updateMyHeroAndName(window.SETTINGS.config.playerName, this.selectedHeroId);
      });
    }

    // Top Navigation Tabs
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.SOUND.playUI('click');
        document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-tab');
        document.querySelectorAll('.menu-tab-pane').forEach(p => p.classList.add('hidden'));
        document.getElementById(targetId).classList.remove('hidden');
        if (targetId === 'tab-settings') {
          window.SETTINGS.renderPreview();
        }
      });
    });

    // Populate Hero Selector Dock (6 Heroes)
    this.renderHeroSelectionUI();

    // Populate Campaign 5 Maps / Semi-Open World Chapters
    this.renderCampaignChaptersUI();

    // Bind Crosshair & Settings controls
    window.SETTINGS.bindUIEvents((cfg) => {
      window.MODELS.outlineEnabled = cfg.animeOutlines;
      window.SOUND.masterVol = cfg.masterVol;
      this.camera.fov = cfg.fov;
      this.camera.updateProjectionMatrix();
    });

    // Multiplayer 5v5 Callbacks
    window.NETWORK.onLobbyUpdated = (slots, matchConfig, roomCode, isHost) => {
      this.renderMultiplayerLobbyUI(slots, matchConfig, roomCode, isHost);
    };
    window.NETWORK.onMatchStart = (slots, matchConfig) => {
      this.startMatch(matchConfig.gameMode, matchConfig.mapId, slots);
    };
    window.NETWORK.onChatMessage = (author, text) => {
      const log = document.getElementById('mp-chat-log');
      if (log) {
        const div = document.createElement('div');
        div.innerHTML = `<b style="color:#05d5fa">${author}:</b> ${text}`;
        log.appendChild(div);
        log.scrollTop = log.scrollHeight;
      }
    };
    window.NETWORK.onNetworkPacket = (pkt) => {
      if (pkt.type === 'SHOOT_FX') {
        this.spawnBulletTracer(
          new THREE.Vector3(...pkt.origin),
          new THREE.Vector3(...pkt.target),
          pkt.color || '#05d5fa'
        );
      }
    };

    window.NETWORK.triggerLobbyUI();
  }

  renderHeroSelectionUI() {
    const dock = document.getElementById('hero-selector-dock');
    const rosterGrid = document.getElementById('heroes-full-roster-grid');
    if (!dock) return;

    dock.innerHTML = '';
    if (rosterGrid) rosterGrid.innerHTML = '';

    window.GAME_DATA.heroes.forEach(h => {
      const card = document.createElement('div');
      card.className = `hero-dock-card ${h.id === this.selectedHeroId ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="hero-dock-avatar" style="background:linear-gradient(135deg, ${h.primaryColor}, ${h.secondaryColor})">${h.name.substring(0, 2)}</div>
        <div class="h-name">${h.name}</div>
        <div class="h-role">${h.role}</div>
      `;
      card.onclick = () => {
        window.SOUND.playUI('click');
        this.selectHero(h.id);
      };
      dock.appendChild(card);

      if (rosterGrid) {
        const fullCard = document.createElement('div');
        fullCard.className = 'chapter-card';
        fullCard.style.borderTop = `4px solid ${h.primaryColor}`;
        fullCard.innerHTML = `
          <div>
            <span class="chapter-badge">${h.role} • ${h.title}</span>
            <h3 style="font-family:var(--font-display);font-size:22px;margin:8px 0 4px;">${h.name} <span style="font-size:14px;color:#8b9bb4;">(${h.jpName})</span></h3>
            <p style="font-size:13.5px;color:#cbd5e1;margin-bottom:10px;">${h.lore}</p>
            <div style="font-size:12.5px;color:#ffd166;line-height:1.45;">
              <b>[Q] ${h.abilities.q.name}:</b> ${h.abilities.q.desc}<br>
              <b>[E] ${h.abilities.e.name}:</b> ${h.abilities.e.desc}<br>
              <b>[C] ${h.abilities.c.name}:</b> ${h.abilities.c.desc}<br>
              <b>[X] ${h.abilities.x.name}:</b> ${h.abilities.x.desc}
            </div>
          </div>
          <button class="btn-anime" onclick="window.GAME.selectHero('${h.id}')">EQUIPAR ${h.name}</button>
        `;
        rosterGrid.appendChild(fullCard);
      }
    });

    this.updateShowcaseHeroBanner();
  }

  selectHero(heroId) {
    this.selectedHeroId = heroId;
    window.NETWORK.updateMyHeroAndName(window.SETTINGS.config.playerName, heroId);
    this.renderHeroSelectionUI();
    this.setupMenuShowcase();
  }

  updateShowcaseHeroBanner() {
    const h = this.getHeroData(this.selectedHeroId);
    document.getElementById('showcase-hero-name').textContent = `${h.name} — ${h.title}`;
    document.getElementById('showcase-hero-role').textContent = `${h.role.toUpperCase()} | HP ${h.hp} + ESCUDO ${h.shield}`;
    document.getElementById('showcase-hero-jp').textContent = h.jpName;

    const strip = document.getElementById('showcase-abilities-strip');
    if (strip) {
      strip.innerHTML = ['q', 'e', 'c', 'x'].map(k => `
        <div class="ability-preview-box">
          <span class="key-badge">${k.toUpperCase()}</span>
          <h4>${h.abilities[k].name}</h4>
          <p>${h.abilities[k].desc}</p>
        </div>
      `).join('');
    }
  }

  renderCampaignChaptersUI() {
    const grid = document.getElementById('campaign-chapters-grid');
    if (!grid) return;
    grid.innerHTML = '';

    window.GAME_DATA.maps.forEach((m, idx) => {
      const card = document.createElement('div');
      card.className = 'chapter-card';
      card.style.borderLeft = `5px solid ${m.gridColor}`;
      card.innerHTML = `
        <div>
          <span class="chapter-badge">CAPÍTULO ${m.chapter} • MUNDO SEMI-ABERTO</span>
          <h3 style="font-family:var(--font-display);font-size:19px;margin:8px 0 4px;">${m.name}</h3>
          <div style="font-size:12px;color:#ffd166;margin-bottom:8px;">${m.subtitle}</div>
          <p style="font-size:13.5px;color:#cbd5e1;line-height:1.38;">${m.campaignStory.briefing}</p>
          <div style="margin-top:8px;font-size:12px;color:#ff2a6d;font-weight:700;">⚔️ Chefe do Setor: ${m.campaignStory.bossName}</div>
        </div>
        <button class="btn-anime" onclick="window.GAME.launchCampaignChapter(${idx})">JOGAR CAPÍTULO ${m.chapter}</button>
      `;
      grid.appendChild(card);
    });
  }

  launchCampaignChapter(chapterIndex) {
    this.currentChapterIndex = chapterIndex;
    const mapCfg = window.GAME_DATA.maps[chapterIndex];
    this.startMatch('campaign', mapCfg.id);
  }

  renderMultiplayerLobbyUI(slots, matchConfig, roomCode, isHost) {
    const codeDisplay = document.getElementById('mp-room-code-display');
    if (codeDisplay) {
      codeDisplay.value = roomCode || 'LOCAL-5V5';
    }

    const alphaContainer = document.getElementById('lobby-team-alpha');
    const omegaContainer = document.getElementById('lobby-team-omega');
    if (!alphaContainer || !omegaContainer) return;

    const renderSlotHTML = (s) => `
      <div class="lobby-slot ${s.type}">
        <div>
          <b style="color:#fff">${s.name}</b>
          <span style="font-size:12px;color:#8b9bb4;margin-left:6px;">(${s.type === 'human' ? '🟢 Humano' : s.type === 'bot' ? '🤖 Bot IA' : '⚪ Aberto'})</span>
        </div>
        <span class="chapter-badge">${s.heroId.toUpperCase()}</span>
      </div>
    `;

    alphaContainer.innerHTML = slots.filter(s => s.team === 'alpha').map(renderSlotHTML).join('');
    omegaContainer.innerHTML = slots.filter(s => s.team === 'omega').map(renderSlotHTML).join('');
  }

  copyInviteLink() {
    const code = window.NETWORK.roomCode || window.NETWORK.hostRoom(window.SETTINGS.config.playerName, this.selectedHeroId);
    const url = `${window.location.origin}${window.location.pathname}?room=${code}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    window.NETWORK.notifyStatus(`Link de convite copiado! Envie para seus colegas: ${url}`);
  }

  checkUrlInviteParams() {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      // Switch to Multiplayer tab and auto-join room
      const mpTabBtn = document.querySelector('[data-tab="tab-multiplayer"]');
      if (mpTabBtn) mpTabBtn.click();
      const joinInput = document.getElementById('mp-join-code-input');
      if (joinInput) joinInput.value = roomParam;
      setTimeout(() => {
        window.NETWORK.joinRoom(roomParam, window.SETTINGS.config.playerName, this.selectedHeroId);
      }, 600);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.GAME = new AnimeStrikeGame();
});
