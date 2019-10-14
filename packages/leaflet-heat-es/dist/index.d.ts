import { Layer, LatLng, LayerOptions } from 'leaflet';
interface Options {
    minOpacity: number;
    maxZoom: number;
    radius: number;
    blur: number;
    max: number;
    gradient: {
        [n: number]: string;
    };
}
export declare type HeatOptions = LayerOptions & Options;
export interface HeatLayer extends Layer {
    setOptions(options: HeatOptions): HeatLayer;
    addLatLng(latlng: LatLng): HeatLayer;
    setLatLngs(latlngs: LatLng[]): HeatLayer;
    redraw(): HeatLayer;
}
export declare function heatLayer(latlngs: LatLng[], options?: HeatOptions): HeatLayer;
export {};
