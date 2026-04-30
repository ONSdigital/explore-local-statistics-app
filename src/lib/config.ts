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
	ONScolours.nightBlue,
	ONScolours.springGreen,
	ONScolours.beetrootPurple,
	ONScolours.coralPink,
	ONScolours.darkLeafGreen,
	ONScolours.skyBlue
];
export const ONStextPalette = [
	ONScolours.nightBlue,
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
	ONScolours.nightBlue,
	ONScolours.springGreen,
	ONScolours.beetrootPurple,
	ONScolours.coralPink,
	ONScolours.skyBlue,
	ONScolours.darkLeafGreen
];

export const markerPaths = {
	circle: 'M3,0A3,3,0,1,1,-3,0A3,3,0,1,1,3,0Z',
	square: 'M2.356,2.356L2.356,-2.356L-2.356,-2.356L-2.356,2.356Z',
	diamond: 'M0,-3.33L3.33,0L0,3.33L-3.33,0Z',
	circleHollow: 'M3,0A3,3,0,1,1,-3,0A3,3,0,1,1,3,0Z',
	squareHollow: 'M2.356,2.356L2.356,-2.356L-2.356,-2.356L-2.356,2.356Z',
	diamondHollow: 'M0,-3.33L3.33,0L0,3.33L-3.33,0Z'
};

export const markerPathsKeys = Object.keys(markerPaths);
export const markerPathsArray = Object.keys(markerPaths);

export const maxAreasSelectable = 10;

export const ukBounds = [-8.65, 49.867, 1.761, 60.856];

export const extremeAreas = {
	'gross-domestic-product-per-head-current-market-price': ['E09000001'],
	'gross-domestic-product-per-head-chained-volume-measure': ['E09000001']
};

export const mobileBreakpoint = 510;

// export const mapPaletteDivering = [
// 	'#CE321FCC',
// 	'#E16A4Acc',
// 	'#F09977CC',
// 	'#FAC6A6CC',
// 	'#FEF4D7CC',
// 	'#CAD3C5CC',
// 	'#96B3B3CC',
// 	'#5F93A2CC',
// 	'#007590CC'
// ];

export const mapPaletteDivering = ['#CE321Fcc', '#F09977cc', '#FEF4D7cc', '#96B3B3cc', '#007590cc'];

export const negative_cols = ['#CE321FCC', '#E16A4Acc', '#F09977CC', '#FAC6A6'];
export const neutral_col = '#FEF4D7cc';
export const positive_cols = ['#CAD3C5cc', '#96B3B3cc', '#5F93A2cc', '#007590cc'];

export const mapPaletteSequential = [
	'#eaecb1cc',
	'#a9d891cc',
	'#00a7bacc',
	'#004ea6cc',
	'#000d54cc'
];
