export const BOT_PHRASES: Record<string, Record<string, string[]>> = {
  'Chigga': {
    mus: ['Unga unga... mus', 'Unga unga mus'],
    'no-mus': ['Unga unga NO mus!', 'UNGA! No mus'],
    bet: ['Unga unga... órdago', 'Unga unga envido', 'UNGA PASO'],
    pares: ['Unga unga pares!', 'Unga... no pares'],
    juego: ['UNGA JUEGO!', 'Unga no juego'],
    win: ['Unga unga! ¡Gano!']
  },
  'Xosé Roberto': {
    mus: ['¡Caldereta pura, mus!', 'A la man con un pimiento'],
    'no-mus': ['¡No hay mus, rapaz!', '¡Corto como el bacalao!'],
    bet: ['¡Que venga el órdago!', 'Te lo firmo en Pascal', '¡Envido dos!', 'Paso, hijo'],
    pares: ['¡Pares de caldereta!', 'Sin pares, rapaz'],
    juego: ['¡Juego de gallego!', 'No hay juego aquí'],
    win: ['¡Caldereta pura, rapaz!']
  },
  'La Zaray': {
    mus: ['¡Mus, cariño!', 'Yo quiero mus'],
    'no-mus': ['¡No hay mus, niño!', '¡Que no, que no hay mus!'],
    bet: ['Yo gano aunque no gane', '¡Envido, shur!', '¡Órdago!', 'Paso, mi amor'],
    pares: ['¡Pares, por supuesto!', 'Ay, no tengo pares'],
    juego: ['¡Juego perfecto!', 'No hay juego, tesoro'],
    win: ['¡Ya te dije que gano siempre!']
  },
  'Pato': {
    mus: ['Quack quack', 'Quack... mus?'],
    'no-mus': ['QUACK! No mus', 'Quack quack NO'],
    bet: ['Quack quack... órdago', 'Quack envido', 'Quack paso'],
    pares: ['Quack pares!', 'Quack... no pares'],
    juego: ['QUACK JUEGO!', 'Quack no juego'],
    win: ['Quack quack!']
  },
  'Duende Verde': {
    mus: ['El bosque dice mus...', 'La naturaleza quiere mus'],
    'no-mus': ['Los árboles dicen no mus', 'El viento corta el mus'],
    bet: ['El destino dice órdago', 'Envido por la magia', 'Paso como la brisa'],
    pares: ['Pares del bosque', 'Sin pares naturales'],
    juego: ['Juego mágico', 'No hay magia para juego'],
    win: ['¡La naturaleza gana!']
  },
  'Judío': {
    mus: ['Dios quiere mus', 'Está escrito que mus'],
    'no-mus': ['Las tablas dicen no mus', 'Yahvé corta el mus'],
    bet: ['¡Órdago divino!', 'Envido prometido', 'Paso como Moisés'],
    pares: ['Pares benditos', 'Sin pares prometidos'],
    juego: ['¡Juego del Altísimo!', 'No hay juego divino'],
    win: ['¡Dios lo había escrito!']
  },
  'Vasco': {
    mus: ['¡Mus, aupa!', 'Euskera mus'],
    'no-mus': ['¡Ez mus!', '¡No hay mus, aupa!'],
    bet: ['¡ÓRDAGO VASCO!', '¡Envido fuerte!', 'Paso vasco'],
    pares: ['¡Pares euskera!', 'Sin pares vascas'],
    juego: ['¡Juego de Euskadi!', 'No hay juego vasco'],
    win: ['¡Aupa! ¡Ganamos!']
  }
};

export function getBotPhrase(playerName: string, action: string): string {
  const playerPhrases = BOT_PHRASES[playerName];
  
  if (!playerPhrases) {
    // Frases genéricas para personajes sin diálogos específicos
    const generic: Record<string, string[]> = {
      mus: ['Mus', 'Quiero mus'],
      'no-mus': ['No hay mus', 'Corto el mus'],
      bet: ['Envido', 'Paso', 'Órdago'],
      pares: ['Pares', 'No pares'],
      juego: ['Juego', 'No juego']
    };
    const actionPhrases = generic[action];
    return actionPhrases ? actionPhrases[Math.floor(Math.random() * actionPhrases.length)] : '';
  }
  
  const actionPhrases = playerPhrases[action];
  if (!actionPhrases) return '';
  
  return actionPhrases[Math.floor(Math.random() * actionPhrases.length)];
}