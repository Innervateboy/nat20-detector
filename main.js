// Modul-Einstellungen registrieren
Hooks.once("init", () => {
  game.settings.register("nat20-detector", "enableReactions", {
    name: "Aktiviere Nat 20 / Nat 1 Reaktionen",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.registerMenu("nat20-detector", "actorSelector", {
    name: "Actor für Reaktionen",
    label: "Actor-Auswahl öffnen",
    hint: "Wähle deinen Actor aus oder gib eine ID manuell ein.",
    icon: "fas fa-user",
    type: ActorSelectorForm,
    restricted: false
  });

  game.settings.register("nat20-detector", "preferredActorId", {
    name: "Actor-ID für Reaktionen",
    hint: "Wenn du eine ID manuell einfügst, entferne „Actor.“ davor.",
    scope: "client",
    config: false,
    type: String,
    default: ""
  });

  const messages = [
    { key: "msgNat20Attack", name: "Nachricht: Nat 20 (Angriff)", def: "Boom Headshot!" },
    { key: "msgNat20Other", name: "Nachricht: Nat 20 (Sonstiger Wurf)", def: "Schaut mich an!!" },
    { key: "msgNat1Attack", name: "Nachricht: Nat 1 (Angriff)", def: "Sorry!!!" },
    { key: "msgNat1Other", name: "Nachricht: Nat 1 (Sonstiger Wurf)", def: "Oh verdammt!" },
  ];
  for (let m of messages) {
    game.settings.register("nat20-detector", m.key, {
      name: m.name,
      scope: "client",
      config: true,
      type: String,
      default: m.def
    });
  }
});

Hooks.once("ready", () => {
  console.log("🧪 [nat20-detector v2.0.5] Modul bereit");

  Hooks.on("dnd5e.rollAttack", async (workflow, roll) => {
    if (!roll) return;
    handleRoll(roll, true);
  });

  Hooks.on("dnd5e.rollCheck", async (roll) => {
    if (!roll) return;
    handleRoll(roll, false);
  });
});

async function handleRoll(roll, isAttack = false) {
  const enabled = game.settings.get("nat20-detector", "enableReactions");
  if (!enabled) return;

  const die = Array.isArray(roll.dice) ? roll.dice.find(d => d.faces === 20) : null;
  if (!die || !die.results || !die.results.length) {
    console.warn("[nat20-detector] Kein gültiger W20-Roll erkannt.");
    return;
  }

  const result = die.results[0]?.result;
  if (result !== 1 && result !== 20) return;

  const actorId = game.settings.get("nat20-detector", "preferredActorId");
  const actor = game.actors.get(actorId) || game.user.character;
  if (!actor) {
    ui.notifications.warn("[nat20-detector] Kein gültiger Actor gefunden.");
    console.error("Actor-ID ungültig oder leer:", actorId);
    return;
  }

  const speaker = ChatMessage.getSpeaker({ actor });
  let text = "";

  if (result === 20) {
    text = isAttack
      ? game.settings.get("nat20-detector", "msgNat20Attack")
      : game.settings.get("nat20-detector", "msgNat20Other");
  } else if (result === 1) {
    text = isAttack
      ? game.settings.get("nat20-detector", "msgNat1Attack")
      : game.settings.get("nat20-detector", "msgNat1Other");
  }

  ChatMessage.create({ speaker, content: text });
}

// UI Klasse
class ActorSelectorForm extends FormApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "actor-selector",
      title: "Actor auswählen",
      template: "templates/apps/actor-selector.html",
      width: 450,
      height: "auto"
    });
  }

  getData() {
    const selectedId = game.settings.get("nat20-detector", "preferredActorId");
    const actors = game.actors.filter(a => a.hasPlayerOwner && a.testUserPermission(game.user, "OWNER"));
    return {
      actors: actors.map(a => ({
        id: a.id,
        name: a.name,
        selected: a.id === selectedId
      })),
      selectedId
    };
  }

  async _render(...args) {
    await super._render(...args);
    const html = this.element;
    html.find("#test-reaction").click(() => {
      const actorId = game.settings.get("nat20-detector", "preferredActorId");
      const actor = game.actors.get(actorId);
      if (!actor) {
        ui.notifications.warn("Kein gültiger Actor für Test gefunden.");
        return;
      }
      const speaker = ChatMessage.getSpeaker({ actor });
      ChatMessage.create({ speaker, content: "<strong>Testnachricht: Es funktioniert!</strong>" });
    });
  }

  async _updateObject(event, formData) {
    const id = formData["actor-id"] || formData.actor;
    await game.settings.set("nat20-detector", "preferredActorId", id);
  }
}


// Eigener Einstellungsbereich mit echtem Button
Hooks.once("init", () => {
  game.settings.registerMenu("nat20-detector", "testInterface", {
    name: "Testfunktion ausführen",
    label: "🧪 Reaktion testen",
    hint: "Führe eine Testnachricht mit deinem gewählten Actor aus.",
    icon: "fas fa-vial",
    type: TestButtonForm,
    restricted: false
  });
});

class TestButtonForm extends FormApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "nat20-test-button",
      title: "🧪 Testnachricht auslösen",
      template: "templates/apps/test-button.html",
      width: 400,
      height: "auto"
    });
  }

  getData() {
    return {};
  }

  async _updateObject(event, formData) {
    const actorId = game.settings.get("nat20-detector", "preferredActorId");
    const actor = game.actors.get(actorId);
    if (!actor) {
      ui.notifications.warn("Kein gültiger Actor für Test gefunden.");
      return;
    }
    const speaker = ChatMessage.getSpeaker({ actor });
    ChatMessage.create({ speaker, content: "<strong>Testnachricht: Es funktioniert!</strong>" });
  }
}
