import { create } from "zustand";
import { createProjectSlice } from "./projectSlice.js";
import { createSelectionSlice } from "./selectionSlice.js";
import { createShellSlice, createViewportBridgeSlice } from "./shellSlice.js";
import { createSketchToolSlice } from "./sketchToolSlice.js";
import type { SessionState } from "./sliceTypes.js";
import { createViewCropSlice } from "./viewCropSlice.js";

/**
 * Composes the session store from vertical slices. Each slice owns state +
 * handlers for one concern; cross-slice calls go through get() after merge.
 */
export const useSessionStore = create<SessionState>()((set, get) => ({
  ...createProjectSlice(set, get),
  ...createShellSlice(set, get),
  ...createViewportBridgeSlice(set, get),
  ...createSelectionSlice(set, get),
  ...createViewCropSlice(set, get),
  ...createSketchToolSlice(set, get),
}));
