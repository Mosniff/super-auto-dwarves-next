// A pure description of how each log line looks; the leaf maps the icon
// names to lucide icons and the CSS styles the attributes (Phase 14).
import type { BattleCharacterSide, BattleEventDescriptor } from "@/lib/battle/types";

export type BattleLogLineIcon =
  | "flag" | "swords" | "damage" | "armour" | "armourBreak" | "drop" | "timeout" | "ability";
// turnBegins is the turn-start beat's big line.
export type BattleLogLineEmphasis = "line" | "turnBegins" | "outcome";
export interface BattleLogLinePresentation {
  icon: BattleLogLineIcon | null;
  emphasis: BattleLogLineEmphasis;
  markerSide: BattleCharacterSide | null;
}

export function battleLogLinePresentation(descriptor: BattleEventDescriptor): BattleLogLinePresentation {
  switch (descriptor.kind) {
    case "battleStart":
      return { icon: "flag", emphasis: "line", markerSide: null };
    case "frontsEngage":
      return { icon: "swords", emphasis: "line", markerSide: null };
    case "turnStart":
      return { icon: null, emphasis: "turnBegins", markerSide: null };
    case "attack":
      return { icon: "swords", emphasis: "line", markerSide: descriptor.attacker.side };
    case "damage":
      return { icon: "damage", emphasis: "line", markerSide: descriptor.target.side };
    case "armourDamage":
      return {
        icon: descriptor.resultingArmour === 0 ? "armourBreak" : "armour",
        emphasis: "line",
        markerSide: descriptor.target.side,
      };
    case "drop":
      return { icon: "drop", emphasis: "line", markerSide: descriptor.character.side };
    case "timeout":
      return { icon: "timeout", emphasis: "line", markerSide: null };
    case "battleEnd":
      return { icon: null, emphasis: "outcome", markerSide: null };
    case "abilityActivate":
      return { icon: "ability", emphasis: "line", markerSide: descriptor.character.side };
    case "abilityDamage":
      return { icon: "damage", emphasis: "line", markerSide: descriptor.target.side };
    case "abilityStatChange":
      return { icon: "armour", emphasis: "line", markerSide: descriptor.target.side };
    default: {
      const unhandledDescriptor: never = descriptor;
      return unhandledDescriptor;
    }
  }
}
