Hooks.once("init", () => {
  game.settings.register("nat20-reactor", "enableReactions", {
    name: "Aktiviere Nat 20 / Nat 1 Reaktionen",
    hint: "Wenn aktiviert, werden bei kritischen Erfolgen oder Patzern automatisch Chatnachrichten vom Actor gesendet.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });
});

Hooks.once("ready", () => {
  console.log("[nat20-reactor] Modul geladen und bereit");
});

Hooks.on("createChatMessage", async (msg) => {
  const enabled = game.settings.get("nat20-reactor", "enableReactions");
  if (!enabled) return;

  if (!msg.isRoll || !msg.rolls?.length) return;

  const roll = msg.rolls[0];
  const terms = roll.terms;
  const actor = msg.actor;
  if (!actor) return;

  const isAttack = msg.flags?.dnd5e?.roll?.type === "attack";

  for (const term of terms) {
    if (term instanceof Die && term.faces === 20) {
      const natValue = term.results[0].result;

      if (natValue === 20) {
        const text = isAttack ? "Boom Headshot!" : "Schaut mich an!!";
        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: <strong>${text}</strong>
        });
      }

      if (natValue === 1) {
        const text = isAttack ? "Sorry!!!" : "Oh verdammt!";
        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: <em>${text}</em>
        });
      }
    }
  }
});
