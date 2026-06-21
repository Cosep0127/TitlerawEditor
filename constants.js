export const COLORS = [
  { code: '0', name: 'black',           display: '黑色',         hex: '#000000' },
  { code: '1', name: 'dark_blue',       display: '深蓝色',       hex: '#0000AA' },
  { code: '2', name: 'dark_green',      display: '深绿色',       hex: '#00AA00' },
  { code: '3', name: 'dark_aqua',       display: '暗水蓝色',     hex: '#00AAAA' },
  { code: '4', name: 'dark_red',        display: '深红色',       hex: '#AA0000' },
  { code: '5', name: 'dark_purple',     display: '深紫色',       hex: '#AA00AA' },
  { code: '6', name: 'gold',            display: '金色',         hex: '#FFAA00' },
  { code: '7', name: 'gray',            display: '灰色',         hex: '#AAAAAA' },
  { code: '8', name: 'dark_gray',       display: '深灰色',       hex: '#555555' },
  { code: '9', name: 'blue',            display: '蓝色',         hex: '#5555FF' },
  { code: 'a', name: 'green',           display: '绿色',         hex: '#55FF55' },
  { code: 'b', name: 'aqua',            display: '水蓝色',       hex: '#55FFFF' },
  { code: 'c', name: 'red',             display: '红色',         hex: '#FF5555' },
  { code: 'd', name: 'light_purple',    display: '淡紫色',       hex: '#FF55FF' },
  { code: 'e', name: 'yellow',          display: '黄色',         hex: '#FFFF55' },
  { code: 'f', name: 'white',           display: '白色',         hex: '#FFFFFF' },
  { code: 'g', name: 'minecoin_gold',   display: 'Minecoin金',   hex: '#DDD605' },
  { code: 'h', name: 'material_quartz',  display: '石英',       hex: '#E3D4D1' },
  { code: 'i', name: 'material_iron',    display: '铁锭',       hex: '#CECACA' },
  { code: 'j', name: 'material_netherite', display: '下界合金',  hex: '#443A3B' },
  { code: 'm', name: 'material_redstone',  display: '红石',     hex: '#971607' },
  { code: 'n', name: 'material_copper',    display: '铜锭',     hex: '#B4684D' },
  { code: 'p', name: 'material_gold',      display: '金锭',     hex: '#DEB12D' },
  { code: 'q', name: 'material_emerald',   display: '绿宝石',   hex: '#11A036' },
  { code: 's', name: 'material_diamond',   display: '钻石',     hex: '#2CBAA8' },
  { code: 't', name: 'material_lapis',     display: '青金石',   hex: '#21497B' },
  { code: 'u', name: 'material_amethyst',  display: '紫水晶',   hex: '#9A5CC6' },
  { code: 'v', name: 'material_resin',     display: '树脂',     hex: '#EB7114' },
  { code: 'w', name: 'party_blue_color',   display: '组队蓝',   hex: '#8CB3FF' },
];

export const FORMAT_COLORS = new Map(COLORS.map(c => [c.code, c]));

export const COLOR_TO_CODE = {
  black: '0', dark_blue: '1', dark_green: '2', dark_aqua: '3',
  dark_red: '4', dark_purple: '5', gold: '6', gray: '7',
  dark_gray: '8', blue: '9', green: 'a', aqua: 'b',
  red: 'c', light_purple: 'd', yellow: 'e', white: 'f',
  minecoin_gold: 'g', material_quartz: 'h', material_iron: 'i',
  material_netherite: 'j', material_redstone: 'm', material_copper: 'n',
  material_gold: 'p', material_emerald: 'q', material_diamond: 's',
  material_lapis: 't', material_amethyst: 'u', material_resin: 'v',
  party_blue_color: 'w',
};

export const FORMAT_MAP = {
  l: 'bold', L: 'bold',
  o: 'italic', O: 'italic',
  k: 'obfuscated', K: 'obfuscated',
  r: 'reset', R: 'reset',
};

export const STANDARD_CODES = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
export const MATERIAL_CODES = ['h','i','j','m','n','p','q','s','t','u','v'];
export const OTHER_CODES = ['g','w'];
