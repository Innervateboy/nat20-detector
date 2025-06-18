Hooks.on("ready", () => {
  console.log("🧪 [Nat20-API] Modul aktiv");
});

Hooks.on("createChatMessage", async (msg) => {
  if (!msg.isRoll || !msg.rolls?.length) return;

  const roll = msg.rolls[0]; // Wir gehen von 1 Würfelwurf aus
  const terms = roll.terms;
  const actor = msg.actor;

  if (!actor) return;

  const isAttack = msg.flags?.dnd5e?.roll?.type === "attack";

  // Alle nat 20s oder nat 1s finden
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