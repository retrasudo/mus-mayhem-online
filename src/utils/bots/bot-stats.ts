import { BotStats } from '@/types/game';

export const BOT_STATS: Record<string, BotStats> = {
  'Chigga': {
    osadia: 8,
    faroleo: 6,
    suerte: 5,
    cortarMus: 3,
    cazarSenas: 2,
    pensarAntes: 2,
    limpieza: 3,
    juegaGPJ: 6,
    juegaChica: 4
  },
  'Xosé Roberto': {
    osadia: 5,
    faroleo: 3,
    suerte: 6,
    cortarMus: 9,
    cazarSenas: 8,
    pensarAntes: 9,
    limpieza: 9,
    juegaGPJ: 8,
    juegaChica: 3
  },
  'La Zaray': {
    osadia: 9,
    faroleo: 8,
    suerte: 6,
    cortarMus: 4,
    cazarSenas: 5,
    pensarAntes: 4,
    limpieza: 2, // Baja limpieza = hace trampas
    juegaGPJ: 7,
    juegaChica: 4
  },
  'Pato': {
    osadia: Math.floor(Math.random() * 10) + 1,
    faroleo: Math.floor(Math.random() * 10) + 1,
    suerte: Math.floor(Math.random() * 10) + 1,
    cortarMus: Math.floor(Math.random() * 10) + 1,
    cazarSenas: Math.floor(Math.random() * 10) + 1,
    pensarAntes: Math.floor(Math.random() * 10) + 1,
    limpieza: Math.floor(Math.random() * 10) + 1,
    juegaGPJ: Math.floor(Math.random() * 10) + 1,
    juegaChica: Math.floor(Math.random() * 10) + 1
  },
  'Duende Verde': {
    osadia: 6,
    faroleo: 3,
    suerte: 6,
    cortarMus: 6,
    cazarSenas: 5,
    pensarAntes: 6,
    limpieza: 7,
    juegaGPJ: 6,
    juegaChica: 5
  },
  'Judío': {
    osadia: 7,
    faroleo: 4,
    suerte: 9,
    cortarMus: 6,
    cazarSenas: 5,
    pensarAntes: 6,
    limpieza: 10,
    juegaGPJ: 8,
    juegaChica: 2
  },
  'Vasco': {
    osadia: 9,
    faroleo: 9,
    suerte: 7,
    cortarMus: 7,
    cazarSenas: 4,
    pensarAntes: 3,
    limpieza: 5,
    juegaGPJ: 9,
    juegaChica: 1
  },
  'Policía': {
    osadia: 4,
    faroleo: 2,
    suerte: 4,
    cortarMus: 8,
    cazarSenas: 7,
    pensarAntes: 8,
    limpieza: 10,
    juegaGPJ: 7,
    juegaChica: 3
  },
  'Evaristo': {
    osadia: 5,
    faroleo: 4,
    suerte: 5,
    cortarMus: 9,
    cazarSenas: 10,
    pensarAntes: 7,
    limpieza: 9,
    juegaGPJ: 8,
    juegaChica: 4
  }
};