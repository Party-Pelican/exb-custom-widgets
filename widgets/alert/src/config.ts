import { type ImmutableObject } from "seamless-immutable";
import {
  type Kind,
  AlertDuration,
  MenuPlacement,
  Scale,
} from "@esri/calcite-components";

export interface AlertProps {
  label: string;
  title: string;
  message: string;
  autoClose: boolean;
  open: boolean;
  autoCloseDuration: AlertDuration;
  kind: Extract<"brand" | "danger" | "info" | "success" | "warning", Kind>;
  placement: MenuPlacement;
  scale: Scale;
  icon: string;
}

export interface Config {
  alertConfig: AlertProps;
}

export type IMConfig = ImmutableObject<Config>;
