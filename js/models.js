// ============================================================================
// ANIME STRIKE: ECLIPSE PROTOCOL - 3D ANIME CEL-SHADED MODELS & 5 MAPS BUILDER
// ============================================================================

class AnimeModelFactory {
  constructor() {
    this.toonGradientMap = null;
    this.outlineEnabled = true;
    this.outlineScale = 1.045;
  }

  getToonGradient() {
    if (this.toonGradientMap) return this.toonGradientMap;
    const colors = new Uint8Array([
      45, 45, 65, 255,
      115, 115, 145, 255,
      200, 200, 225, 255,
      255, 255, 255, 255
    ]);
    const texture = new THREE.DataTexture(colors, 4, 1, THREE.RGBAFormat);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    this.toonGradientMap = texture;
    return texture;
  }

  createAnimeMaterial(colorHex, emissiveHex = 0x000000, emissiveIntensity = 0) {
    return new THREE.MeshToonMaterial({
      color: new THREE.Color(colorHex),
      gradientMap: this.getToonGradient(),
      emissive: new THREE.Color(emissiveHex),
      emissiveIntensity: emissiveIntensity
    });
  }

  addAnimeOutline(mesh, thickness = 1.045, outlineColor = 0x05070f) {
    if (!this.outlineEnabled || !mesh.geometry) return;
    const outlineMat = new THREE.MeshBasicMaterial({
      color: outlineColor,
      side: THREE.BackSide
    });
    const outlineMesh = new THREE.Mesh(mesh.geometry, outlineMat);
    outlineMesh.scale.setScalar(thickness);
    outlineMesh.name = 'anime_outline';
    mesh.add(outlineMesh);
  }

  createWeaponMesh(weaponId = 'pulse_rifle', accentColor = '#ff2a6d') {
    const group = new THREE.Group();
    const darkMat = this.createAnimeMaterial('#1b2236');
    const metalMat = this.createAnimeMaterial('#4a5568');
    const neonMat = new THREE.MeshBasicMaterial({ color: accentColor });

    // Receiver body
    const bodyLen = weaponId === 'glacier_sniper' ? 1.15 : weaponId === 'stardust_smg' ? 0.58 : 0.82;
    const bodyGeo = new THREE.BoxGeometry(0.11, 0.16, bodyLen);
    const body = new THREE.Mesh(bodyGeo, darkMat);
    this.addAnimeOutline(body, 1.06);
    group.add(body);

    // Barrel
    const barrelLen = weaponId === 'glacier_sniper' ? 0.85 : weaponId === 'stardust_smg' ? 0.32 : 0.55;
    const barrelGeo = new THREE.CylinderGeometry(0.025, 0.028, barrelLen, 8);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, metalMat);
    barrel.position.set(0, 0.03, -(bodyLen / 2 + barrelLen / 2 - 0.05));
    group.add(barrel);

    // Glowing anime energy rails along barrel
    const railGeo = new THREE.BoxGeometry(0.125, 0.028, bodyLen * 0.85);
    const rail = new THREE.Mesh(railGeo, neonMat);
    rail.position.set(0, 0.05, -0.04);
    group.add(rail);

    // Magazine
    const magGeo = new THREE.BoxGeometry(0.075, 0.24, 0.11);
    const mag = new THREE.Mesh(magGeo, metalMat);
    mag.position.set(0, -0.16, -0.05);
    mag.rotation.x = 0.22;
    group.add(mag);

    // Scope or Holo Sight
    if (weaponId === 'glacier_sniper') {
      const scopeGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.38, 10);
      scopeGeo.rotateX(Math.PI / 2);
      const scope = new THREE.Mesh(scopeGeo, darkMat);
      scope.position.set(0, 0.14, -0.08);
      group.add(scope);
    } else {
      const holoGeo = new THREE.BoxGeometry(0.08, 0.07, 0.12);
      const holo = new THREE.Mesh(holoGeo, neonMat);
      holo.position.set(0, 0.11, 0.02);
      group.add(holo);
    }

    return group;
  }

  createKatanaMesh(colorHex = '#ff2a6d') {
    const group = new THREE.Group();
    const hiltMat = this.createAnimeMaterial('#151928');
    const bladeMat = new THREE.MeshBasicMaterial({ color: colorHex });

    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.32, 8), hiltMat);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.14), new THREE.MeshBasicMaterial({ color: '#ffd166' }));
    guard.position.y = 0.16;

    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.05, 0.065), bladeMat);
    blade.position.y = 0.68;
    this.addAnimeOutline(blade, 1.08);

    group.add(hilt, guard, blade);
    return group;
  }

  createFirstPersonViewmodel(heroData, weaponId) {
    const root = new THREE.Group();

    // Right & Left Anime Tactical Forearms + Gloves
    const sleeveMat = this.createAnimeMaterial(heroData.primaryColor);
    const gloveMat = this.createAnimeMaterial('#141829');

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.48), sleeveMat);
    rightArm.position.set(0.28, -0.28, -0.38);
    rightArm.rotation.set(0.15, -0.12, 0);
    this.addAnimeOutline(rightArm, 1.05);

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.10, 0.46), gloveMat);
    leftArm.position.set(0.06, -0.29, -0.52);
    leftArm.rotation.set(0.18, 0.38, -0.1);
    this.addAnimeOutline(leftArm, 1.05);

    const weaponMesh = this.createWeaponMesh(weaponId, heroData.secondaryColor);
    weaponMesh.position.set(0.24, -0.21, -0.56);
    weaponMesh.name = 'vm_weapon';

    const katanaMesh = this.createKatanaMesh(heroData.primaryColor);
    katanaMesh.position.set(0.32, -0.32, -0.52);
    katanaMesh.rotation.set(-0.9, 0.25, 0.35);
    katanaMesh.visible = false;
    katanaMesh.name = 'vm_katana';

    root.add(rightArm, leftArm, weaponMesh, katanaMesh);
    return root;
  }

  createHeroCharacterMesh(heroData, team = 'omega', displayName = 'Bot', isBoss = false) {
    const group = new THREE.Group();
    const scale = isBoss ? 1.45 : 1.0;
    group.scale.setScalar(scale);

    const primaryMat = this.createAnimeMaterial(heroData.primaryColor);
    const secondaryMat = this.createAnimeMaterial(heroData.secondaryColor);
    const skinMat = this.createAnimeMaterial('#ffe5d9');
    const darkArmorMat = this.createAnimeMaterial('#161b2e');
    const hairMat = this.createAnimeMaterial(heroData.hairColor);
    const teamOutlineColor = team === 'alpha' ? 0x05d5fa : 0xff2a6d;

    // Legs (with hitbox tags)
    const legGeo = new THREE.BoxGeometry(0.22, 0.78, 0.22);
    const leftLeg = new THREE.Mesh(legGeo, darkArmorMat);
    leftLeg.position.set(-0.15, 0.39, 0);
    leftLeg.userData = { hitboxType: 'body' };
    this.addAnimeOutline(leftLeg, 1.06, teamOutlineColor);

    const rightLeg = new THREE.Mesh(legGeo, darkArmorMat);
    rightLeg.position.set(0.15, 0.39, 0);
    rightLeg.userData = { hitboxType: 'body' };
    this.addAnimeOutline(rightLeg, 1.06, teamOutlineColor);

    // Torso / Anime Tactical Jacket
    const torsoGeo = new THREE.BoxGeometry(0.56, 0.74, 0.32);
    const torso = new THREE.Mesh(torsoGeo, primaryMat);
    torso.position.set(0, 1.15, 0);
    torso.userData = { hitboxType: 'body' };
    this.addAnimeOutline(torso, 1.06, teamOutlineColor);

    // Glowing Chest Core Emblem
    const coreGeo = new THREE.OctahedronGeometry(0.11, 0);
    const coreMat = new THREE.MeshBasicMaterial({ color: heroData.secondaryColor });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(0, 1.22, 0.17);
    group.add(core);

    // Head (CRITICAL HEADSHOT HITBOX!)
    const headGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 1.76, 0);
    head.userData = { hitboxType: 'head' };
    this.addAnimeOutline(head, 1.07, teamOutlineColor);

    // Anime Eyes / Tactical Visor
    const eyeMat = new THREE.MeshBasicMaterial({ color: heroData.secondaryColor });
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.03), eyeMat);
    leftEye.position.set(-0.09, 1.76, 0.215);
    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.03), eyeMat);
    rightEye.position.set(0.09, 1.76, 0.215);
    group.add(leftEye, rightEye);

    // Anime Hair Styles per Hero
    const hairGroup = new THREE.Group();
    hairGroup.position.copy(head.position);
    const hairCap = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.18, 0.46), hairMat);
    hairCap.position.y = 0.16;
    hairGroup.add(hairCap);

    if (heroData.hairStyle === 'spiky') {
      for (let i = 0; i < 5; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.34, 5), hairMat);
        spike.position.set((i - 2) * 0.09, 0.28, -0.08);
        spike.rotation.x = -0.35;
        spike.rotation.z = (i - 2) * -0.22;
        hairGroup.add(spike);
      }
    } else if (heroData.hairStyle === 'twin_tails') {
      [-0.28, 0.28].forEach(xPos => {
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.65, 6), hairMat);
        tail.position.set(xPos, -0.08, -0.12);
        tail.rotation.z = xPos > 0 ? -0.3 : 0.3;
        hairGroup.add(tail);
      });
      // Floating Astral Halo
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.025, 8, 24),
        new THREE.MeshBasicMaterial({ color: heroData.secondaryColor })
      );
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 0.42;
      hairGroup.add(halo);
    } else if (heroData.hairStyle === 'ponytail') {
      const pony = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.6, 6), hairMat);
      pony.position.set(0, 0.05, -0.32);
      pony.rotation.x = -0.8;
      hairGroup.add(pony);
    } else if (heroData.hairStyle === 'visor_crest') {
      const crest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.52), secondaryMat);
      crest.position.set(0, 0.28, 0.04);
      hairGroup.add(crest);
    } else {
      const hood = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.48), primaryMat);
      hood.position.set(0, 0.02, -0.03);
      hairGroup.add(hood);
    }
    group.add(hairGroup);

    // Arms + Equipped 3D Gun
    const armGeo = new THREE.BoxGeometry(0.18, 0.64, 0.18);
    const leftArm = new THREE.Mesh(armGeo, secondaryMat);
    leftArm.position.set(-0.39, 1.15, 0);
    leftArm.userData = { hitboxType: 'body' };

    const rightArm = new THREE.Mesh(armGeo, secondaryMat);
    rightArm.position.set(0.39, 1.18, 0.18);
    rightArm.rotation.x = -Math.PI / 2.4;
    rightArm.userData = { hitboxType: 'body' };

    const heldGun = this.createWeaponMesh(heroData.defaultWeapon, heroData.secondaryColor);
    heldGun.scale.setScalar(0.75);
    heldGun.position.set(0.38, 1.22, 0.52);
    heldGun.rotation.y = Math.PI;

    // Overhead Nameplate & Health Bar Sprite
    const nameplate = this.createOverheadStatusSprite(displayName, team, isBoss);
    nameplate.position.set(0, 2.38, 0);

    group.add(leftLeg, rightLeg, torso, head, leftArm, rightArm, heldGun, nameplate);
    group.userData = {
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      head,
      torso,
      nameplate
    };

    return group;
  }

  createOverheadStatusSprite(name, team, isBoss = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(isBoss ? 2.8 : 1.9, isBoss ? 0.7 : 0.48, 1);

    sprite.userData = {
      canvas,
      ctx,
      texture,
      name,
      team,
      isBoss,
      updateBar: (hp, maxHp, shield, maxShield) => {
        ctx.clearRect(0, 0, 256, 64);
        ctx.fillStyle = 'rgba(6, 10, 24, 0.82)';
        ctx.fillRect(18, 6, 220, 48);
        ctx.strokeStyle = team === 'alpha' ? '#05d5fa' : '#ff2a6d';
        ctx.lineWidth = 3;
        ctx.strokeRect(18, 6, 220, 48);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(name.toUpperCase(), 128, 26);

        // HP Bar
        const hpRatio = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(28, 34, 200, 12);
        ctx.fillStyle = team === 'alpha' ? '#00f59b' : '#ff2a6d';
        ctx.fillRect(28, 34, Math.floor(200 * hpRatio), 12);

        // Shield overlay bar
        if (shield > 0) {
          const shRatio = Math.max(0, Math.min(1, shield / Math.max(50, maxShield)));
          ctx.fillStyle = '#05d5fa';
          ctx.fillRect(28, 44, Math.floor(200 * shRatio), 4);
        }
        texture.needsUpdate = true;
      }
    };

    sprite.userData.updateBar(100, 100, 50, 50);
    return sprite;
  }

  // ==========================================================================
  // 5 DISTINCT 3D MAPS / SEMI-OPEN WORLD CAMPAIGN SECTORS BUILDER
  // ==========================================================================
  buildMapGeometry(scene, mapConfig, isCampaignMode = false) {
    const mapGroup = new THREE.Group();
    const colliders = []; // Array of { minX, maxX, minY, maxY, minZ, maxZ }
    const ramps = [];     // Walkable inclined ramps
    const jumpPads = [];  // Vertical wind launch pads
    const campaignTerminals = []; // Interactive F terminals for Campaign

    const addBox = (x, y, z, w, h, d, mat, hasOutline = true, isSolid = true) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (hasOutline) this.addAnimeOutline(mesh, 1.025);
      mapGroup.add(mesh);

      if (isSolid) {
        colliders.push({
          minX: x - w / 2,
          maxX: x + w / 2,
          minY: y - h / 2,
          maxY: y + h / 2,
          minZ: z - d / 2,
          maxZ: z + d / 2,
          mesh
        });
      }
      return mesh;
    };

    const wallMat = this.createAnimeMaterial(mapConfig.groundColor);
    const buildingMat = this.createAnimeMaterial('#1f263d');
    const accentMat = this.createAnimeMaterial(mapConfig.accentColor, mapConfig.accentColor, 0.25);
    const trimMat = new THREE.MeshBasicMaterial({ color: mapConfig.gridColor });

    // Ground Floor + Tactical Anime Grid
    const half = mapConfig.size / 2;
    const groundGeo = new THREE.PlaneGeometry(mapConfig.size, mapConfig.size);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMesh = new THREE.Mesh(groundGeo, wallMat);
    groundMesh.receiveShadow = true;
    mapGroup.add(groundMesh);

    const gridHelper = new THREE.GridHelper(mapConfig.size, 40, mapConfig.gridColor, mapConfig.accentColor);
    gridHelper.position.y = 0.02;
    gridHelper.material.opacity = 0.28;
    gridHelper.material.transparent = true;
    mapGroup.add(gridHelper);

    // Outer Perimeter Walls
    addBox(0, 9, -half, mapConfig.size, 18, 3, buildingMat, false);
    addBox(0, 9, half, mapConfig.size, 18, 3, buildingMat, false);
    addBox(-half, 9, 0, 3, 18, mapConfig.size, buildingMat, false);
    addBox(half, 9, 0, 3, 18, mapConfig.size, buildingMat, false);

    // Central Elevated Courtyard & Twin Tactical Lanes (Site A & Site B)
    // Center Main Platform (Height 3.2m)
    addBox(0, 1.6, 0, 22, 3.2, 22, buildingMat, true);
    addBox(0, 3.25, 0, 22.4, 0.15, 22.4, trimMat, false, false);

    // Walkable Ramps to Center Platform
    const createRamp = (x, z, w, l, topY, dirZ) => {
      const rampGeo = new THREE.BoxGeometry(w, 0.4, Math.hypot(l, topY));
      const rampMesh = new THREE.Mesh(rampGeo, accentMat);
      const angle = Math.atan2(topY, l);
      rampMesh.position.set(x, topY / 2, z);
      rampMesh.rotation.x = dirZ * angle;
      mapGroup.add(rampMesh);
      ramps.push({
        minX: x - w / 2,
        maxX: x + w / 2,
        minZ: z - l / 2,
        maxZ: z + l / 2,
        topY,
        dirZ
      });
    };
    createRamp(0, 16, 6, 10, 3.2, -1);
    createRamp(0, -16, 6, 10, 3.2, 1);

    // Site A (West Wing: X = -42, Z = 0) & Site B (East Wing: X = 42, Z = 0)
    const sitePositions = [
      { name: 'SITE A', x: -42, z: 0, color: '#ff2a6d' },
      { name: 'SITE B', x: 42, z: 0, color: '#05d5fa' }
    ];

    sitePositions.forEach(site => {
      // Glowing Site Zone Ring
      const ringGeo = new THREE.RingGeometry(6.5, 7.2, 32);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({ color: site.color, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(site.x, 0.06, site.z);
      mapGroup.add(ring);

      // Central Site Beacon Pillar
      addBox(site.x, 3.5, site.z, 2.2, 7, 2.2, this.createAnimeMaterial(site.color, site.color, 0.35));

      // Tactical Cover Boxes around Site
      addBox(site.x - 8, 1.4, site.z + 7, 4, 2.8, 3, buildingMat);
      addBox(site.x + 8, 1.4, site.z - 7, 4, 2.8, 3, buildingMat);
      addBox(site.x, 2.2, site.z - 14, 12, 4.4, 3, buildingMat);
      addBox(site.x, 2.2, site.z + 14, 12, 4.4, 3, buildingMat);
    });

    // Sniper Watchtowers & Second-Floor Overlooks (North & South + Flanking Buildings)
    const towerCoords = [
      [-28, 32], [28, 32], [-28, -32], [28, -32],
      [-55, 42], [55, 42], [-55, -42], [55, -42]
    ];
    towerCoords.forEach(([tx, tz]) => {
      addBox(tx, 2.5, tz, 9, 5, 9, buildingMat);
      addBox(tx, 5.1, tz, 9.4, 0.2, 9.4, trimMat, false, false);
    });

    // Jump Pads (Launch Players to High Ground!)
    const padCoords = [
      { x: -20, z: 32 }, { x: 20, z: 32 },
      { x: -20, z: -32 }, { x: 20, z: -32 },
      { x: -42, z: 22 }, { x: 42, z: -22 }
    ];
    padCoords.forEach(p => {
      const padMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 2.1, 0.3, 16),
        new THREE.MeshBasicMaterial({ color: '#00f59b' })
      );
      padMesh.position.set(p.x, 0.15, p.z);
      mapGroup.add(padMesh);
      jumpPads.push({ x: p.x, z: p.z, radius: 2.2, force: 16.5, mesh: padMesh });
    });

    // Map-Specific Anime Architectural Landmarks
    if (mapConfig.id === 'neo_shibuya') {
      // Holographic Skyscrapers & Neon Billboards
      [[-35, 0], [35, 0], [0, -45], [0, 45]].forEach(([bx, bz], idx) => {
        const billboard = new THREE.Mesh(
          new THREE.BoxGeometry(10, 6, 0.4),
          new THREE.MeshBasicMaterial({ color: idx % 2 === 0 ? '#ff2a6d' : '#05d5fa' })
        );
        billboard.position.set(bx, 11, bz);
        mapGroup.add(billboard);
      });
    } else if (mapConfig.id === 'kyoto_shrine') {
      // Traditional Crimson Torii Gates
      const toriiMat = this.createAnimeMaterial('#ef233c');
      [[-22, 0], [22, 0], [0, 26], [0, -26]].forEach(([gx, gz]) => {
        addBox(gx - 3.5, 4, gz, 0.8, 8, 0.8, toriiMat);
        addBox(gx + 3.5, 4, gz, 0.8, 8, 0.8, toriiMat);
        addBox(gx, 7.8, gz, 9.5, 0.9, 1.1, toriiMat);
      });
    } else if (mapConfig.id === 'valkyrie_glacier') {
      // Glowing Cryo Crystal Spires
      const iceMat = this.createAnimeMaterial('#4cc9f0', '#4cc9f0', 0.4);
      [[-18, 18], [18, 18], [-18, -18], [18, -18]].forEach(([ix, iz]) => {
        const spire = new THREE.Mesh(new THREE.ConeGeometry(2.4, 9, 6), iceMat);
        spire.position.set(ix, 4.5, iz);
        this.addAnimeOutline(spire, 1.04);
        mapGroup.add(spire);
      });
    } else if (mapConfig.id === 'solaris_ruins') {
      // Ancient Golden Obelisks & Mecha Relics
      const goldMat = this.createAnimeMaterial('#fcbf49', '#f77f00', 0.3);
      [[-24, 15], [24, 15], [-24, -15], [24, -15]].forEach(([ox, oz]) => {
        addBox(ox, 5, oz, 3.2, 10, 3.2, goldMat);
      });
    } else if (mapConfig.id === 'eclipse_orbital') {
      // Rotating Singularity Core above Center Platform
      const coreSphere = new THREE.Mesh(
        new THREE.IcosahedronGeometry(3.6, 1),
        new THREE.MeshBasicMaterial({ color: '#b537f2', wireframe: true })
      );
      coreSphere.position.set(0, 11.5, 0);
      coreSphere.name = 'orbital_core';
      mapGroup.add(coreSphere);
    }

    // Campaign Semi-Open World Terminals & Supply Stations
    if (isCampaignMode) {
      const termCoords = [
        { id: 'term_a', label: 'RELÉ TÁTICO ALFA [F]', x: -42, z: -22 },
        { id: 'term_b', label: 'RELÉ TÁTICO BETA [F]', x: 42, z: 22 },
        { id: 'term_c', label: 'NÚCLEO CENTRAL OMEGA [F]', x: 0, z: 0, y: 3.3 }
      ];
      termCoords.forEach(tc => {
        const baseY = tc.y || 0;
        const termMesh = addBox(tc.x, baseY + 1.3, tc.z, 1.4, 2.6, 1.4, this.createAnimeMaterial('#ffd166', '#ffd166', 0.5));
        const beaconRing = new THREE.Mesh(
          new THREE.CylinderGeometry(2.2, 2.2, 0.15, 20),
          new THREE.MeshBasicMaterial({ color: '#00f59b' })
        );
        beaconRing.position.set(tc.x, baseY + 0.1, tc.z);
        mapGroup.add(beaconRing);

        campaignTerminals.push({
          id: tc.id,
          label: tc.label,
          x: tc.x,
          y: baseY + 1.3,
          z: tc.z,
          hacked: false,
          mesh: termMesh,
          beaconRing
        });
      });
    }

    scene.add(mapGroup);
    return {
      mapGroup,
      colliders,
      ramps,
      jumpPads,
      sitePositions,
      campaignTerminals
    };
  }
}

window.MODELS = new AnimeModelFactory();
