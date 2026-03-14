/**
 * Data Pilot untuk Analisis Saluran Manning
 * ==========================================
 * Data valid untuk testing dan demonstrasi aplikasi
 * Berdasarkan kondisi saluran di Indonesia
 */

import { ChannelShape } from '../types';

export interface PilotDataManning {
 name: string;
 description: string;
 location: {
 channelName: string;
 kabupaten: string;
 kecamatan: string;
 desa: string;
 coordinates?: { lat: number; lng: number };
 };
 inputs: {
 shape: ChannelShape;
 roughness: number;
 slope: number;
 width: number;
 topWidth: number;
 diameter: number;
 depth: number;
 totalDepth: number;
 sideSlope: number;
 };
}

export const manningPilotData: PilotDataManning[] = [
 {
 name: "Saluran Irigasi Primer - Jawa Barat",
 description: "Saluran irigasi beton dengan penampang trapesium",
 location: {
 channelName: "Saluran Induk Cimanuk",
 kabupaten: "Kabupaten Sumedang",
 kecamatan: "Tanjungsari",
 desa: "Gudang",
 coordinates: { lat: -6.8531, lng: 107.8281 }
 },
 inputs: {
 shape: ChannelShape.TRAPEZOID,
 roughness: 0.015, // Beton halus
 slope: 0.0015,
 width: 3.0,
 topWidth: 5.0,
 diameter: 1.0,
 depth: 1.2,
 totalDepth: 1.8,
 sideSlope: 0.556
 }
 },
 {
 name: "Drainase Perkotaan - Jakarta",
 description: "Saluran drainase beton di area perkotaan padat",
 location: {
 channelName: "Saluran Kemang Raya",
 kabupaten: "Jakarta Selatan",
 kecamatan: "Mampang Prapatan",
 desa: "Bangka",
 coordinates: { lat: -6.2615, lng: 106.8168 }
 },
 inputs: {
 shape: ChannelShape.TRAPEZOID,
 roughness: 0.013, // Beton sangat halus
 slope: 0.002,
 width: 2.0,
 topWidth: 3.5,
 diameter: 1.0,
 depth: 0.8,
 totalDepth: 1.5,
 sideSlope: 0.469
 }
 },
 {
 name: "Saluran Sekunder - Bandung",
 description: "Saluran sekunder dengan pasangan batu",
 location: {
 channelName: "Saluran Sekunder Soreang",
 kabupaten: "Kabupaten Bandung",
 kecamatan: "Soreang",
 desa: "Soreang",
 coordinates: { lat: -7.0223, lng: 107.5198 }
 },
 inputs: {
 shape: ChannelShape.TRAPEZOID,
 roughness: 0.025, // Pasangan batu
 slope: 0.001,
 width: 1.5,
 topWidth: 2.5,
 diameter: 1.0,
 depth: 0.6,
 totalDepth: 1.2,
 sideSlope: 0.417
 }
 },
 {
 name: "Gorong-gorong Jalan - Surabaya",
 description: "Pipa beton circular di bawah jalan raya",
 location: {
 channelName: "Gorong-gorong Jl. Ahmad Yani",
 kabupaten: "Kota Surabaya",
 kecamatan: "Gubeng",
 desa: "Airlangga",
 coordinates: { lat: -7.2753, lng: 112.7531 }
 },
 inputs: {
 shape: ChannelShape.CIRCULAR,
 roughness: 0.013, // Pipa beton
 slope: 0.003,
 width: 2.0,
 topWidth: 2.0,
 diameter: 1.5,
 depth: 1.0,
 totalDepth: 1.5,
 sideSlope: 0
 }
 },
 {
 name: "Saluran Tanah - Jawa Tengah",
 description: "Saluran tanah alami untuk irigasi sawah",
 location: {
 channelName: "Saluran Tersier Klaten",
 kabupaten: "Kabupaten Klaten",
 kecamatan: "Delanggu",
 desa: "Gatak",
 coordinates: { lat: -7.6281, lng: 110.6931 }
 },
 inputs: {
 shape: ChannelShape.TRAPEZOID,
 roughness: 0.030, // Tanah bersih
 slope: 0.0008,
 width: 1.0,
 topWidth: 2.0,
 diameter: 1.0,
 depth: 0.5,
 totalDepth: 1.0,
 sideSlope: 0.5
 }
 },
 {
 name: "Box Culvert - Bekasi",
 description: "Saluran box culvert beton bertulang",
 location: {
 channelName: "Box Culvert Summarecon",
 kabupaten: "Kota Bekasi",
 kecamatan: "Bekasi Utara",
 desa: "Perwira",
 coordinates: { lat: -6.2281, lng: 107.0031 }
 },
 inputs: {
 shape: ChannelShape.TRAPEZOID,
 roughness: 0.012, // Beton bertulang halus
 slope: 0.0025,
 width: 2.5,
 topWidth: 2.5,
 diameter: 1.0,
 depth: 1.5,
 totalDepth: 2.0,
 sideSlope: 0
 }
 }
];

export function getManningPilotByName(name: string): PilotDataManning | undefined {
 return manningPilotData.find(data => data.name === name);
}

export function getAllManningPilotNames(): string[] {
 return manningPilotData.map(data => data.name);
}
