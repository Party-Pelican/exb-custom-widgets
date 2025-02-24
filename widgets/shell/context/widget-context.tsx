import { createContext, useContext, useReducer } from "react";
import { React } from "jimu-core";
import {
  ShellConfig,
  ShellPanelConfig,
  SlotsVisibilityConfig,
} from "../src/shell-config.types";
import { AllWidgetSettingProps } from "jimu-for-builder";
import { IMConfig } from "../src/config";

// Define actions
type Action =
  | { type: "UPDATE_SHELL"; payload: Partial<ShellConfig> }
  | { type: "UPDATE_DEFAULT"; payload: Partial<ShellPanelConfig> }
  | { type: "UPDATE_PANELSTART"; payload: Partial<ShellPanelConfig> }
  | { type: "UPDATE_PANELEND"; payload: Partial<ShellPanelConfig> }
  | { type: "UPDATE_PANELTOP"; payload: Partial<ShellPanelConfig> }
  | { type: "UPDATE_PANELBOTTOM"; payload: Partial<ShellPanelConfig> }
  | {
      type: "UPDATE_SLOTS_VISIBILITY";
      payload: Partial<SlotsVisibilityConfig>;
    };

// Reducer function
const widgetReducer = (state: ShellConfig, action: Action): ShellConfig => {
  switch (action.type) {
    case "UPDATE_SHELL":
      return { ...state, ...action.payload };
    case "UPDATE_DEFAULT":
      return { ...state, default: { ...state.default, ...action.payload } };
    case "UPDATE_PANELSTART":
      return {
        ...state,
        "panel-start": { ...state["panel-start"], ...action.payload },
      };
    case "UPDATE_PANELEND":
      return {
        ...state,
        "panel-end": { ...state["panel-end"], ...action.payload },
      };
    case "UPDATE_PANELTOP":
      return {
        ...state,
        "panel-top": { ...state["panel-top"], ...action.payload },
      };
    case "UPDATE_PANELBOTTOM":
      return {
        ...state,
        "panel-bottom": { ...state["panel-bottom"], ...action.payload },
      };
    case "UPDATE_SLOTS_VISIBILITY":
      return {
        ...state,
        slotsVisibility: { ...state.slotsVisibility, ...action.payload },
      };
    default:
      return state;
  }
};

// **Context Definition**
interface WidgetContextProps {
  state: ShellConfig;
  dispatch: React.Dispatch<Action>;
}

const WidgetContext = createContext<WidgetContextProps | undefined>(undefined);

// Provider component
export const WidgetProvider: React.FC<AllWidgetSettingProps<IMConfig>> = ({
  children,
  onSettingChange,
  config,
  id, // Widget ID required for Experience Builder
}) => {
  const initialState: ShellConfig = config.shell;

  const [state, dispatch] = useReducer(widgetReducer, initialState);

  const enhancedDispatch = (action: Action) => {
    const newState = widgetReducer(state, action);
    dispatch(action);

    onSettingChange({
      id: id,
      config: config.set("shell", {
        ...config.shell,
        ...newState, // Ensure only shell-related updates are applied
      }),
    });
  };

  return (
    <WidgetContext.Provider value={{ state, dispatch: enhancedDispatch }}>
      {children}
    </WidgetContext.Provider>
  );
};

// **Custom Hook**
export const useWidgetContext = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error("useWidgetContext must be used within a WidgetProvider");
  }
  return context;
};
