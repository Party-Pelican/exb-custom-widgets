import { type ImmutableObject } from 'jimu-core'
export interface Config {
  parcelLayerUrl: string; apnField: string; maxParcels: number;
  accelaAppId: string; accelaAccessToken: string; accelaAgency: string;
  accelaEnvironment: string; accelaModules: string;
}
export type IMConfig = ImmutableObject<Config>
