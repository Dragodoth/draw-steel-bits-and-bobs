import { moduleID } from "./constants.mjs";

export default async function registerCustomDrawSteelActorSheet() {
    
    const { ux } = foundry.applications;
    
    const DrawSteelHeroSheet = CONFIG.Actor.sheetClasses.hero['draw-steel.DrawSteelHeroSheet'].cls;
    
    const CustomDrawSteelHeroSheet = class extends DrawSteelHeroSheet {
        
        /** @override */
        static get defaultOptions() {
            return super.defaultOptions;
        }
        
        /** @override */
        async render(force = false, options = {}) {
            const result = await super.render(force, options);
            
            if (this.element) {
                const $html = $(this.element);
                this._addProseMirrorNotes($html);
            }
            
            return result;
        }
        
        _addProseMirrorNotes($html) {
            const flagKey = "heroic-resources";
            
            const notes = this.actor.getFlag(moduleID, flagKey) || "";
            const editorId = `ds-heroic-resources-editor-${this.actor.id}`;
            const statsTab = $html.find('.tab[data-tab="stats"]');
            
            if (!statsTab.length){
                console.log("Draw Steel Bits and Bobs | No stats tab found.")
                return;
            }
                
            
            if (this.isEditMode) {
                const characteristicsFieldset = statsTab.find('fieldset.characteristics');
                if (!characteristicsFieldset.length) {
                    console.log("Draw Steel Bits and Bobs | No characteristics field found.")
                    return;
                }
                const editorHTML = `
                <fieldset class="heroic-resources">
                    <legend>Heroic Resources</legend>
                    <div class="prosemirror editor">
                        <div id="${editorId}" class="editor-content" data-dtype="String">${notes}</div>
                    </div>
                </fieldset>
            `;
                
                characteristicsFieldset.after(editorHTML);
                this._activateProseMirror(editorId, notes, moduleID, flagKey);
                
            } else {
                const resourcesFieldset = statsTab.find('fieldset.resources');
                if (!resourcesFieldset.length) {
                    console.log("Draw Steel Bits and Bobs | No resources field found.")
                    return;
                }
                
                if (!notes) return;
                
                ux.TextEditor.implementation.enrichHTML(notes, {
                    relativeTo: this.actor,
                    async: true
                }).then(enrichedNotes => {
                    const displayHTML = `
                    <fieldset class="heroic-resources">
                        <legend>Heroic Resources</legend>
                        <div class="enriched-content" style="padding: 8px;">
                            ${enrichedNotes}
                        </div>
                    </fieldset>
                `;
                    
                    resourcesFieldset.after(displayHTML);
                });
            }
        }
        
        /** @type {ProseMirrorEditor} */
        #editor = null;
        
        async _activateProseMirror(containerId, content, moduleID, flagKey) {
            if (this.#editor) {
                this.#editor.destroy();
                this.#editor = null;
            }
            
            const editorContainer = document.getElementById(containerId);
            if (!editorContainer) {
                console.log("Draw Steel Bits and Bobs | No editor found.")
                return;
            }
            
            const wrapper = editorContainer.closest(".prosemirror.editor");
            const tab = editorContainer.closest("section.tab");
            
            if (wrapper && tab) {
                tab.classList.add("editorActive");
                wrapper.classList.add("active");
            }
            
            const fieldName = `flags.${moduleID}.${flagKey}`;
            
            this.#editor = await ux.ProseMirrorEditor.create(editorContainer, content, {
                document: this.actor,
                fieldName: fieldName,
                relativeLinks: true,
                collaborate: false,
                plugins: {
                    menu: ProseMirror.ProseMirrorMenu.build(ProseMirror.defaultSchema, {
                        destroyOnSave: true,
                        onSave: this._saveEditor.bind(this, moduleID, flagKey),
                    }),
                    keyMaps: ProseMirror.ProseMirrorKeyMaps.build(ProseMirror.defaultSchema, {
                        onSave: this._saveEditor.bind(this, moduleID, flagKey),
                    }),
                }
            });
        }
        
        async _saveEditor(moduleID, flagKey) {
            if (!this.#editor) {
                console.log("Draw Steel Bits and Bobs | No editor found.")
                return;
            }
            
            const newValue = ProseMirror.dom.serializeString(this.#editor.view.state.doc.content);
            const currentValue = this.actor.getFlag(moduleID, flagKey) || "";
            
            if (newValue !== currentValue) {
                const updateData = {};
                updateData[`flags.${moduleID}.${flagKey}`] = newValue;
                
                await this.actor.update(updateData, { render: false });
            }
            
            this._cleanupEditor();
            await this.render();
        }
        
        _cleanupEditor() {
            if (this.#editor) {
                this.#editor.destroy();
                this.#editor = null;
            }
            
            const $html = $(this.element);
            $html.find('.editorActive').removeClass('editorActive');
            $html.find('.prosemirror.editor.active').removeClass('active');
        }
        
        /** @override */
        async _onSubmit(event, {preventCancel=false, preventRender=false}={}) {
            if (this.#editor) {
                const flagKey = "heroic-resources";
                await this._saveEditor(moduleID, flagKey);
            }
            
            return super._onSubmit(event, {preventCancel, preventRender});
        }
        
        /** @override */
        async close(options={}) {
            if (this.#editor) {
                const flagKey = "heroic-resources";
                await this._saveEditor(moduleID, flagKey);
            }
            return super.close(options);
        }
        
        /** @override */
        async _onRender(context, options) {
            await super._onRender(context, options);
            this._setupEditorEventListeners();
        }
        
        _setupEditorEventListeners() {
            const customNotes = this.element.querySelector(".custom-notes");
            if (!customNotes) {
                console.log("Draw Steel Bits and Bobs | No notes found.")
                return;
            }
            
            const editorButtons = customNotes.querySelectorAll("prose-mirror button[type=\"button\"]");
            for (const button of editorButtons) {
                const formGroup = button.closest(".form-group");
                const tabSection = button.closest("section.tab");
                button.addEventListener("click", () => {
                    if (formGroup) formGroup.classList.add("active");
                    if (tabSection) tabSection.classList.add("editorActive");
                });
            }
            
            const editors = customNotes.querySelectorAll("prose-mirror");
            for (const ed of editors) {
                const formGroup = ed.closest(".form-group");
                const tabSection = ed.closest("section.tab");
                ed.addEventListener("close", () => {
                    if (formGroup) formGroup.classList.remove("active");
                    if (tabSection) tabSection.classList.remove("editorActive");
                });
            }
        }
    }
    
    Actors.registerSheet("drawsteel", CustomDrawSteelHeroSheet, {
        types: ["hero"],
        label: "DrawSteel Bits and Bobs",
        makeDefault: true
    });
}
