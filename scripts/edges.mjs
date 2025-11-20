export default async function handlePowerRollDialog() {
    // Save the original method
    const originalGetTargetModifiers = CONFIG.Item.dataModels.ability.prototype.getTargetModifiers;
    
    // Overwrite the method
    CONFIG.Item.dataModels.ability.prototype.getTargetModifiers = function (target) {
        
        // Call the original method
        const modifiers = originalGetTargetModifiers.call(this, target);
        
        const targetActor = target.actor;
        const token = canvas.tokens.controlled[0]?.actor === this.actor ? canvas.tokens.controlled[0] : null;
        
        if (targetActor) {
            // Mark condition check - targeting marked gets an edge
            if (targetActor.effects.some(e => e.name === "Mark")){
                console.log("Draw Steel Bits and Bobs | Mark condition check");
                modifiers.edges += 1;
            }
        }
        
        if (token && target && targetActor) {
            // High ground check - targeting from higher ground gets an edge
            if (token.document.elevation >= target.document.elevation + targetActor.system.combat.size.value && !targetActor.statuses.has("burrow")){
                console.log("Draw Steel Bits and Bobs | High ground check");
                modifiers.edges += 1;
            }
        }
        
        return modifiers;
    }
}


