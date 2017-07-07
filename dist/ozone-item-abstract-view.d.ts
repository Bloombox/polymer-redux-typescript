import { Item } from 'ozone-type';
import { OzoneTypeAPI } from 'ozone-type-api';
import { SizeEnum } from 'mediaUrl';
export interface rawField {
    name: string;
    type: string;
    value: any;
}
export interface OzoneItemAbstractViewInterface extends PolymerElement {
    /**
     * item to display
     */
    itemData: Item;
    /**
     * reference to ozoneTypeApi to use to introspect fields types
     * By default it use getOzoneTypeAPI() to get the API
     * Use this field if you don't need the default TypeApi
     */
    ozoneTypeApi: OzoneTypeAPI;
    /**
     * url of the image preview
     */
    previewImage: string;
    /**
     * observer function on itemData.
     * Overwrite this function in child implementation
     * @abstract
     * @param {Item} data
     */
    dataChange(data: Item): void;
    loadImage(data: Item, size: SizeEnum): Promise<void>;
}
export interface OzoneItemAbstractViewConstructor {
    new (): OzoneItemAbstractViewInterface;
}
export interface OzoneItemAbstractViewMixinType {
    (parentClass: PolymerElementConstructor): OzoneItemAbstractViewConstructor;
}
/**
 * `OzoneItemAbstractView` is an abstract class for item view.
 * It provide ozoneTypeApi and an observer on the itemData.
 *
 * Example in javaScript:
 * ```javaScript
 *         class OzoneItemPreview extends OzoneItemAbstractView(Polymer.Element){
 *          //place your code here
 *         }
 * ```
 */
export declare const OzoneItemAbstractView: OzoneItemAbstractViewMixinType;