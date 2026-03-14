import { ChannelShape, SiteIdentity } from '@/types';

export interface ManningInputs {
 site?: SiteIdentity;
 shape: ChannelShape;
 roughness: number;
 slope: number;
 width: number;
 topWidth: number;
 diameter: number;
 depth: number;
 totalDepth: number;
 sideSlope: number;
}

export interface ManningOutputs {
 velocity: number;
 discharge: number;
 area: number;
 wettedPerimeter: number;
 hydraulicRadius: number;
 froudeNumber: number;
}

export interface RationalInputs {
 site?: SiteIdentity;
 runoffCoefficient: number;
 area: number;
 rainfallDesign: number;
 flowLength: number;
 catchmentSlope: number;
}

export interface RationalOutputs {
 discharge: number;
 concentrationTime: number;
 intensity: number;
}
