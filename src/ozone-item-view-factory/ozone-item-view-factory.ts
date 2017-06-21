/**
 * Created by hubert on 20/06/17.
 */


import {customElement} from 'decorators'
import {Item} from "ozone-type";
import {OzoneTypeAPI} from "ozone-type-api";
import {OzoneItemView} from 'ozone-item-view'


export interface DomElements {
    ozoneType:OzoneTypeAPI
}

/**
 * `ozone-item-view-factory` is a factory to generate ozone-item-view and added to the dom.
 *
 * Example:
 * ```html
 *  <ozone-item-view-factory item="[[selectedItem]]"></ozone-item-view-factory>
 * ```
 *
 */
@customElement('ozone-item-view-factory')
export class OzoneItemViewFactory extends Polymer.Element{

    $: DomElements;
    /**
     * item to display
     */
    item: Item;

    type:string;

    static get properties() {
        return {
            item: {
                type: Object,
                observer:'_itemChange'
            }
        }
    }

    _typeChange(){
        this.$.ozoneType.loadType()
    }

    _itemChange(item?: Item){
        if(item) {
            this.removeEntry();
            this.createEntry(item, item.type)
        }
    }

    removeEntry(){
        const ozoneViewContent = this.root.querySelector('#ozoneViewContent');
        if(ozoneViewContent) {
            this.root.removeChild(ozoneViewContent);
        }
    }

    createEntry(data: Item, type: string){
        var toLocal = document.createElement('ozone-item-view') as OzoneItemView;
        toLocal.id = 'ozoneViewContent'
        toLocal.className = type;
        toLocal.itemData = data;
        toLocal.ozoneTypeApi = this.parentNode.querySelector('#ozoneApiType') as OzoneTypeAPI;
        this.root.appendChild(toLocal);

    }

}

