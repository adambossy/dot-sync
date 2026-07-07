function layout() {
  const MIN_RATIO = 0.20;
  const MAX_RATIO = 0.90;
  const STEP      = 0.05;

  return {
    name: "Centered Twin Columns",

    initialState: {
      mainRatio: 0.50,
      windowOrder: []
    },

    getFrameAssignments: (windows, screenFrame, state) => {
      const frames = {};
      const N = windows.length;
      if (N === 0) return frames;

      if (N === 1) {
        frames[windows[0].id] = { x: screenFrame.x, y: screenFrame.y, width: screenFrame.width, height: screenFrame.height };
        return frames;
      }

      // Stabilize window order to prevent shuffling on focus changes
      const ws = stabilize(windows, state.windowOrder || []);

      const M = Math.max(0, N - 2);
      const leftCount  = Math.ceil(M / 2);
      const centerLeftIndex  = Math.min(leftCount, N - 2);
      const centerRightIndex = Math.min(leftCount + 1, N - 1);

      const centerLeft  = ws[centerLeftIndex];
      const centerRight = ws[centerRightIndex];

      const mainRatio = clamp(state.mainRatio ?? 0.50, MIN_RATIO, MAX_RATIO);
      const totalCenterW = Math.round(screenFrame.width * mainRatio);
      const halfCenterW  = Math.floor(totalCenterW / 2);
      const otherHalfW   = totalCenterW - halfCenterW;

      const midX = Math.round(screenFrame.x + screenFrame.width / 2);
      const mainY = screenFrame.y;
      const mainH = screenFrame.height;

      const clX = midX - halfCenterW;
      frames[centerLeft.id] = { x: clX, y: mainY, width: halfCenterW, height: mainH };

      const crX = midX;
      frames[centerRight.id] = { x: crX, y: mainY, width: otherHalfW, height: mainH };

      const leftRegion  = {
        x: screenFrame.x, y: screenFrame.y,
        width: Math.max(0, clX - screenFrame.x), height: screenFrame.height
      };
      const rightRegion = {
        x: crX + otherHalfW, y: screenFrame.y,
        width: Math.max(0, (screenFrame.x + screenFrame.width) - (crX + otherHalfW)),
        height: screenFrame.height
      };

      const leftIDs  = ws.slice(0, leftCount).map(w => w.id);
      const rightIDs = ws.slice(centerRightIndex + 1).map(w => w.id);

      const layoutSide = (ids, region) => {
        const k = ids.length;
        if (k === 0 || region.width <= 0) return;
        const colW = Math.floor(region.width / k);
        ids.forEach((id, i) => {
          frames[id] = {
            x: region.x + i * colW, y: region.y,
            width: (i === k - 1) ? region.width - colW * (k - 1) : colW,
            height: region.height
          };
        });
      };

      layoutSide(leftIDs,  leftRegion);
      layoutSide(rightIDs, rightRegion);
      return frames;
    },

    updateWithChange: (change, state) => {
      if (!change || !change.type) return state;

      if (change.type === "windowsChanged" && Array.isArray(change.windows)) {
        return reconcileOrder(change.windows.map(w => w.id), state);
      }

      if (change.type === "command") {
        switch (change.command) {
          case "expandMain":
          case "increaseMain":
            return { ...state, mainRatio: clamp((state.mainRatio ?? 0.50) + STEP, MIN_RATIO, MAX_RATIO) };
          case "shrinkMain":
          case "decreaseMain":
            return { ...state, mainRatio: clamp((state.mainRatio ?? 0.50) - STEP, MIN_RATIO, MAX_RATIO) };
          default:
            return state;
        }
      }

      if (change.type === "resizedMain" && typeof change.delta === "number") {
        const ratioDelta = change.delta / (change.screenWidth || 1);
        return { ...state, mainRatio: clamp((state.mainRatio ?? 0.50) + ratioDelta, MIN_RATIO, MAX_RATIO) };
      }

      if (change.type === "hardReset") {
        return { mainRatio: 0.50, windowOrder: [] };
      }

      return state;
    },

    commands: {
      expandMain: {
        description: "Widen the two centered panes (outward from midpoint)",
        updateState: (state) =>
          ({ ...state, mainRatio: Math.min(MAX_RATIO, (state.mainRatio ?? 0.50) + STEP) })
      },
      shrinkMain: {
        description: "Narrow the two centered panes (inward toward midpoint)",
        updateState: (state) =>
          ({ ...state, mainRatio: Math.max(MIN_RATIO, (state.mainRatio ?? 0.50) - STEP) })
      },
      increaseMain: { description: "Alias of expandMain", updateState: (s) => ({ ...s, mainRatio: Math.min(MAX_RATIO, (s.mainRatio ?? 0.50) + STEP) }) },
      decreaseMain: { description: "Alias of shrinkMain", updateState: (s) => ({ ...s, mainRatio: Math.max(MIN_RATIO, (s.mainRatio ?? 0.50) - STEP) }) }
    }
  };

  function stabilize(windows, order) {
    const ordered = [];
    for (const id of order) {
      const w = windows.find(w => w.id === id);
      if (w) ordered.push(w);
    }
    for (const w of windows) {
      if (!ordered.some(o => o.id === w.id)) ordered.push(w);
    }
    return ordered;
  }

  function reconcileOrder(newIDs, state) {
    const oldOrder = state.windowOrder || [];
    const newSet = new Set(newIDs);

    if (oldOrder.length === newIDs.length && oldOrder.every(id => newSet.has(id))) {
      if (isExactSwap(oldOrder, newIDs)) {
        return { ...state, windowOrder: newIDs };
      }
      return state;
    }

    const reconciled = oldOrder.filter(id => newSet.has(id));
    for (const id of newIDs) {
      if (!reconciled.includes(id)) reconciled.push(id);
    }
    return { ...state, windowOrder: reconciled };
  }

  function isExactSwap(a, b) {
    const diffs = [];
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) diffs.push(i);
    }
    return diffs.length === 2 &&
      a[diffs[0]] === b[diffs[1]] &&
      a[diffs[1]] === b[diffs[0]];
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
}
