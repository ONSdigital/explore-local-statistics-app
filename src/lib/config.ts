export let colours = ['#206095', '#746cb1', '#a8bd3a', '#871a5b', '#27a0cc'];

export const ONScolours = {
	black: '#222',
	grey100: '#414042',
	grey75: '#707071',
	grey60: '#8D8C8E',
	grey50: '#A09FA0',
	grey40: '#b3b3b3',
	grey35: '#bcbcbd',
	grey25: '#d5d5d6',
	grey20: '#d9d9d9',
	grey15: '#e2e2e3',
	grey10: '#efeff0',
	grey5: '#f5f5f6',
	white: '#fff',
	oceanBlue: '#206095',
	skyBlue: '#27a0cc',
	skyBlueDark: '#1F80A3',
	nightBlue: '#003c57',
	emeraldGreen: '#118c7b',
	springGreen: '#a8bd3a',
	springGreenDark: '#8a9b2e',
	beetrootPurple: '#871A5B',
	coralPink: '#f66068',
	lavendarPurple: '#746cb1',
	mintGreen: '#22d0b6',
	mintGreenDark: '#1aa590',
	highlightOrange: '#f39431',
	highlightOrangeDark: '#f56927',
	darkLeafGreen: '#005253',
	female: '#6749A6',
	femaleLight: '#9A86E9',
	male: '#2EA1A4',
	aquaTeal: '#00a3a6',
	leafGreen: '#0f8243',
	rubyRed: '#d0021b',
	jaffaOrange: '#fa6401',
	sunYellow: '#fbc900',
	neonYellow: '#f0f762',
	lightOrange: '#e8bb9b',
	oceanBlueTint: '#e9eff4',
	oceanBlueVibrant: '#1f8fd8',
	springGreenTint: '#c3c5b8',
	leafGreenTint: '#e7f3ec',
	leafGreenVibrant: '#10ca64',
	leafGreenDark10: '#073d20',
	leafGreenDark5: '#0c6b37',
	rubyRedTint: '#fae6e8',
	rubyRedVibrant: '#fd112d',
	jaffaOrangeTint: '#fff0e6',
	jaffaOrangeVibrant: '#ff7b24',
	sunYellowDark: '#e2b500',
	navyBlueLight: '#153b55'
};

export const ONSpalette = [
	ONScolours.oceanBlue,
	ONScolours.springGreen,
	ONScolours.beetrootPurple,
	ONScolours.coralPink,
	ONScolours.darkLeafGreen,
	ONScolours.skyBlue
];
export const ONStextPalette = [
	ONScolours.oceanBlue,
	ONScolours.springGreenDark,
	ONScolours.beetrootPurple,
	ONScolours.coralPink,
	ONScolours.darkLeafGreen,
	ONScolours.skyBlueDark
];

export const ONSdivPlatte = [
	ONScolours.beetrootPurple,
	ONScolours.coralPink,
	ONScolours.grey50,
	ONScolours.skyBlue,
	ONScolours.oceanBlue
];
export const ONSlinePalette = [
	ONScolours.oceanBlue,
	ONScolours.springGreen,
	ONScolours.beetrootPurple,
	ONScolours.coralPink,
	ONScolours.skyBlue,
	ONScolours.darkLeafGreen
];

export const markerPaths = {
	circle: 'M3,0A3,3,0,1,1,-3,0A3,3,0,1,1,3,0Z',
	diamond: 'M0,-3.33L3.33,0L0,3.33L-3.33,0Z',
	triangle: 'M0,-2.629L3.142,2.814L-3.142,2.814Z',
	square: 'M2.356,2.356L2.356,-2.356L-2.356,-2.356L-2.356,2.356Z',
	plus: 'M3.5,.8L3.5,-.8L.8,-.8L.8,-3.5L-.8,-3.5L-.8,-.8L-3.5,-.8L-3.5,.8L-.8,.8L-.8,3.5L.8,3.5L.8,.8Z',
	cross:
		'M1.9092,3.0406L3.0406,1.9092L1.1314,0L3.0406,-1.9092L1.9092,-3.0406L0,-1.1314L-1.9092,-3.0406L-3.0406,-1.9092L-1.1314,0L-3.0406,1.9092L-1.9092,3.0406L0,1.1314Z'
};

export const markerPathsArray = Object.values(markerPaths);

export const maxAreasSelectable = 10;
