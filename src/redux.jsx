import { useState, useContext, useEffect, createContext } from "react";
import React from "react";

export const appContext = createContext(null);

let state = undefined;
let reducer = undefined;
let listeners = [];
const setState = (newState) => {
  console.log(newState);
  state = newState;
  listeners.map((fn) => fn(newState));
};
export const store = {
  getState() {
    return state;
  },
  dispatch: (action) => {
    setState(reducer(state, action));
  },
  subscribe(fn) {
    listeners.push(fn);
    return () => {
      const index = listeners.indexOf(fn);
      listeners.splice(index, 1);
    };
  },
};
let dispatch = store.dispatch;

const prevDispatch = dispatch;

dispatch = (action) => {
  if (action instanceof Function) {
    action(dispatch);
  } else {
    prevDispatch(action); // 对象 type payload
  }
};

const prevDispatch2 = dispatch;

dispatch = (action) => {
  if (action.payload instanceof Promise) {
    action.payload.then((data) => {
      dispatch({ ...action, payload: data });
    });
  } else {
    prevDispatch2(action);
  }
};

export const createStore = (_reducer, initState) => {
  state = initState;
  reducer = _reducer;
  return store;
};

const changed = (oldState, newState) => {
  let changed = false;
  for (let key in oldState) {
    if (oldState[key] !== newState[key]) {
      changed = true;
    }
  }
  return changed;
};

export const connect = (selector, dispatchSelector) => (Component) => {
  return (props) => {
    const [, update] = useState({});
    const data = selector ? selector(state) : { state };

    const dispatchers = dispatchSelector
      ? dispatchSelector(dispatch)
      : { dispatch };
    //订阅
    useEffect(
      () =>
        // 取消订阅，否则可能会重复订阅
        store.subscribe(() => {
          const newData = selector ? selector(state) : { state };
          if (changed(data, newData)) {
            update({});
          }
        }),
      [selector]
    );
    return <Component {...props} {...data} {...dispatchers} state={state} />;
  };
};

export const Provider = ({ store, children }) => {
  return <appContext.Provider value={store}>{children}</appContext.Provider>;
};
