/**
 * Created by hubert on 8/06/17.
 */
/// <amd-module name="ozone-item-view"/>

import {customElement} from 'decorators'
import {Item} from 'ozone-type'
import {FieldDescriptor} from 'ozone-type'
import{OzoneItemAbstractView, OzoneItemAbstractViewConstructor} from 'ozone-item-abstract-view'
import {MediaUrl, OzonePreviewSize} from 'mediaUrl'

export interface rawField{
    name:string,
    type:string,
    value: any
}

/**
 * `ozone-item-view` is hight level polymer module to display raw information an ozone item.
 *
 * Example in html:
 * ```html
 * <ozone-item-view itemData=[[item]] ozoneTypeApiId="DifferentOzoneTypeApi"></ozone-item-view>
 * ```
 *
 * Example in javaScript:
 * ```javaScript
 *         var toLocal = document.createElement('ozone-item-view') as OzoneItemView;
 *         toLocal.id = 'ozoneViewContent'
 *         toLocal.className = type;
 *         toLocal.itemData = data;
 *         // if you don't want to use the default API
 *         toLocal.ozoneTypeApi = this.parentNode.querySelector('#ozoneApiType') as OzoneTypeAPI;
 *         this.root.appendChild(toLocal);
 * ```
 */

@customElement('ozone-item-view')
export class OzoneItemView  extends OzoneItemAbstractView(Polymer.Element) {


    /**
     * raw fields information to display
     */
    rawFields: Array<rawField>;

    /**
     * url of the image preview
     */
    previewImage: string;

    static get properties() {
        return {
            rawFields: {
                type: Array,
                notify: true,
                value: () => ([])
            },
            previewImage: {
                type: String
            }
        }
    }

    async dataChange(data:Item){
        let rawFields: Array<rawField> = [];

        let entries = this.orderEntries(data);


        for (let entry of entries){
            const description = await (this.ozoneTypeApi.findFieldInCollection(data.type, entry));

            let fieldType;
            if(description && description.fieldType) {
                fieldType = description.fieldType;
            } else {
                fieldType = "unknown";
            }
            let fieldName = this.computeFieldName(entry, description);

            this.push('rawFields',{
                name:fieldName,
                type:fieldType,
                value: data[entry]
            });

        }
        await ( this.loadImage(data, OzonePreviewSize.Small))
    }

    private computeFieldName(entry:string, description: FieldDescriptor| null) {
        let fieldName;
        if (description && description.name) {
            fieldName = description.name;
        } else {
            fieldName = {strings: {en: entry + '*'}};
            console.log(fieldName)
        }
        return fieldName;
    }

    private orderEntries(data: Item) {
        let entries = [];
        for (let entry in data) {
            entries.push(entry)
        }
        entries.sort();
        return entries;
    }
}