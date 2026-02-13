function layout() {
  const MIN_RATIO = 0.20;
  const MAX_RATIO = 0.80;
  const STEP      = 0.05;

  return {
    name: "Centered Primary Columns",

    initialState: {
      mainRatio: 0.40,
      windowOrder: []
    },

    getFrameAssignments: (windows, screenFrame, state) => {
      const frames = {};
      if (windows.length === 0) return frames;

      // Stabilize window order to prevent shuffling on focus changes
      const ws = stabilize(windows, state.windowOrder || []);
      const N = ws.length;

      const M = Math.max(0, N - 1);
      const leftCount  = Math.ceil(M / 2);
      const primaryIndex = Math.min(leftCount, N - 1);
      const primary = ws[primaryIndex];

      const mainRatio = clamp(state.mainRatio ?? 0.40, MIN_RATIO, MAX_RATIO);
      const mainW = Math.round(screenFrame.width * mainRatio);
      const mainX = Math.round(screenFrame.x + (screenFrame.width - mainW) / 2);

      frames[primary.id] = { x: mainX, y: screenFrame.y, width: mainW, height: screenFrame.height };

      const leftRegion  = {
        x: screenFrame.x, y: screenFrame.y,
        width: Math.max(0, mainX - screenFrame.x), height: screenFrame.height
      };
      const rightRegion = {
        x: mainX + mainW, y: screenFrame.y,
        width: Math.max(0, (screenFrame.x + screenFrame.width) - (mainX + mainW)),
        height: screenFrame.height
      };

      const leftIDs  = ws.slice(0, leftCount).map(w => w.id);
      const rightIDs = ws.slice(primaryIndex + 1).map(w => w.id);

      const layoutSide = (ids, region) => {
        const k = ids.length;
        if (k === 0 || region.width <= 0) return;
        const colW = Math.floor(region.width / Math.max(1, k));
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
            return { ...state, mainRatio: clamp((state.mainRatio ?? 0.40) + STEP, MIN_RATIO, MAX_RATIO) };
          case "shrinkMain":
          case "decreaseMain":
            return { ...state, mainRatio: clamp((state.mainRatio ?? 0.40) - STEP, MIN_RATIO, MAX_RATIO) };
          default:
            return state;
        }
      }

      if (change.type === "resizedMain" && typeof change.delta === "number") {
        const ratioDelta = change.delta / (change.screenWidth || 1);
        return { ...state, mainRatio: clamp((state.mainRatio ?? 0.40) + ratioDelta, MIN_RATIO, MAX_RATIO) };
      }

      if (change.type === "hardReset") {
        return { mainRatio: 0.40, windowOrder: [] };
      }

      return state;
    },

    commands: {
      expandMain: {
        description: "Widen the centered primary",
        updateState: (state) =>
          ({ ...state, mainRatio: Math.min(MAX_RATIO, (state.mainRatio ?? 0.40) + STEP) })
      },
      shrinkMain: {
        description: "Narrow the centered primary",
        updateState: (state) =>
          ({ ...state, mainRatio: Math.max(MIN_RATIO, (state.mainRatio ?? 0.40) - STEP) })
      },
      increaseMain: { description: "Alias of expandMain", updateState: (s) => ({ ...s, mainRatio: Math.min(MAX_RATIO, (s.mainRatio ?? 0.40) + STEP) }) },
      decreaseMain: { description: "Alias of shrinkMain", updateState: (s) => ({ ...s, mainRatio: Math.max(MIN_RATIO, (s.mainRatio ?? 0.40) - STEP) }) }
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
