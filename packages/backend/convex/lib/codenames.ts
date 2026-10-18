/**
 * Codenames — the pure rules, shared by the backend and the website
 * (re-exported from `@ella/backend/types`). Randomness is passed in so the
 * rules can be tested.
 */

import { shuffle, type Random } from './games'

export type Team = 'red' | 'blue'
export type CardColor = Team | 'neutral' | 'assassin'

export const BOARD_SIZE = 25
/** The starting team has one card more to find */
export const STARTING_TEAM_CARDS = 9
export const OTHER_TEAM_CARDS = 8
export const ASSASSIN_CARDS = 1

export const MIN_PLAYERS_PER_TEAM = 2
export const MAX_PLAYERS = 30
export const PLAYER_NAME_MAX = 20
export const CLUE_WORD_MAX = 30
export const CLUE_NUMBER_MAX = 9
export const CODENAMES_WORDS_MIN = BOARD_SIZE
export const CODENAMES_WORDS_MAX = 1000

export const TEAM_LABELS: Record<Team, string> = {
  red: 'Rood',
  blue: 'Blauw',
}

export const otherTeam = (team: Team): Team => (team === 'red' ? 'blue' : 'red')

export interface Board {
  words: string[]
  key: CardColor[]
  startingTeam: Team
}

/**
 * A fresh board: 25 different words and the secret key that says whose
 * card each one is. Null when there are fewer than 25 different words.
 */
export function buildBoard(
  words: readonly string[],
  random: Random,
): Board | null {
  const unique = [...new Set(words.map(normalizeWord).filter(Boolean))]
  if (unique.length < BOARD_SIZE) return null
  const startingTeam: Team = random() < 0.5 ? 'red' : 'blue'
  const colors: CardColor[] = [
    ...Array<CardColor>(STARTING_TEAM_CARDS).fill(startingTeam),
    ...Array<CardColor>(OTHER_TEAM_CARDS).fill(otherTeam(startingTeam)),
    ...Array<CardColor>(ASSASSIN_CARDS).fill('assassin'),
  ]
  while (colors.length < BOARD_SIZE) colors.push('neutral')
  return {
    words: shuffle(unique, random).slice(0, BOARD_SIZE),
    key: shuffle(colors, random),
    startingTeam,
  }
}

/** Words are shown in capitals; comparing ignores case and spaces around. */
export function normalizeWord(word: string): string {
  return word.trim().toLocaleUpperCase('nl-BE')
}

/** Cards of a team still to find. */
export function cardsLeft(
  key: readonly CardColor[],
  revealed: readonly boolean[],
  team: Team,
): number {
  return key.filter((color, i) => color === team && !revealed[i]).length
}

/**
 * Why a clue can't be given, or null when it can: one word, not a word on
 * the board, and a number from 1 to 9.
 */
export function clueProblem(
  word: string,
  number: number,
  boardWords: readonly string[],
): string | null {
  const clue = normalizeWord(word)
  if (!clue || clue.length > CLUE_WORD_MAX) return 'Typ een hint.'
  if (/\s/.test(clue)) return 'Een hint is één woord.'
  if (boardWords.includes(clue)) return 'Dat woord ligt op het bord.'
  if (!Number.isInteger(number) || number < 1 || number > CLUE_NUMBER_MAX)
    return `Kies een getal van 1 tot ${CLUE_NUMBER_MAX}.`
  return null
}

export interface GuessOutcome {
  color: CardColor
  /** The game is over, and who won */
  winner: Team | null
  /** The guessing team may keep guessing */
  keepTurn: boolean
}

/**
 * What revealing a card does. A team's own card lets it guess on while it
 * has guesses left; any other card ends the turn. The assassin loses the
 * game, and the last card of a team wins it for that team, also when the
 * other team turned it.
 */
export function guessOutcome(
  key: readonly CardColor[],
  revealed: readonly boolean[],
  index: number,
  team: Team,
  guessesLeftAfter: number,
): GuessOutcome {
  const color = key[index]
  const after = revealed.map((r, i) => r || i === index)
  if (color === 'assassin')
    return { color, winner: otherTeam(team), keepTurn: false }
  if (color === 'red' || color === 'blue') {
    if (cardsLeft(key, after, color) === 0)
      return { color, winner: color, keepTurn: false }
  }
  return {
    color,
    winner: null,
    keepTurn: color === team && guessesLeftAfter > 0,
  }
}

/** The team with fewer players; red when they are even. */
export function smallerTeam(teams: readonly Team[]): Team {
  const red = teams.filter(t => t === 'red').length
  return red <= teams.length - red ? 'red' : 'blue'
}

/** The built-in word list, used until a list is saved on the website. */
export const DEFAULT_CODENAMES_WORDS: string[] = `
AAP AARDE AARDBEI ADELAAR AGENT ANKER APPEL ARM AUTO BAARD BABY BAD BAL
BALLON BANAAN BANK BAND BED BEER BEKER BEL BERG BEVER BIJ BLAD BLOEM BOEK
BOER BOOM BOON BOOT BORD BOS BOTER BRAND BRIEF BRIL BROEK BROOD BRUG BUIK
BUS BUREAU CADEAU CAMERA CIRCUS CITROEN CLOWN COMPUTER DAK DAL DAM DANS DAS
DEKEN DEUR DIEF DINO DISCO DIJK DOKTER DOOS DORP DRAAK DRUIF DUIF DUIKER
DUIM EEND EGEL EI EIK EILAND EMMER ENGEL ERWT EZEL FEE FIETS FILM FLES FLUIT
FOTO FRUIT GANS GARAGE GAT GEEST GELD GITAAR GLAS GOLF GOUD GRAS GROT HAAI
HAAN HAAR HAAS HAMER HAND HANDSCHOEN HART HEK HELM HEMEL HERT HEUVEL HOED
HOND HONING HOORN HOTEL HUIS IGLO IJS IJSBEER INKT JAS JUNGLE KAART KAARS
KAAS KABOUTER KALF KAM KAMEEL KAMER KANGOEROE KANON KAS KASTEEL KAT KERK
KERS KETTING KEUKEN KIKKER KIP KIST KLEI KLOK KNIE KNOOP KOE KOEK KOFFER KOK
KONIJN KONING KOP KORF KRAB KRAAN KRANT KREEFT KROKODIL KROON KUSSEN KUST
LADDER LAMP LEEUW LEPEL LETTER LIFT LIJM LINT LUCHT MAAN MAGNEET MAND MANTEL
MARS MASKER MAST MEER MELK MES METRO MIER MOLEN MONSTER MOTOR MUIS MUNT MUUR
MUZIEK NAALD NACHT NEST NET NEUS NOOT OCEAAN OLIFANT OOG OOR OVEN PAD PAN
PANDA PAPEGAAI PARACHUTE PARK PAUW PEER PEN PEPER PET PIANO PIJL PIJP PIL
PINGUIN PIRAAT PIZZA PLANEET PLANT POES POLITIE POMP POP POORT POST POT
PRINSES RAKET RAAM REGEN REUS RIDDER RING RIVIER ROBOT ROK ROOS RUG SCHAAP
SCHAAR SCHIP SCHOEN SCHOOL SCHOP SLAK SLANG SLEUTEL SLOT SNEEUW SOEP SOK
SPIEGEL SPIN SPOOK SPOOR STAART STAD STER STOEL STORM STRAND STRIK STROOP
SUIKER TAART TAFEL TAND TANK TAS TELEFOON TENT TIJGER TOETER TOL TOMAAT TONG
TOREN TRAP TREIN TROMMEL TRUI TUIN TULP UIL UI VAAS VAMPIER VARKEN VELD VERF
VEER VINGER VIS VLAG VLEUGEL VLIEG VLIEGTUIG VLINDER VOET VORK VOS VUUR
VULKAAN WAGEN WALVIS WATER WEG WIEL WIND WOLF WOLK WORM WORTEL ZAAG ZAK ZAND
ZEE ZEEP ZEGEL ZIEKENHUIS ZILVER ZON ZOUT ZWAAN ZWAARD ZWEMBAD SCHILDPAD
DOLFIJN OCTOPUS NIJLPAARD GIRAF ZEBRA KAMELEON VUURTOREN REGENBOOG TOVENAAR
HEKS DRAAIMOLEN SCHOMMEL GLIJBAAN TRAMPOLINE BLOKKEN PUZZEL DOBBELSTEEN
KAARTSPEL MICROFOON KOPTELEFOON BATTERIJ LAMPION FAKKEL KOMPAS SCHAT
WOESTIJN OASE PIRAMIDE MUMMIE KAPITEIN MATROOS DUIKBOOT VISSER HAVEN
VEERBOOT KANO ZEIL TOUW HAMSTER CAVIA PARKIET KANARIE GOUDVIS MOSSEL ZEESTER
KWAL STRANDBAL SCHELP DUIN PIER BRANDWEER AMBULANCE TRACTOR GRAAFMACHINE
VRACHTWAGEN BRANDWEERMAN BAKKER SLAGER KAPPER POSTBODE LERAAR JUF MEESTER
BOEKENTAS POTLOOD GOM LINIAAL SCHRIFT KRIJT SPEELPLAATS VOETBAL TENNIS JUDO
TURNEN ZWEMMEN SCHAATS SLEE SKI SNEEUWMAN IJSJE WAFEL PANNENKOEK FRIET
CHOCOLADE SNOEP LOLLY POPCORN PICKNICK BARBECUE
`
  .split(/\s+/)
  .filter(Boolean)
  .filter((w, i, all) => all.indexOf(w) === i)
