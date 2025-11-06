export default async function promptAndSpendSurges(actor, token, userId) {

    if (!actor) {
        const selectedToken = canvas.tokens.controlled[0];
        if (selectedToken) {
            actor = selectedToken.actor;
            token = selectedToken.document;
        }
    }

    if (!actor) {
        ui.notifications.warn("No actor.");
        return;
    }

    
    if (!token) {
        token = actor.getActiveTokens()[0]?.document;
        if (!token) {
            console.warn(`No active token.`);
        }
    }
    
    const surgesAvailible = actor.system?.hero?.surges ?? 0;

    if (surgesAvailible <= 0) {
        console.log("No surges available.");
        return;
    }

    const rollData = actor.getRollData();
    
    if (!rollData) {
        ui.notifications.warn("No rollData.");
        return;
    }
    
    let dmgPerSurge = Math.max(rollData.M, rollData.A, rollData.R, rollData.I, rollData.P);
    
    const {createFormGroup, createNumberInput} = foundry.applications.fields;

    const content = document.createElement("div");
    
    const surgesDialog = createFormGroup({
        label: `You have ${surgesAvailible} surges available.`,
        rootId: "surges",
        hint: `You can use a maximum of 3 surges. Each deals ${dmgPerSurge} damage.`,
        
        input: createNumberInput({
            name: "spent",
            min: 0,
            max: Math.min(3, surgesAvailible),
            value: 0
        })
    })

    content.append(surgesDialog)

    const targetUser = game.users.get(userId);
    if (!targetUser) {
        ui.notifications.warn("Target user not found to display the dialog.");
        return;
    }

    let surgesSpent;
    try {
        surgesSpent = await foundry.applications.api.DialogV2.query(
            targetUser,
            "input",
            {
                content,
                window: {
                    title: "Spend Surges for Additional Damage?",
                    icon: "fa-solid fa-bolt"
                },
                ok: {
                    label: "Submit",
                    callback: (event, button, dialog) => {
                        const formData = new FormData(button.form);
                        
                        return parseInt(formData.get("spent") || 0);
                    }
                },
                rejectClose: false
            }
        );
    } catch (error) {
        console.log("User closed the dialog without responding", error);
        return;
    }

    if (surgesSpent === null || surgesSpent === undefined) {
        console.log("User cancelled surge spending or submitted a null value.");
        return;
    }

    surgesSpent = Math.max(0, surgesSpent);

    if (surgesAvailible < surgesSpent) {
        ui.notifications.warn("You do not have enough surges.");
        return;
    }

    if (surgesSpent > 3) {
        ui.notifications.warn("You can only use a maximum of 3 surges.");
        surgesSpent = 3;
    }
    
    if (surgesSpent === 0) {
        console.log("User submitted 0 surges. No action taken.");
        return;
    }

    const newSurges = Math.max(surgesAvailible - surgesSpent, 0);
    
    await actor.update({ 'system.hero.surges': newSurges });

    const dmg = surgesSpent * dmgPerSurge;
    
    const roll = new ds.rolls.DamageRoll(dmg.toString());
    roll.toMessage({
        author: game.user,
        speaker: ChatMessage.getSpeaker({ token }),
        flavor: `<p>${actor.name} spent ${surgesSpent} surges, and has ${newSurges} remaining.</p>`,
        rollMode: "roll"
    });
}
