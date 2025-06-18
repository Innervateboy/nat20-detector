// Modul-Einstellungen registrieren (Client-seitig)
Hooks.once("init", () => {
  game.settings.register("nat20-reactor", "enableReactions", {
    name: "Aktiviere Nat 20 / Nat 1 Reaktionen",
    hint: "Wenn aktiviert, werden bei kritischen Erfolgen oder Patzern automatisch Chatnachrichten vom Actor gesendet.",
    scope: "client",        // Jeder Client kann selbst entscheiden
    config: true,
    type: Boolean,
    default: true
  });
});

// Beim Modulstart
Hooks.once("ready", () => {
  console.log(" [nat20-reactor] Modul geladen und bereit");
});

// Hook auf neue Chatnachrichten (Würfe)
Hooks.on("createChatMessage", async (msg) => {
  // Prüfe, ob Reaktionen für diesen Spieler aktiviert sind
  const enabled = game.settings.get("nat20-reactor", "enableReactions");
  if (!enabled) return;

  // Kein gültiger Wurf → raus
  if (!msg.isRoll || !msg.rolls?.length) return;

  const roll = msg.rolls[0];
  const terms = roll.terms;
  const actor = msg.actor;
  if (!actor) return;

  // Ist es ein Angriff?
  const isAttack = msg.flags?.dnd5e?.roll?.type === "attack";

  // Alle Würfel im Roll prüfen
  for (const term of terms) {
    if (term instanceof Die && term.faces === 20) {
      const natValue = term.results[0].result;

      // NAT 20
      if (natValue === 20) {
        const text = isAttack ? "Boom Headshot!" : "Schaut mich an!!";
        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: <strong>${text}</strong>
        });
      }

      // NAT 1
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
