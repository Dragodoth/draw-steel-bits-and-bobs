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
                // Name and hint should ideally be localization keys
                name: "Enable Heroic Resources Notes Field",
                hint: "Adds a dedicated enriched notes field after the Hero sheet's Resources section.",
                scope: "client",
                config: true,
                type: new fields.BooleanField(),
            default: false,
                requiresReload: true,
            },
            "enable-surges-prompt": {
                // Name and hint should ideally be localization keys
                name: "Enable Surges Prompt",
                hint: "Enables prompt after ability roll whether to spend surges or not",
                scope: "client",
                config: true,
                type: new fields.BooleanField(),
            default: false,
                requiresReload: true,
            },
            "enable-edges-automatization": {
                // Name and hint should ideally be localization keys
                name: "Enable Edges Automatization",
                hint: "Enables automaticaly adding edges for tactician mark and high ground",
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
