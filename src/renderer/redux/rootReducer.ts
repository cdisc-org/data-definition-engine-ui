import { combineReducers } from 'redux';
import ui from '@redux/slices/ui';
import settings from '@redux/slices/settings';
import dde from '@redux/slices/dde';
import { PayloadAction } from '@reduxjs/toolkit';
import { IStore } from '@interfaces/store.d';

const combinedReducer = combineReducers({ ui, settings, dde });

const rootReducer = (state, action: PayloadAction<{ store: IStore }>) => {
  let newState = state;
  if (action.type === 'LOAD_STATE') {
    newState = action.payload.store;
  }
  return combinedReducer(newState, action);
};

export default rootReducer;
