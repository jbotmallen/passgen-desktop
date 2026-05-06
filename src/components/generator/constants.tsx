import {
  IconBrain,
  IconShieldLock,
  IconTemplate,
  IconTextSize,
  IconVolume,
} from '@tabler/icons-react';
import type { GeneratorGuide, GeneratorMode } from '@/utils/types';

export const LEET_MAP: Record<string, string> = {
  a: '@',
  A: '4',
  e: '3',
  E: '3',
  i: '!',
  I: '1',
  o: '0',
  O: '0',
  s: '$',
  S: '5',
  t: '+',
  T: '7',
  l: '1',
  L: '1',
  g: '9',
  G: '6',
  b: '8',
  B: '8',
};

export const WORD_LIST = [
  'alpha', 'bravo', 'castle', 'delta', 'ember', 'falcon', 'glacier', 'harbor',
  'ivory', 'jungle', 'knight', 'lemon', 'marble', 'nexus', 'orbit', 'prism',
  'quartz', 'raven', 'solar', 'tiger', 'ultra', 'viper', 'walnut', 'xenon',
  'yonder', 'zenith', 'anchor', 'blaze', 'coral', 'drift', 'eclipse', 'frost',
  'grove', 'haven', 'ignite', 'jolly', 'karma', 'lunar', 'mystic', 'noble',
  'oasis', 'pearl', 'quest', 'ruby', 'storm', 'thrive', 'unity', 'vivid',
  'wonder', 'zephyr', 'breeze', 'cipher', 'dawn', 'flare', 'glyph', 'haze',
  'jade', 'keen', 'latch', 'maple', 'nectar', 'onyx', 'pixel', 'ridge',
  'spark', 'thorn', 'valor', 'whirl', 'azure', 'bolt', 'crest', 'dusk',
  'echo', 'flame', 'grain', 'helix', 'iron', 'jewel', 'knack', 'lotus',
];

export const SEPARATORS = ['-', '.', '_', '~', '+', '='];

export const ADJECTIVES = [
  'Brave', 'Clever', 'Daring', 'Eager', 'Fierce', 'Gentle', 'Happy', 'Icy',
  'Jolly', 'Keen', 'Lively', 'Mighty', 'Noble', 'Old', 'Proud', 'Quick',
  'Rapid', 'Silent', 'Tough', 'Unique', 'Vivid', 'Wild', 'Young', 'Zealous',
];

export const NOUNS = [
  'Bear', 'Cat', 'Dog', 'Eagle', 'Fox', 'Goat', 'Hawk', 'Ibex',
  'Jaguar', 'Kite', 'Lion', 'Moose', 'Newt', 'Owl', 'Puma', 'Quail',
  'Ram', 'Seal', 'Tiger', 'Urchin', 'Viper', 'Wolf', 'Yak', 'Zebra',
];

export const VERBS = [
  'Ate', 'Built', 'Caught', 'Drew', 'Explored', 'Found', 'Grew', 'Hid',
  'Invented', 'Jumped', 'Kept', 'Lost', 'Made', 'Named', 'Opened', 'Painted',
  'Ran', 'Saved', 'Took', 'Used', 'Visited', 'Won', 'Yelled', 'Zapped',
];

export const PRESET_PATTERNS = [
  {
    label: 'Web',
    pattern: 'Wwww####@@',
    description: 'A balanced site password with one capitalized word shape, digits, and symbols.',
  },
  {
    label: 'PIN+',
    pattern: 'WW######',
    description: 'A short code-style password: two uppercase letters followed by six digits.',
  },
  {
    label: 'Mixed',
    pattern: 'WWwwww##@',
    description: 'A medium-length mix of letters, digits, and one symbol for everyday accounts.',
  },
  {
    label: 'Strong',
    pattern: 'WWwwww####@@@@',
    description: 'A longer preset with extra digits and symbols for stricter password rules.',
  },
  {
    label: 'Readable',
    pattern: 'Wwwwwwww##',
    description: 'A simple word-like shape with two digits, easier to type and read back.',
  },
  {
    label: 'Custom',
    pattern: '',
    description: 'Use the template field below to define your own exact password shape.',
  },
];

export const GUIDES: Record<string, GeneratorGuide> = {
  standard: {
    title: 'Standard',
    body: "Generates a fully random password using the character sets you choose. Toggle Seed Word to embed a personal word that gets scrambled with symbol substitutions so it's unguessable but still meaningful to you.",
  },
  passphrase: {
    title: 'Passphrase',
    body: 'Picks several random dictionary words and joins them with a separator. Long passphrases are easy to remember and type, yet extremely hard to crack.',
  },
  pattern: {
    title: 'Pattern',
    body: 'You define the exact shape of the password using a template. W=uppercase, w=lowercase, #=digit, @=symbol, and anything else is kept as-is.',
  },
  mnemonic: {
    title: 'Mnemonic',
    body: "Creates a short memorable sentence and takes the first letter of each word plus the number and symbol to form your password. The password itself looks random but you can re-derive it anytime.",
  },
  phonetic: {
    title: 'Phonetic',
    body: 'Builds a password from made-up but pronounceable syllables, so you can say it out loud or spell it to someone easily. A number and symbol are appended to meet most site requirements.',
  },
};

export const MODES: GeneratorMode[] = [
  { id: 'standard', label: 'Standard', desc: 'Random characters', icon: <IconShieldLock size={18} /> },
  { id: 'passphrase', label: 'Passphrase', desc: 'Dictionary words', icon: <IconTextSize size={18} /> },
  { id: 'pattern', label: 'Pattern', desc: 'Custom template', icon: <IconTemplate size={18} /> },
  { id: 'mnemonic', label: 'Mnemonic', desc: 'Memorable sentence', icon: <IconBrain size={18} /> },
  { id: 'phonetic', label: 'Phonetic', desc: 'Pronounceable words', icon: <IconVolume size={18} /> },
];
