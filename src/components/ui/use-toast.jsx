// Compact, auto-dismissing toast store for Ukart.
// - Single toast at a time (TOAST_LIMIT = 1)
// - Auto-dismiss after TOAST_DURATION ms
// - Re-toasting the same title resets the timer (no stacking)
import { useState, useEffect } from "react";

const TOAST_LIMIT = 1;
const TOAST_DURATION = 2500; // ~2.5s before auto-dismiss

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
};

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

// Per-toast auto-dismiss timers
const timers = new Map();

function clearTimer(id) {
  const t = timers.get(id);
  if (t) {
    clearTimeout(t);
    timers.delete(id);
  }
}

function startTimer(id) {
  clearTimer(id);
  const t = setTimeout(() => {
    timers.delete(id);
    dispatch({ type: actionTypes.REMOVE_TOAST, toastId: id });
  }, TOAST_DURATION);
  timers.set(id, t);
}

export const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.ADD_TOAST: {
      const kept = [action.toast, ...state.toasts].slice(0, TOAST_LIMIT);
      // Clear timers for any toasts that got dropped by the limit
      state.toasts.forEach((t) => {
        if (!kept.some((k) => k.id === t.id)) clearTimer(t.id);
      });
      return { ...state, toasts: kept };
    }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;
      if (toastId === undefined) {
        state.toasts.forEach((t) => clearTimer(t.id));
        return { ...state, toasts: [] };
      }
      clearTimer(toastId);
      return { ...state, toasts: state.toasts.filter((t) => t.id !== toastId) };
    }

    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        state.toasts.forEach((t) => clearTimer(t.id));
        return { ...state, toasts: [] };
      }
      clearTimer(action.toastId);
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };

    default:
      return state;
  }
};

const listeners = [];
let memoryState = { toasts: [] };

function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

function toast({ ...props }) {
  // Dedup by title: reuse an existing toast with the same title and reset its
  // timer instead of stacking a new one.
  const existing = memoryState.toasts.find(
    (t) => props.title !== undefined && t.title === props.title
  );
  let id;
  if (existing) {
    id = existing.id;
    dispatch({ type: actionTypes.UPDATE_TOAST, toast: { ...props, id } });
  } else {
    id = genId();
    dispatch({ type: actionTypes.ADD_TOAST, toast: { ...props, id } });
  }
  startTimer(id);
  return {
    id,
    dismiss: () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id }),
    update: (props) =>
      dispatch({ type: actionTypes.UPDATE_TOAST, toast: { ...props, id } }),
  };
}

function useToast() {
  const [state, setState] = useState(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  };
}

export { useToast, toast };