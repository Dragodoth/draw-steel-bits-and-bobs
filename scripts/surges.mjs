export default async function promptAndSpendSurges(actor, token) {

    if (!actor) {
            ui.notifications.warn("Please select an Actor.");
            const selectedToken = canvas.tokens.controlled[0];
            if (selectedToken) {
                actor = selectedToken.actor;
                token = selectedToken.document;
            } else {
                ui.notifications.warn("No selected token found.");
                return;
            }
        }

        if (!token) {
            token = actor.getActiveTokens()[0]?.document;
            if (!token) {
                ui.notifications.warn("No token found.");
                return;
            }
        }

    const surgesAvailible = actor.system.hero.surges;

    if (!surgesAvailible) return;

    const rollData = actor.getRollData();

    const dmgPerSurge = Math.max(rollData.M, rollData.A, rollData.R, rollData.I, rollData.P);

    const {createFormGroup, createNumberInput} = foundry.applications.fields;

    const content = document.createElement("div");

    const surgesDialog = createFormGroup({
        label: `You have ${surgesAvailible} surges availible`,
        rootId: "surges",
        hint: `You have can use max 3 surges and each deals ${dmgPerSurge} damage`,
        input: createNumberInput({ name: "spent" })
    })

    content.append(surgesDialog)

    const surges = await ds.applications.api.DSDialog.input({
        content,
        window: {
            title: "Do you want to spend surges to deal additional damage?",
            icon: "fa-solid fa-bolt"
        }
    })

    if (!surges) return;

    if (!surges.spent === null) {surges.spent = 0;}
    
    surges.spent = Math.max(0, surges.spent);

    surges.availible = surgesAvailible;

    if (surges.availible < surges.spent) {
        ui.notifications.warn("You do not have enough surges");
        return;
    }

    if (surges.spent > 3) {
        ui.notifications.warn("You can use max 3 surges");
        surges.spent = 3;
    }

    surges.new = Math.max(surges.availible - surges.spent, 0);

    await actor.update({ 'system.hero.surges': surges.new })

    const dmg = surges.spent * Math.max(rollData.M, rollData.A, rollData.R, rollData.I, rollData.P);


    const roll = new ds.rolls.DamageRoll(dmg.toString());
    roll.toMessage({
        author: game.user,
        speaker: ChatMessage.getSpeaker({ token }),
        flavor: `<p>${token.name} spent ${surges.spent} surges, and has ${surges.new} remaining.</p>`,
        rollMode: "roll"
    });
}
