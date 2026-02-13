function layout() {
  return {
    name: "Centered Columns",
    initialState: {
      mainPaneCount: 1,
      mainPaneRatio: 0.5,
      windowOrder: []
    },
    commands: {
      command3: {
        description: "Increase main pane count",
        updateState: (state) => {
          return { ...state, mainPaneCount: state.mainPaneCount + 1 };
        },
      },
      command4: {
        description: "Decrease main pane count",
        updateState: (state) => {
          return {
            ...state,
            mainPaneCount: Math.max(1, state.mainPaneCount - 1),
          };
        },
      },
      command1: {
        description: "Expand main pane",
        updateState: (state) => {
          return {
            ...state,
            mainPaneRatio: Math.min(1, state.mainPaneRatio + 0.05),
          };
        },
      },
      command2: {
        description: "Shrink main pane",
        updateState: (state) => {
          return {
            ...state,
            mainPaneRatio: Math.max(0.1, state.mainPaneRatio - 0.05),
          };
        },
      },
    },
    getFrameAssignments: (windows, screenFrame, state) => {
      if (windows.length === 0) return {};

      // Stabilize window order to prevent shuffling on focus changes
      const ws = stabilize(windows, state.windowOrder || []);

      const mainPaneCount = Math.min(state.mainPaneCount, ws.length);
      const secondaryPaneCount = ws.length - mainPaneCount;
      const hasSecondaryPane = secondaryPaneCount > 0;

      const mainPaneWidth = Math.round(
        screenFrame.width * (hasSecondaryPane ? state.mainPaneRatio : 1)
      );
      const mainPaneWindowWidth = Math.round(mainPaneWidth / mainPaneCount);
      const mainPaneX = Math.round(
        screenFrame.x + (screenFrame.width - mainPaneWidth) / 2
      );

      const remainingWidth = screenFrame.width - mainPaneWidth;
      const leftSecondaryCount = Math.ceil(secondaryPaneCount / 2);
      const rightSecondaryCount = Math.floor(secondaryPaneCount / 2);

      const leftSideWidth = remainingWidth / 2;
      const rightSideWidth = remainingWidth / 2;
      const leftWindowWidth =
        hasSecondaryPane && leftSecondaryCount > 0
          ? Math.round(leftSideWidth / leftSecondaryCount)
          : 0;
      const rightWindowWidth =
        hasSecondaryPane && rightSecondaryCount > 0
          ? Math.round(rightSideWidth / rightSecondaryCount)
          : 0;

      return ws.reduce((frames, window, index) => {
        const isMain = index < mainPaneCount;
        let frame;

        if (isMain) {
          frame = {
            x: mainPaneX + mainPaneWindowWidth * index,
            y: screenFrame.y,
            width: mainPaneWindowWidth,
            height: screenFrame.height,
          };
        } else {
          const secondaryIndex = index - mainPaneCount;

          if (secondaryIndex < leftSecondaryCount) {
            frame = {
              x: screenFrame.x + leftWindowWidth * secondaryIndex,
              y: screenFrame.y,
              width: leftWindowWidth,
              height: screenFrame.height,
            };
          } else {
            const rightIndex = secondaryIndex - leftSecondaryCount;
            frame = {
              x: mainPaneX + mainPaneWidth + rightWindowWidth * rightIndex,
              y: screenFrame.y,
              width: rightWindowWidth,
              height: screenFrame.height,
            };
          }
        }

        return { ...frames, [window.id]: frame };
      }, {});
    },
    updateWithChange: (change, state) => {
      if (!change || !change.type) return state;

      if (change.type === "windowsChanged" && Array.isArray(change.windows)) {
        return reconcileOrder(change.windows.map(w => w.id), state);
      }

      if (change.type === "hardReset") {
        return { mainPaneCount: 1, mainPaneRatio: 0.5, windowOrder: [] };
      }

      return state;
    },
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
}
