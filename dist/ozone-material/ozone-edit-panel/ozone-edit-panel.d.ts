import { Item } from 'ozone-type';
import { OzoneMediaEdit } from 'ozone-media-edit';
/**
 * <ozone-edit-panel> is an element that display an ozone media edit in a panel.
 *
 * ```html
 * <ozone-edit-panel selected-item={{item}}>  <ozone-edit-panel>
 * ```
 *
 * ### Events
 *
 * * *close-tap* fire on click on close button.
 * * *save-tap* fire on click on save button.
 *
 */
export declare class OzoneEditPanel extends Polymer.Element {
    $: {
        mediaEditor: OzoneMediaEdit;
    };
    /**
     * Item to edit
     */
    selectedItem: Item;
    static readonly properties: {
        selectedItem: {
            type: ObjectConstructor;
        };
        display: {
            type: BooleanConstructor;
            value: boolean;
        };
    };
    private _closePanel();
    private _save();
}