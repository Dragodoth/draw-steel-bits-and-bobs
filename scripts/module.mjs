import DrawSteelBitsandBobsSettingsHandler from "./settings.mjs";
import { moduleID } from "./constants.mjs";
import promptAndSpendSurges from "./surges.mjs";
import registerCustomDrawSteelActorSheet from "./prosemirror-heroic-resources-sheet.mjs";

Hooks.once("init", () => {
    console.log("Draw Steel Bits and Bobs initialized.")
    DrawSteelBitsandBobsSettingsHandler.registerSettings();
});

Hooks.once("ready", () => {
    if (!game.settings.get(moduleID, "enable-heroic-resources-notes")) return;
    
    console.log("Registering CustomDrawSteelActorSheet");
    registerCustomDrawSteelActorSheet();
});

const waitingForRollToFinish = new Map();

Hooks.on("createChatMessage", (message, options, userId) => {
    if (!game.settings.get(moduleID, "enable-surges-prompt")) return;
    
    if (userId !== game.user.id) {
        console.log(`Wrong user.`);
        return;
    }
    
    if (message.type != "abilityUse" ||
        !message.rolls.some(roll => roll.constructor.name === "DamageRoll")){
        console.log(`Not ablity or no damage roll.`);
        return;
    }
        
    const actor = game.actors.get(message.speaker.actor);
    const token = canvas.ready ? canvas.tokens.get(message.speaker.token)?.document : null;
    
    if (!actor) {
        console.warn(`No actor`);
        return;
    }
    
    waitingForRollToFinish.set(message.id, { actor, token, userId });
});

Hooks.on("diceSoNiceRollComplete", async (messageId) => {
    if (waitingForRollToFinish.has(messageId)) {
        const { actor, token, userId } = waitingForRollToFinish.get(messageId);
        waitingForRollToFinish.delete(messageId);
        
        if (userId !== game.user.id) {
            console.log(`Wrong user.`);
            return;
        }
        
        if (!actor) {
            console.warn(`No actor`);
            return;
        }
        
        await promptAndSpendSurges(actor, token, userId);
    }
});
