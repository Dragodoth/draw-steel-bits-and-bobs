import DrawSteelBitsandBobsSettingsHandler from "./settings.mjs";
import { CustomDrawSteelActorSheet } from "./prosemirror-heroic-resources-sheet.mjs";
import { moduleID } from "./constants.mjs";
import promptAndSpendSurges from "./surges.mjs"

function wait(ms) {
    // Returns a Promise that resolves after the setTimeout completes.
    return new Promise(resolve => setTimeout(resolve, ms));
}

Hooks.once("init", () => {
    DrawSteelBitsandBobsSettingsHandler.registerSettings();
});

Hooks.once("ready", () => {
    const enableNotes = game.settings.get(moduleID, "enable-heroic-resources-notes");
    
    if (!game.settings.get(moduleID, "enable-heroic-resources-notes")) return;
    
    Actors.registerSheet("drawsteel", CustomDrawSteelActorSheet, {
        types: ["hero"],
        label: "DrawSteel Bits and Bobs",
        makeDefault: true
    });
    
});

const waitingForRollToFinish = new Map();

Hooks.on("createChatMessage", (message, options, userId) => {
    if (!game.settings.get(moduleID, "enable-heroic-resources-notes")) return;
    
    if (message.type === "abilityUse"
        &&
        message.rolls.some(roll => roll.constructor.name === "DamageRoll")) {
        const actor = game.actors.get(message.speaker.actor);
        const token = canvas.ready
        ? canvas.tokens.get(message.speaker.token)
        : null;
        
        if (actor) {
            waitingForRollToFinish.set(message.id, { actor, token });
        }
    }
});

Hooks.on("diceSoNiceRollComplete", async (messageId) => {
    if (waitingForRollToFinish.has(messageId)) {
        const { actor, token } = waitingForRollToFinish.get(messageId);
        
        await promptAndSpendSurges(
                                   actor,
                                   token
                                   );
        
        waitingForRollToFinish.delete(messageId);
    }
});
