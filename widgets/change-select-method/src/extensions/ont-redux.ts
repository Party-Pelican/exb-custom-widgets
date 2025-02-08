import {
  type extensionSpec,
  type ImmutableObject,
  type IMState,
} from "jimu-core";

export enum MyActionKeys {
  UPDATE_MODE = "UPDATE_MODE",
}

export interface Action1 {
  type: MyActionKeys.UPDATE_MODE;
  val: string;
}

type ActionTypes = Action1;

interface MyState {
  mode: string;
}

type IMMyState = ImmutableObject<MyState>;

declare module "jimu-core/lib/types/state" {
  interface State {
    selectModeState?: IMMyState;
  }
}

export default class MyReduxStoreExtension
  implements extensionSpec.ReduxStoreExtension
{
  id = "my-redux-ont";

  getActions() {
    return Object.keys(MyActionKeys).map((k) => MyActionKeys[k]);
  }

  getInitLocalState() {
    return {
      mode: "click",
    };
  }

  getReducer() {
    return (
      localState: IMMyState,
      action: ActionTypes,
      appState: IMState
    ): IMMyState => {
      switch (action.type) {
        case MyActionKeys.UPDATE_MODE:
          return localState.set("mode", action.val);
        default:
          return localState;
      }
    };
  }

  getStoreKey() {
    return "selectModeState";
  }
}
