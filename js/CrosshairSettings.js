// ============================================================================
// ANIME STRIKE: ECLIPSE PROTOCOL - CROSSHAIR STUDIO, SETTINGS & GAMEPAD ENGINE
// ============================================================================

class CrosshairAndSettingsManager {
  constructor() {
    this.storageKey = 'anime_strike_settings_v1';
    this.defaults = {
      playerName: 'Agente_' + Math.floor(100 + Math.random() * 899),
      // Sensitivity & Controls
      mouseSens: 1.0,
      adsSens: 0.65,
      invertY: false,
      padSens: 2.2,
      padDeadzone: 0.12,
      padAimAssist: 0.65,
      // Video & Audio
      fov: 90,
      animeOutlines: true,
      masterVol: 0.75,
      sfxVol: 0.85,
      // Crosshair Customization
      chColor: '#00f59b',
      chCenterDot: true,
      chDotSize: 3,
      chInnerLength: 9,
      chInnerThickness: 2,
      chInnerGap: 5,
      chOuterEnabled: false,
      chOuterLength: 4,
      chOuterGap: 18,
      chOutline: true,
      chDynamic: true
    };

    this.config = Object.assign({}, this.defaults, this.load());
    this.hitmarkerTimer = 0;
    this.hitmarkerCrit = false;
    this.prevPadButtons = {};
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    } catch (e) {}
  }

  applyPreset(presetName) {
    if (presetName === 'valorant_pro') {
      Object.assign(this.config, {
        chColor: '#00f59b',
        chCenterDot: false,
        chInnerLength: 7,
        chInnerThickness: 2,
        chInnerGap: 3,
        chOuterEnabled: false,
        chOutline: true,
        chDynamic: false
      });
    } else if (presetName === 'cs2_classic') {
      Object.assign(this.config, {
        chColor: '#05d5fa',
        chCenterDot: true,
        chDotSize: 2,
        chInnerLength: 11,
        chInnerThickness: 2,
        chInnerGap: 6,
        chOuterEnabled: false,
        chOutline: true,
        chDynamic: true
      });
    } else if (presetName === 'anime_star') {
      Object.assign(this.config, {
        chColor: '#ff2a6d',
        chCenterDot: true,
        chDotSize: 4,
        chInnerLength: 10,
        chInnerThickness: 3,
        chInnerGap: 5,
        chOuterEnabled: true,
        chOuterLength: 5,
        chOuterGap: 18,
        chOutline: true,
        chDynamic: true
      });
    } else if (presetName === 'dot_only') {
      Object.assign(this.config, {
        chColor: '#ffd166',
        chCenterDot: true,
        chDotSize: 4,
        chInnerLength: 0,
        chInnerThickness: 2,
        chInnerGap: 4,
        chOuterEnabled: false,
        chOutline: true,
        chDynamic: false
      });
    }
    this.save();
    this.syncUIControls();
    this.renderPreview();
  }

  triggerHitmarker(isCrit = false) {
    this.hitmarkerTimer = 0.22;
    this.hitmarkerCrit = isCrit;
  }

  drawCrosshairOnContext(ctx, w, h, dynamicSpreadPx = 0, dt = 0.016) {
    ctx.clearRect(0, 0, w, h);
    const cx = Math.floor(w / 2);
    const cy = Math.floor(h / 2);
    const c = this.config;

    const spreadOffset = c.chDynamic ? dynamicSpreadPx : 0;
    const gap = Number(c.chInnerGap) + spreadOffset;
    const len = Number(c.chInnerLength);
    const thick = Number(c.chInnerThickness);

    const drawRectWithOutline = (x, y, rw, rh) => {
      if (c.chOutline) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
        ctx.fillRect(x - 1, y - 1, rw + 2, rh + 2);
      }
      ctx.fillStyle = c.chColor;
      ctx.fillRect(x, y, rw, rh);
    };

    // Center Dot
    if (c.chCenterDot && c.chDotSize > 0) {
      const ds = Number(c.chDotSize);
      drawRectWithOutline(cx - Math.floor(ds / 2), cy - Math.floor(ds / 2), ds, ds);
    }

    // Inner Lines (Top, Bottom, Left, Right)
    if (len > 0) {
      const halfT = Math.floor(thick / 2);
      drawRectWithOutline(cx - halfT, cy - gap - len, thick, len);
      drawRectWithOutline(cx - halfT, cy + gap, thick, len);
      drawRectWithOutline(cx - gap - len, cy - halfT, len, thick);
      drawRectWithOutline(cx + gap, cy - halfT, len, thick);
    }

    // Outer Lines
    if (c.chOuterEnabled && c.chOuterLength > 0) {
      const oGap = Number(c.chOuterGap) + spreadOffset * 1.3;
      const oLen = Number(c.chOuterLength);
      const halfT = Math.floor(thick / 2);
      drawRectWithOutline(cx - halfT, cy - oGap - oLen, thick, oLen);
      drawRectWithOutline(cx - halfT, cy + oGap, thick, oLen);
      drawRectWithOutline(cx - oGap - oLen, cy - halfT, oLen, thick);
      drawRectWithOutline(cx + oGap, cy - halfT, oLen, thick);
    }

    // Hitmarker X overlay
    if (this.hitmarkerTimer > 0) {
      this.hitmarkerTimer = Math.max(0, this.hitmarkerTimer - dt);
      ctx.save();
      ctx.strokeStyle = this.hitmarkerCrit ? '#ff2a6d' : '#ffffff';
      ctx.lineWidth = this.hitmarkerCrit ? 3 : 2;
      const hmGap = 6;
      const hmLen = this.hitmarkerCrit ? 14 : 10;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx + dx * hmGap, cy + dy * hmGap);
        ctx.lineTo(cx + dx * (hmGap + hmLen), cy + dy * (hmGap + hmLen));
        ctx.stroke();
      });
      ctx.restore();
    }
  }

  renderPreview() {
    const canvas = document.getElementById('crosshair-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    this.drawCrosshairOnContext(ctx, canvas.width, canvas.height, 0, 0);
  }

  syncUIControls() {
    const bindMap = {
      'set-mouse-sens': ['mouseSens', 'val-mouse-sens'],
      'set-ads-sens': ['adsSens', 'val-ads-sens'],
      'set-pad-sens': ['padSens', 'val-pad-sens'],
      'set-pad-deadzone': ['padDeadzone', 'val-pad-deadzone'],
      'set-pad-assist': ['padAimAssist', 'val-pad-assist'],
      'set-fov': ['fov', 'val-fov'],
      'set-master-vol': ['masterVol', 'val-master-vol'],
      'set-ch-color': ['chColor', null],
      'set-ch-dot-size': ['chDotSize', 'val-ch-dot'],
      'set-ch-length': ['chInnerLength', 'val-ch-len'],
      'set-ch-thick': ['chInnerThickness', 'val-ch-thick'],
      'set-ch-gap': ['chInnerGap', 'val-ch-gap']
    };

    Object.entries(bindMap).forEach(([elId, [key, labelId]]) => {
      const el = document.getElementById(elId);
      if (el) el.value = this.config[key];
      if (labelId) {
        const lbl = document.getElementById(labelId);
        if (lbl) lbl.textContent = this.config[key];
      }
    });

    const checks = {
      'set-ch-dot': 'chCenterDot',
      'set-ch-outer': 'chOuterEnabled',
      'set-ch-outline': 'chOutline',
      'set-ch-dynamic': 'chDynamic',
      'set-anime-outlines': 'animeOutlines',
      'set-invert-y': 'invertY'
    };
    Object.entries(checks).forEach(([elId, key]) => {
      const el = document.getElementById(elId);
      if (el) el.checked = !!this.config[key];
    });
  }

  bindUIEvents(onSettingsChanged) {
    this.syncUIControls();
    this.renderPreview();

    const attachSlider = (elId, key, labelId) => {
      const el = document.getElementById(elId);
      if (!el) return;
      el.addEventListener('input', () => {
        this.config[key] = el.type === 'color' ? el.value : parseFloat(el.value);
        if (labelId) {
          const lbl = document.getElementById(labelId);
          if (lbl) lbl.textContent = this.config[key];
        }
        this.save();
        this.renderPreview();
        if (onSettingsChanged) onSettingsChanged(this.config);
      });
    };

    attachSlider('set-mouse-sens', 'mouseSens', 'val-mouse-sens');
    attachSlider('set-ads-sens', 'adsSens', 'val-ads-sens');
    attachSlider('set-pad-sens', 'padSens', 'val-pad-sens');
    attachSlider('set-pad-deadzone', 'padDeadzone', 'val-pad-deadzone');
    attachSlider('set-pad-assist', 'padAimAssist', 'val-pad-assist');
    attachSlider('set-fov', 'fov', 'val-fov');
    attachSlider('set-master-vol', 'masterVol', 'val-master-vol');
    attachSlider('set-ch-color', 'chColor', null);
    attachSlider('set-ch-dot-size', 'chDotSize', 'val-ch-dot');
    attachSlider('set-ch-length', 'chInnerLength', 'val-ch-len');
    attachSlider('set-ch-thick', 'chInnerThickness', 'val-ch-thick');
    attachSlider('set-ch-gap', 'chInnerGap', 'val-ch-gap');

    const attachCheck = (elId, key) => {
      const el = document.getElementById(elId);
      if (!el) return;
      el.addEventListener('change', () => {
        this.config[key] = el.checked;
        this.save();
        this.renderPreview();
        if (onSettingsChanged) onSettingsChanged(this.config);
      });
    };

    attachCheck('set-ch-dot', 'chCenterDot');
    attachCheck('set-ch-outer', 'chOuterEnabled');
    attachCheck('set-ch-outline', 'chOutline');
    attachCheck('set-ch-dynamic', 'chDynamic');
    attachCheck('set-anime-outlines', 'animeOutlines');
    attachCheck('set-invert-y', 'invertY');
  }

  // ==========================================================================
  // GAMEPAD / CONTROLLER POLLING (XBOX / PLAYSTATION / GENERIC)
  // ==========================================================================
  pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let activePad = null;
    for (let i = 0; i < pads.length; i++) {
      if (pads[i] && pads[i].connected) {
        activePad = pads[i];
        break;
      }
    }

    const statusBadge = document.getElementById('controller-status-pill');
    if (statusBadge) {
      statusBadge.textContent = activePad
        ? '🎮 Controle Conectado'
        : '⌨️ Teclado+Mouse / 🎮 Controle Pronto';
    }

    if (!activePad) return null;

    const dz = this.config.padDeadzone || 0.12;
    const applyDeadzone = (val) => (Math.abs(val) < dz ? 0 : (val - Math.sign(val) * dz) / (1 - dz));

    const moveX = applyDeadzone(activePad.axes[0] || 0);
    const moveZ = applyDeadzone(activePad.axes[1] || 0);
    const lookX = applyDeadzone(activePad.axes[2] || 0);
    const lookY = applyDeadzone(activePad.axes[3] || 0);

    const isPressed = (idx) => !!(activePad.buttons[idx] && activePad.buttons[idx].pressed);
    const justPressed = (idx) => {
      const cur = isPressed(idx);
      const prev = !!this.prevPadButtons[idx];
      this.prevPadButtons[idx] = cur;
      return cur && !prev;
    };

    return {
      moveX,
      moveZ,
      lookX,
      lookY,
      shoot: isPressed(7),          // RT / R2
      ads: isPressed(6),            // LT / L2
      jump: justPressed(0),         // A / Cross
      crouch: isPressed(1),         // B / Circle
      reloadOrInteract: justPressed(2), // X / Square
      ultimate: justPressed(3),     // Y / Triangle
      abilityQ: justPressed(4),     // LB / L1
      abilityE: justPressed(5),     // RB / R1
      abilityC: justPressed(12),    // D-Pad Up
      buyMenu: justPressed(13),     // D-Pad Down
      sprint: isPressed(10),        // L3
      pause: justPressed(9)         // Start / Options
    };
  }
}

window.SETTINGS = new CrosshairAndSettingsManager();
