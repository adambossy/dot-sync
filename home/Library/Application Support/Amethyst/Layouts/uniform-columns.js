function layout() {
    return {
        name: "Uniform Columns",
        initialState: {
            windowOrder: []
        },
        getFrameAssignments: (windows, screenFrame, state) => {
            if (windows.length === 0) return {};

            // Stabilize window order to prevent shuffling on focus changes
            const ws = stabilize(windows, (state && state.windowOrder) || []);

            const columnWidth = screenFrame.width / ws.length;
            const frames = ws.map((window, index) => {
                const frame = {
                    x: screenFrame.x + (columnWidth * index),
                    y: screenFrame.y,
                    width: columnWidth,
                    height: screenFrame.height
                };
                return { [window.id]: frame };
            });
            return frames.reduce((frames, frame) => ({ ...frames, ...frame }), {});
        },
        updateWithChange: (change, state) => {
            if (!change || !change.type) return state;

            if (change.type === "windowsChanged" && Array.isArray(change.windows)) {
                return reconcileOrder(change.windows.map(w => w.id), state);
            }

            if (change.type === "hardReset") {
                return { windowOrder: [] };
            }

            return state;
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
        const oldOrder = (state && state.windowOrder) || [];
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
