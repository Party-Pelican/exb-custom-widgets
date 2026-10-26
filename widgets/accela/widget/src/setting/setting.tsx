/** @jsx jsx */
import { jsx } from 'jimu-core'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import { MapWidgetSelector } from 'jimu-ui/advanced/setting-components'
import { TextInput } from 'jimu-ui'
import { type IMConfig } from '../config'
export default function Setting(props: AllWidgetSettingProps<IMConfig>) {
  const set = (key: 'parcelLayerUrl' | 'apnField' | 'accelaAppId' | 'accelaAccessToken' | 'accelaAgency' | 'accelaEnvironment' | 'accelaModules', value: string) =>
    props.onSettingChange({ id: props.id, config: props.config.set(key, value) })
  return <div className="p-3">
    <h5>Parcel search settings</h5>
    <MapWidgetSelector useMapWidgetIds={props.useMapWidgetIds} onSelect={ids => props.onSettingChange({ id: props.id, useMapWidgetIds: ids })}/>
    <label className="mt-3 d-block">Parcel feature layer URL<TextInput value={props.config.parcelLayerUrl || ''} onChange={e => set('parcelLayerUrl', e.target.value.trim())}/></label>
    <label className="mt-3 d-block">APN field name<TextInput value={props.config.apnField || 'APN'} onChange={e => set('apnField', e.target.value.trim())}/></label>
    <h5 className="mt-4">Accela connection</h5>
    <label className="mt-3 d-block">App ID / API key<TextInput value={props.config.accelaAppId || ''} onChange={e => set('accelaAppId', e.target.value.trim())}/></label>
    <label className="mt-3 d-block">Access token (if required)<TextInput type="password" autoComplete="off" value={props.config.accelaAccessToken || ''} onChange={e => set('accelaAccessToken', e.target.value.trim())}/></label>
    <label className="mt-3 d-block">Agency<TextInput value={props.config.accelaAgency || 'ONT'} onChange={e => set('accelaAgency', e.target.value.trim())}/></label>
    <label className="mt-3 d-block">Environment<TextInput value={props.config.accelaEnvironment || 'NONPROD1'} onChange={e => set('accelaEnvironment', e.target.value.trim())}/></label>
    <label className="mt-3 d-block">Modules (comma separated)<TextInput value={props.config.accelaModules ?? 'Building,Planning'} onChange={e => set('accelaModules', e.target.value)}/></label>
    <p>The browser calls Accela directly. App ID alone accesses only data allowed to anonymous citizen apps; staff-only records and statuses may require an access token.</p>
    <p>Connection values are saved in the app configuration and readable by app users. Masking the token here only hides it on screen. Replace expired tokens here.</p>
    <p>Accela must allow this Enterprise app origin through CORS. APNs must match Accela parcel numbers exactly, including leading zeros.</p>
  </div>
}
