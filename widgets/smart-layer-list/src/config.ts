import { type ImmutableObject } from "seamless-immutable";

export interface Config {
  useMapViewIds: string[];
  saveColor: string;
  resetColor: string;
  textColor: string;
  layerListProps: {
    dragEnabled: boolean;
    visibleElements: {
      errors: boolean;
      filter: boolean;
    };
  };
}

export type IMConfig = ImmutableObject<Config>;
