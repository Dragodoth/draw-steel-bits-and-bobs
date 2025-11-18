import DrawSteelBitsandBobsSettingsHandler from "./settings.mjs";
import { moduleID } from "./constants.mjs";
import promptAndSpendSurges from "./surges.mjs";
import handlePowerRollDialog from "./edges.mjs"
import registerCustomDrawSteelActorSheet from "./prosemirror-heroic-resources-sheet.mjs";

const waitingForRollToFinish = new Map();

function registerSurgeHooks() {
    if (!game.settings.get(moduleID, "enable-surges-prompt")) return;
    
    Hooks.on("createChatMessage", handleChatMessage);
    
    if (game.modules.get("dice-so-nice")?.active) {
        Hooks.on("diceSoNiceRollComplete", handleDiceSoNiceComplete);
    }
}

async function handleChatMessage(message, options, userId) {
    if (userId !== game.user.id) {
        console.log(`Draw Steel Bits and Bobs | Wrong user.`);
        return;
    }
    
    if (message.type != "abilityUse" ||
        !message.rolls?.some(roll => roll.constructor.name === "DamageRoll")) {
        console.log(`Draw Steel Bits and Bobs | Not ability or no damage roll.`);
        return;
    }
    
    const actor = game.actors.get(message.speaker.actor);
    
    if (!actor) {
        console.warn(`Draw Steel Bits and Bobs | No actor`);
        return;
    }
    
    const token = canvas.ready ? canvas.tokens.get(message.speaker.token)?.document : null;
    
    if (!token) {
        console.warn(`Draw Steel Bits and Bobs | No token`);
        return;
    }
    
    waitingForRollToFinish.set(message.id, { actor, token, userId });
    
    if (!game.modules.get("dice-so-nice")?.active) {
        await promptAndSpendSurges(actor, token, userId);
    }
}

async function handleDiceSoNiceComplete(messageId) {
    if (waitingForRollToFinish.has(messageId)) {
        const { actor, token, userId } = waitingForRollToFinish.get(messageId);
        waitingForRollToFinish.delete(messageId);
        
        if (userId !== game.user.id) {
            console.log(`Draw Steel Bits and Bobs | Wrong user.`);
            return;
        }
        
        if (!actor) {
            console.warn(`Draw Steel Bits and Bobs | No actor`);
            return;
        }
        
        await promptAndSpendSurges(actor, token, userId);
    }
}

Hooks.once("init", () => {
    console.log("Draw Steel Bits and Bobs initialized.")
    DrawSteelBitsandBobsSettingsHandler.registerSettings();
});

Hooks.once("ready", () => {
    if (game.settings.get(moduleID, "enable-heroic-resources-notes")) {
        console.log("Draw Steel Bits and Bobs | Registering CustomDrawSteelActorSheet");
        registerCustomDrawSteelActorSheet();
    }
    
    registerSurgeHooks();
    
    handlePowerRollDialog()
});
