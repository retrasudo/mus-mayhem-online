import { Player } from '@/types/game';

export class PersonalityModifiers {
  constructor(private player: Player) {}

  applyLuck(value: number): number {
    const suerte = this.player.stats!.suerte;
    return value + (Math.random() * suerte) / 5;
  }

  applyBluff(value: number): number {
    const faroleo = this.player.stats!.faroleo;
    const shouldBluff = Math.random() < (faroleo / 10);
    return shouldBluff ? value + Math.random() * 2 : value;
  }

  applyThinking(value: number): number {
    const pensar = this.player.stats!.pensarAntes;
    const variability = (10 - pensar) / 10;
    return value + (Math.random() - 0.5) * variability;
  }

  wantsToCheat(): boolean {
    const limpieza = this.player.stats!.limpieza;
    return Math.random() > (limpieza / 10);
  }
}