// ============================================================================
// ANIME STRIKE: ECLIPSE PROTOCOL - GAME DATA (HEROES, WEAPONS, 5 MAPS, CAMPAIGN)
// ============================================================================

window.GAME_DATA = {
  heroes: [
    {
      id: 'akira',
      name: 'AKIRA',
      jpName: '明・斬閃',
      title: 'Cyber Ronin',
      role: 'Duelista',
      hp: 100,
      shield: 50,
      speed: 1.12,
      primaryColor: '#ff2a6d',
      secondaryColor: '#05d5fa',
      hairColor: '#1a1a2e',
      hairStyle: 'spiky',
      accessory: 'katana_back',
      defaultWeapon: 'pulse_rifle',
      lore: 'Ex-capitão da guarda cibernética de Neo-Shibuya. Canaliza plasma iônico em sua lâmina ancestral para cortar projéteis e atravessar linhas inimigas.',
      abilities: {
        q: {
          name: 'Passo Relâmpago',
          key: 'Q',
          cooldown: 7,
          desc: 'Avança instantaneamente em alta velocidade na direção do movimento deixando um rastro elétrico.'
        },
        e: {
          name: 'Kunais de Plasma',
          key: 'E',
          cooldown: 10,
          desc: 'Dispara um leque de 3 kunais explosivas que causam dano em área ao impacto.'
        },
        c: {
          name: 'Postura Defletora',
          key: 'C',
          cooldown: 14,
          desc: 'Gira a katana por 2.5s, reduzindo 85% do dano recebido e refletindo disparos para a mira.'
        },
        x: {
          name: 'Lâmina do Dragão Jin',
          key: 'X',
          cost: 100,
          desc: 'ULTIMATE: Empunha a Katana Soberana por 8s, ganhando velocidade extrema e disparando ondas cortantes letais.'
        }
      }
    },
    {
      id: 'sora',
      name: 'SORA',
      jpName: '空・星雲',
      title: 'Tecelã Astral',
      role: 'Controladora',
      hp: 100,
      shield: 50,
      speed: 1.04,
      primaryColor: '#b537f2',
      secondaryColor: '#00f5d4',
      hairColor: '#e0aaff',
      hairStyle: 'twin_tails',
      accessory: 'halo_ring',
      defaultWeapon: 'stardust_smg',
      lore: 'Cientista quântica que sobreviveu a uma anomalia no núcleo orbital. Manipula gravidade e nebulosas dimensionais para controlar o campo de batalha.',
      abilities: {
        q: {
          name: 'Nebulosa Cósmica',
          key: 'Q',
          cooldown: 11,
          desc: 'Cria um domo de fumaça astral que bloqueia a visão inimiga e desacelera adversários dentro dele.'
        },
        e: {
          name: 'Poço Gravitacional',
          key: 'E',
          cooldown: 13,
          desc: 'Lança uma singularidade que puxa inimigos próximos para o centro e causa dano contínuo.'
        },
        c: {
          name: 'Salto Dimensional',
          key: 'C',
          cooldown: 9,
          desc: 'Teleporta instantaneamente para frente e para cima, permitindo alcançar posições elevadas.'
        },
        x: {
          name: 'Horizonte de Eventos',
          key: 'X',
          cost: 100,
          desc: 'ULTIMATE: Invoca uma tempestade gravitacional massiva na área alvo, puxando e devastando inimigos.'
        }
      }
    },
    {
      id: 'kaito',
      name: 'KAITO',
      jpName: '海斗・鉄壁',
      title: 'Paladino Aegis',
      role: 'Sentinela',
      hp: 125,
      shield: 75,
      speed: 0.96,
      primaryColor: '#05d5fa',
      secondaryColor: '#ffd166',
      hairColor: '#ffffff',
      hairStyle: 'visor_crest',
      accessory: 'shoulder_cannons',
      defaultWeapon: 'titan_lmg',
      lore: 'Engenheiro-chefe da divisão de defesa Aegis. Constrói barreiras hexagonais indestrutíveis e implanta sentinelas autônomas para proteger o esquadrão.',
      abilities: {
        q: {
          name: 'Bastião Hexagonal',
          key: 'Q',
          cooldown: 14,
          desc: 'Ergue uma parede de energia translúcida que bloqueia fogo inimigo por 8 segundos.'
        },
        e: {
          name: 'Torreta Pochi-MK2',
          key: 'E',
          cooldown: 16,
          desc: 'Implanta uma torreta mecha automática que detecta e dispara contra inimigos no raio de visão.'
        },
        c: {
          name: 'Campo Nano-Reparo',
          key: 'C',
          cooldown: 15,
          desc: 'Ativa um emissor que regenera 60 de Vida e Escudo para si e aliados próximos.'
        },
        x: {
          name: 'Sobrecarga Aegis',
          key: 'X',
          cost: 100,
          desc: 'ULTIMATE: Concede +100 de Sobreescudo Dourado e cadência de tiro acelerada para todo o time!'
        }
      }
    },
    {
      id: 'yuki',
      name: 'YUKI',
      jpName: '雪・白銀',
      title: 'Valquíria Glacial',
      role: 'Iniciadora',
      hp: 100,
      shield: 50,
      speed: 1.06,
      primaryColor: '#4cc9f0',
      secondaryColor: '#f72585',
      hairColor: '#caf0f8',
      hairStyle: 'ponytail',
      accessory: 'scarf_wings',
      defaultWeapon: 'glacier_sniper',
      lore: 'Atiradora de elite da Base Glacial Valquíria. Seus sensores crio-sônicos revelam alvos através de paredes antes do disparo perfeito de railgun.',
      abilities: {
        q: {
          name: 'Flecha Crio-Sonar',
          key: 'Q',
          cooldown: 12,
          desc: 'Dispara um pulso de reconhecimento que revela a silhueta dos inimigos através das paredes por 5s.'
        },
        e: {
          name: 'Granada Nevasca',
          key: 'E',
          cooldown: 11,
          desc: 'Congela o solo no impacto, causando dano de gelo e reduzindo a velocidade inimiga em 50%.'
        },
        c: {
          name: 'Corrente Ascendente',
          key: 'C',
          cooldown: 10,
          desc: 'Rajada de vento ártico que impulsiona Yuki a grande altura para tiros aéreos.'
        },
        x: {
          name: 'Tempestade Zero Absoluto',
          key: 'X',
          cost: 100,
          desc: 'ULTIMATE: Dispara um feixe orbital congelante que paralisa inimigos na linha de tiro e causa alto dano.'
        }
      }
    },
    {
      id: 'ren',
      name: 'REN',
      jpName: '蓮・紅影',
      title: 'Fantasma Carmesim',
      role: 'Infiltrador',
      hp: 100,
      shield: 50,
      speed: 1.10,
      primaryColor: '#ef233c',
      secondaryColor: '#ff9f1c',
      hairColor: '#2b2d42',
      hairStyle: 'hooded_anime',
      accessory: 'crimson_cloak',
      defaultWeapon: 'viper_vandal',
      lore: 'Agente de operações secretas das Ruínas de Aethelgard. Domina cegueiras táticas, camuflagem óptica e drenagem de energia vital.',
      abilities: {
        q: {
          name: 'Orbe Fênix Cegante',
          key: 'Q',
          cooldown: 11,
          desc: 'Lança um clarão solar que cega temporariamente e desorienta todos os inimigos próximos.'
        },
        e: {
          name: 'Manto das Sombras',
          key: 'E',
          cooldown: 14,
          desc: 'Fica semi-invisível por 4.5s e recebe +35% de velocidade de movimento para flanquear.'
        },
        c: {
          name: 'Sifão de Alma',
          key: 'C',
          cooldown: 12,
          desc: 'Dispara um feixe carmesim que causa dano ao alvo mais próximo e converte 100% em cura.'
        },
        x: {
          name: 'Réquiem Fantasma',
          key: 'X',
          cost: 100,
          desc: 'ULTIMATE: Entra em frenesi carmesim por 9s: +40% dano, roubo de vida total e visão térmica.'
        }
      }
    },
    {
      id: 'hana',
      name: 'HANA',
      jpName: '花・音姫',
      title: 'Alquimista Neon',
      role: 'Suporte Tático',
      hp: 100,
      shield: 60,
      speed: 1.08,
      primaryColor: '#00f59b',
      secondaryColor: '#ff70a6',
      hairColor: '#ff85a1',
      hairStyle: 'idol_buns',
      accessory: 'sound_drones',
      defaultWeapon: 'harmonic_carbine',
      lore: 'Prodígio da bio-acústica que converte frequências musicais em escudos regenerativos, ondas de choque sônicas e ressurreição tática.',
      abilities: {
        q: {
          name: 'Melodia Curativa',
          key: 'Q',
          cooldown: 9,
          desc: 'Emite uma onda harmônica que restaura instantaneamente 75 de Vida para você e aliados próximos.'
        },
        e: {
          name: 'Repulsor Sônico',
          key: 'E',
          cooldown: 11,
          desc: 'Dispara um pulso de grave que arremessa inimigos para longe e causa dano de impacto.'
        },
        c: {
          name: 'Estímulo Neon',
          key: 'C',
          cooldown: 13,
          desc: 'Cria um campo rítmico que aumenta a velocidade de movimento e recarga da equipe em 35%.'
        },
        x: {
          name: 'Palco Supernova (Reviver)',
          key: 'X',
          cost: 100,
          desc: 'ULTIMATE: Revive aliados caídos próximos e restaura Vida/Escudo máximos de todo o esquadrão!'
        }
      }
    }
  ],

  weapons: {
    classic_pistol: {
      id: 'classic_pistol',
      name: 'Kaze-9 Tactical Pistol',
      category: 'Pistola',
      price: 0,
      damage: 26,
      headshotMult: 2.5,
      fireRate: 0.2,
      magSize: 12,
      reserveAmmo: 72,
      reloadTime: 1.4,
      spread: 0.012,
      recoil: 0.018,
      auto: false,
      color: '#94a3b8'
    },
    sheriff_revolver: {
      id: 'sheriff_revolver',
      name: 'Ronin Heavy Magnum',
      category: 'Pistola',
      price: 800,
      damage: 55,
      headshotMult: 2.8,
      fireRate: 0.38,
      magSize: 6,
      reserveAmmo: 36,
      reloadTime: 1.8,
      spread: 0.008,
      recoil: 0.042,
      auto: false,
      color: '#ffd166'
    },
    stardust_smg: {
      id: 'stardust_smg',
      name: 'Stardust Vector SMG',
      category: 'SMG',
      price: 1600,
      damage: 22,
      headshotMult: 2.0,
      fireRate: 0.075,
      magSize: 30,
      reserveAmmo: 120,
      reloadTime: 1.6,
      spread: 0.022,
      recoil: 0.014,
      auto: true,
      color: '#b537f2'
    },
    harmonic_carbine: {
      id: 'harmonic_carbine',
      name: 'Harmonic Burst Carbine',
      category: 'Rifle',
      price: 2100,
      damage: 29,
      headshotMult: 2.2,
      fireRate: 0.095,
      magSize: 28,
      reserveAmmo: 112,
      reloadTime: 1.7,
      spread: 0.014,
      recoil: 0.016,
      auto: true,
      color: '#00f59b'
    },
    pulse_rifle: {
      id: 'pulse_rifle',
      name: 'Kuro-Blade Phantom Rifle',
      category: 'Rifle',
      price: 2900,
      damage: 34,
      headshotMult: 2.4,
      fireRate: 0.09,
      magSize: 30,
      reserveAmmo: 120,
      reloadTime: 1.8,
      spread: 0.011,
      recoil: 0.018,
      auto: true,
      color: '#ff2a6d'
    },
    viper_vandal: {
      id: 'viper_vandal',
      name: 'Crimson Vandal AK-X',
      category: 'Rifle',
      price: 2900,
      damage: 40,
      headshotMult: 3.0,
      fireRate: 0.105,
      magSize: 25,
      reserveAmmo: 100,
      reloadTime: 1.9,
      spread: 0.012,
      recoil: 0.024,
      auto: true,
      color: '#ef233c'
    },
    titan_lmg: {
      id: 'titan_lmg',
      name: 'Aegis Odin Heavy LMG',
      category: 'Pesada',
      price: 3200,
      damage: 30,
      headshotMult: 1.9,
      fireRate: 0.07,
      magSize: 65,
      reserveAmmo: 195,
      reloadTime: 2.6,
      spread: 0.025,
      recoil: 0.016,
      auto: true,
      color: '#05d5fa'
    },
    glacier_sniper: {
      id: 'glacier_sniper',
      name: 'Valquíria Operator Railgun',
      category: 'Sniper',
      price: 4700,
      damage: 115,
      headshotMult: 2.5,
      fireRate: 0.95,
      magSize: 5,
      reserveAmmo: 25,
      reloadTime: 2.4,
      spread: 0.001,
      recoil: 0.065,
      auto: false,
      scopedZoom: 2.8,
      color: '#4cc9f0'
    }
  },

  maps: [
    {
      id: 'neo_shibuya',
      chapter: 1,
      name: 'Distrito Neo-Shibuya',
      subtitle: 'Metrópole Cyberpunk & Cruzamento Holográfico',
      skyTop: '#07091e',
      skyBottom: '#2d1145',
      fogColor: '#190d2c',
      groundColor: '#161a2c',
      gridColor: '#ff2a6d',
      accentColor: '#05d5fa',
      ambientColor: '#5c4d7d',
      particleType: 'neon_sparks',
      size: 160,
      campaignStory: {
        title: 'Capítulo 1: O Despertar em Neo-Shibuya',
        briefing: 'A corporação Eclipse tomou a rede neural de Neo-Shibuya. Explore o distrito semi-aberto, desative os 3 Terminais de Bloqueio, resgate os dados táticos e derrote o Comandante Cyborg Kurosawa na Praça Central.',
        npcName: 'Comandante Rei (Quartel Aegis)',
        introLines: [
          'Agente, bem-vindo ao Distrito Neo-Shibuya! O setor foi isolado por drones da divisão Eclipse.',
          'Este é um setor semi-aberto: você pode explorar as passarelas superiores, hackear Terminais de Lore (Tecla F) para bônus de arma e concluir objetivos secundários.',
          'Objetivo Principal: Desative os 3 Relés de Segurança [A, B, C] e elimine o Comandante Kurosawa!'
        ],
        bossName: 'Kurosawa - Executor Cibernético',
        bossHero: 'akira',
        bossHp: 650
      }
    },
    {
      id: 'kyoto_shrine',
      chapter: 2,
      name: 'Santuário Flutuante de Kyoto',
      subtitle: 'Templo Ancestral & Ilhas de Sakura nas Nuvens',
      skyTop: '#1f1135',
      skyBottom: '#ff6b6b',
      fogColor: '#3d1e42',
      groundColor: '#261c35',
      gridColor: '#ff9ebb',
      accentColor: '#ffd166',
      ambientColor: '#9e6b8e',
      particleType: 'sakura_petals',
      size: 160,
      campaignStory: {
        title: 'Capítulo 2: Pétalas de Éter em Kyoto',
        briefing: 'Os geradores gravitacionais que mantêm o Santuário de Kyoto flutuando estão sendo drenados. Atravesse os portões Torii, purifique os Cristais de Éter e enfrente a Sacerdotisa Corrompida Nyx.',
        npcName: 'Sora (Especialista Astral)',
        introLines: [
          'As ilhas flutuantes de Kyoto guardam o maior cristal de Éter do Japão. Se os extratores da Eclipse não forem destruídos, o santuário cairá!',
          'Use os Jump Pads de vento espiritual para alcançar os telhados do templo e flanquear as patrulhas.',
          'Objetivo Principal: Purifique os 3 Santuários Torii (Tecla F) e derrote a Sacerdotisa Astral Nyx!'
        ],
        bossName: 'Nyx - Oráculo do Vazio',
        bossHero: 'sora',
        bossHp: 750
      }
    },
    {
      id: 'valkyrie_glacier',
      chapter: 3,
      name: 'Base Glacial Valquíria',
      subtitle: 'Complexo Ártico Sob a Aurora Boreal',
      skyTop: '#041424',
      skyBottom: '#00b4d8',
      fogColor: '#0a2239',
      groundColor: '#1e3547',
      gridColor: '#4cc9f0',
      accentColor: '#00f59b',
      ambientColor: '#568ea6',
      particleType: 'snow_flakes',
      size: 160,
      campaignStory: {
        title: 'Capítulo 3: Operação Zero Absoluto',
        briefing: 'Nas geleiras do norte, a Base Valquíria esconde um canhão orbital crio-iônico. Infiltre-se sob a aurora boreal, recupere os códigos térmicos e impeça o disparo orbital.',
        npcName: 'Yuki (Valquíria Glacial)',
        introLines: [
          'Cuidado com as torres de sniper no desfiladeiro de gelo. Minha flecha sonar pode revelar emboscadas inimigas.',
          'Explore os bunkers laterais para encontrar suprimentos de blindagem pesada Aegis.',
          'Objetivo Principal: Recupere os 3 Núcleos Térmicos e destrua o Colosso Blindado Frost-Titan!'
        ],
        bossName: 'Frost-Titan MK-IV',
        bossHero: 'kaito',
        bossHp: 900
      }
    },
    {
      id: 'solaris_ruins',
      chapter: 4,
      name: 'Ruínas de Aethelgard',
      subtitle: 'Deserto Relíquia de Mechas Antigos',
      skyTop: '#2b120c',
      skyBottom: '#f77f00',
      fogColor: '#402217',
      groundColor: '#3a2618',
      gridColor: '#fcbf49',
      accentColor: '#ef233c',
      ambientColor: '#a87656',
      particleType: 'sand_embers',
      size: 160,
      campaignStory: {
        title: 'Capítulo 4: Ecos do Deserto Carmesim',
        briefing: 'No coração das Ruínas de Aethelgard jazem os restos de Titãs da Primeira Guerra. Descubra a localização da Cidadela Orbital ativando os Obeliscos Solares.',
        npcName: 'Ren (Fantasma Carmesim)',
        introLines: [
          'As tempestades solares aqui interferem nos radares comuns. Use as ruínas elevadas e rampas de pedra a seu favor.',
          'Há caixas de armamento experimental espalhadas pelo cânion.',
          'Objetivo Principal: Sincronize os 3 Obeliscos Solares e elimine o Ceifador Fantasma Ignis!'
        ],
        bossName: 'Ignis - Espectro Solar',
        bossHero: 'ren',
        bossHp: 950
      }
    },
    {
      id: 'eclipse_orbital',
      chapter: 5,
      name: 'Cidadela Orbital Eclipse',
      subtitle: 'Estação Espacial & Núcleo de Singularidade',
      skyTop: '#020208',
      skyBottom: '#1a0b36',
      fogColor: '#090517',
      groundColor: '#121326',
      gridColor: '#b537f2',
      accentColor: '#ff2a6d',
      ambientColor: '#564387',
      particleType: 'cosmic_stars',
      size: 160,
      campaignStory: {
        title: 'Capítulo 5: O Protocolo Eclipse (Final)',
        briefing: 'A batalha final em órbita da Terra! Invada a Cidadela Orbital Eclipse, desative os escudos do núcleo central e enfrente o General Vex para salvar o planeta.',
        npcName: 'Hana & Comandante Rei',
        introLines: [
          'Chegamos ao coração da Cidadela Orbital Eclipse! Todo o esquadrão conta com você, Agente.',
          'Desative os 3 Geradores de Singularidade na estação para abrir a arena do General Vex.',
          'Objetivo Final: Sabote os 3 Geradores Orbitais e derrote o General Vex (Mecha Seraph)!'
        ],
        bossName: 'General Vex - Serafim Eclipse',
        bossHero: 'yuki',
        bossHp: 1200
      }
    }
  ],

  tutorialSteps: [
    {
      id: 1,
      title: '1. Movimentação Tática & Verticalidade',
      speaker: 'Comandante Rei',
      dialogue: 'Bem-vindo à Academia Aegis! Use WASD (ou Analógico Esquerdo no Controle) para se mover, SHIFT para correr, ESPAÇO para pular e CTRL para agachar. Alcance o Ponto de Luz Azul à frente!',
      objectiveText: 'Alcance o Waypoint de Movimento na plataforma central (0/1)'
    },
    {
      id: 2,
      title: '2. Precisão de Tiro, Headshot & Controle de Recuo',
      speaker: 'Yuki (Instrutora de Tiro)',
      dialogue: 'Em combates estilo Valorant e CS2, ficar parado ou agachar ao atirar aumenta muito sua precisão! Miro na cabeça para causar até 3x mais dano. Elimine 3 Drones de Treino!',
      objectiveText: 'Elimine 3 Bots/Drones de Treino com sua arma (0/3)'
    },
    {
      id: 3,
      title: '3. Arsenal Tático & Menu de Compra (Tecla B)',
      speaker: 'Kaito (Mestre de Arsenal)',
      dialogue: 'Pressione a tecla [B] para abrir a Loja Tática e adquirir uma nova arma ou escudo, ou pressione [R] para recarregar sua arma atual!',
      objectiveText: 'Abra o Menu de Compra [B] e compre qualquer equipamento ou recarregue [R] (0/1)'
    },
    {
      id: 4,
      title: '4. Poderes de Herói (Q, E, C) & Ultimate (X)',
      speaker: 'Akira (Líder de Esquadrão)',
      dialogue: 'Cada um dos nossos 6 Heróis possui 3 habilidades táticas [Q, E, C] e uma Ultimate devastadora [X]. Sua Ultimate foi carregada em 100%! Use uma habilidade [Q/E/C] e ative sua Ultimate [X]!',
      objectiveText: 'Use uma Habilidade [Q, E ou C] e sua Ultimate [X] (0/2)'
    },
    {
      id: 5,
      title: '5. Operação Spike (Plantar & Desarmar - Tecla F)',
      speaker: 'Comandante Rei',
      dialogue: 'No modo 5v5 Tático, o time Atacante planta a Spike no Site A ou B segurando [F], e os Defensores a desarmam. Vá até o Site A (círculo dourado) e segure [F] para plantar a Spike de treino!',
      objectiveText: 'Vá até o Site A e segure [F] para plantar a Spike (0/1)'
    }
  ]
};
