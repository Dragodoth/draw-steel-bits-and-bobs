import { moduleID } from "./constants.mjs";

const fields = foundry.data.fields;
/**
 * Helper class for setting registration.
 * Never actually constructed, only used to group static methods.
 */
export default class DrawSteelBitsandBobsSettingsHandler {
    /**
     * All settings associated with the system.
     * @type {Record<string, SettingConfig>}
     */
    static get systemSettings() {
        return {
            "enable-heroic-resources-notes": {
                // Name and hint should ideally be localization keys (e.g., DRAW_STEEL.Setting.AddHeroicResourcesNotes.Label)
                name: "Enable Heroic Resources Notes Field",
                hint: "Adds a dedicated enriched notes field after the Hero sheet's Resources section.",
                scope: "client",
                config: true,
                type: new fields.BooleanField(),
                default: false,
                requiresReload: true,
            },
            "enable-surges-promt": {
                // Name and hint should ideally be localization keys (e.g., DRAW_STEEL.Setting.AddHeroicResourcesNotes.Label)
                name: "Enable Surges Prompt",
                hint: "Enables promt after ability roll whether to spend surges or not",
                scope: "client",
                config: true,
                type: new fields.BooleanField(),
                default: false,
                requiresReload: true,
            }
        };
    }
    
    /* -------------------------------------------------- */
    
    /**
     * Helper function called in the `init` hook.
     */
    static registerSettings() {
        for (const [key, value] of Object.entries(this.systemSettings)) {
            game.settings.register(moduleID, key, value);
        }
    }
}
