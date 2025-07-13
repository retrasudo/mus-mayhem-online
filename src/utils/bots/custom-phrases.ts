// Frases personalizadas del Mus
export const CUSTOM_MUS_PHRASES = [
  "A la mano con lo justo para perder.",
  "Juego con cuatro cartas y media mentira.",
  "Al mus con la fe y una sota.",
  "Tengo más esperanza que juego.",
  "Juego como el que reza: por si suena.",
  "Con esta mano no gano ni al parchís.",
  "Paso porque no tengo dignidad.",
  "Envido por costumbre, no por cartas.",
  "Voy a pares con dos dudas y una ilusión.",
  "Con lo que tengo, ni el postre me dejan elegir.",
  "Juego como los valientes: sin saber qué hago.",
  "Tengo menos juego que una silla.",
  "Esta mano es un poema sin rima.",
  "Juego por no llorar.",
  "A grande con lo más pequeño que has visto.",
  "Si gano, es porque los astros se han alineado.",
  "Mi juego es tan malo que hasta el crupier se ríe.",
  "Tengo menos pares que un zapato suelto.",
  "Juego como quien apuesta una cebolla.",
  "Voy a órdago por no saber contar.",
  "Con estas cartas, hasta la suerte me abandona.",
  "Envido con la esperanza de un náufrago.",
  "Paso como pasan los años: sin pena ni gloria.",
  "Al mus porque el milagro aún existe.",
  "Con este juego ni la abuela me haría caso.",
  "Órdago va, que mañana será otro día.",
  "Tengo más fe que cartas buenas.",
  "Juego como se vive: con lo que hay.",
  "Envido porque el optimismo es gratis.",
  "Al punto con la dignidad por los suelos."
];

export function getRandomCustomPhrase(): string {
  const randomIndex = Math.floor(Math.random() * CUSTOM_MUS_PHRASES.length);
  return CUSTOM_MUS_PHRASES[randomIndex];
}

// Frases específicas por acción con personalidad
export const ACTION_PHRASES: Record<string, string[]> = {
  paso: [
    "Paso porque no tengo dignidad.",
    "Paso como pasan los años: sin pena ni gloria.",
    "Con lo que tengo, paso hasta de intentarlo."
  ],
  envido: [
    "Envido por costumbre, no por cartas.",
    "Envido con la esperanza de un náufrago.",
    "Envido porque el optimismo es gratis."
  ],
  ordago: [
    "Voy a órdago por no saber contar.",
    "Órdago va, que mañana será otro día.",
    "Al órdago como los valientes: sin mirar atrás."
  ],
  mus: [
    "Al mus con la fe y una sota.",
    "Al mus porque el milagro aún existe.",
    "Mus, que la esperanza es lo último que se pierde."
  ],
  'no-mus': [
    "Corto el mus porque algo huele mal.",
    "No hay mus, que ya tengo bastante.",
    "Corto porque la prudencia manda."
  ]
};

export function getActionPhrase(action: string): string {
  const phrases = ACTION_PHRASES[action];
  if (!phrases || phrases.length === 0) {
    return getRandomCustomPhrase();
  }
  
  const randomIndex = Math.floor(Math.random() * phrases.length);
  return phrases[randomIndex];
}