import { GeoLocation } from '@/types/database.types';

export const getCurrentLocation = (): Promise<GeoLocation> => {
 return new Promise((resolve, reject) => {
 if (!navigator.geolocation) {
 reject(new Error('Geolocation is not supported by your browser'));
 return;
 }

 navigator.geolocation.getCurrentPosition(
 (position) => {
 resolve({
 latitude: position.coords.latitude,
 longitude: position.coords.longitude,
 accuracy: position.coords.accuracy,
 timestamp: position.timestamp,
 });
 },
 (error) => {
 let message = 'An unknown error occurred';
 switch (error.code) {
 case error.PERMISSION_DENIED:
 message = 'User denied the request for Geolocation';
 break;
 case error.POSITION_UNAVAILABLE:
 message = 'Location information is unavailable';
 break;
 case error.TIMEOUT:
 message = 'The request to get user location timed out';
 break;
 }
 reject(new Error(message));
 },
 {
 enableHighAccuracy: true,
 timeout: 5000,
 maximumAge: 0,
 }
 );
 });
};
