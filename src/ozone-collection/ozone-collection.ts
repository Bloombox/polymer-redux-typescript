/**
 * Created by hubert on 8/06/17.
 */
import {customElement, domElement} from 'decorators';
import {Item} from 'ozone-type';
import {OzoneItemAPI, SearchGenerator, SearchQuery} from 'ozone-item-api';


export interface DomElements {
    ozoneApi:OzoneItemAPI
    scrollTheshold:{
        clearTriggers():void
    }
}
/**
 * <ozone-collection> is a generic component to manage collection of item.
 */
@customElement('ozone-collection')
export class OzoneCollection  extends Polymer.Element{

    @domElement()
    $: DomElements;

    //@property()
    sourceId: string;

    //@property()
    _source: OzoneItemAPI | null;

    get _getSource() {return this._source as OzoneItemAPI};

    //@property()
    items: Array<Item>;

    total: Number;
    dataRemain: Boolean

    _searchIterator: SearchGenerator;

    static get properties() {
        return {
            /**
             * id of the OzoneItemAPI element to be use as source
             */
            sourceId: {
                type: String,
                observer: "_updateSource"
            },
            
            _source: {
                type: Object
            },

            /**
             * Array of items loaded from the source
             */
            items: {
                type: Array,
                notify: true,
                value: () =>  []
            },

            _searchIterator:{
                type:Object
            },

            /**
             * total number of results found in ozone
             */
            total:{
                type: Number,
                notify: true
            },

            /**
             * true if there is still data to be loaded in the collection.
             */
            dataRemain:{
                type: Boolean,
                notify:true,
                value: false
            }
        }
    }


    _updateSource(sourceId: string){
        if(! (this.parentNode == null)) {
            this._source = this.parentNode.querySelector(`#${this.sourceId}`) as OzoneItemAPI;
        }
    }

    /**
     * load first collection items
     * items are added to the items array.
     * @param size {number} number of items to load default value is 10
     */
    loadItems(size:number){
        this.quickSearch('', size);
    }

    /**
     * quick search for items in the collection.
     * @param searchString
     * @param size {number} number of items to load default value is 10
     */
    quickSearch(searchString:string, size?:number){
        size = size || 10;
        let searchQuery = new SearchQuery();
        searchQuery.size = size;
        searchQuery.quicksearch(searchString);
        this.search(searchQuery);
    }

    /**
     * Start a complex search on the collection
     * found items are added to the items array.
     * @param searchQuery {SearchQuery} search query
     */
    search(searchQuery:SearchQuery){
        this._verifySource();
        this._searchIterator = this._getSource.search(searchQuery);
        this.loadNextItems()
    }

    /**
     * query next search result from ozone.
     * found items are added to the items array.
     * @return {Promise}
     */
    loadNextItems(){
        if(this._searchIterator) {
            return this._searchIterator.next().then((searchResult)=>{
                this.set('dataRemain', this._searchIterator.done)
                this.set('total', searchResult.total);
                searchResult.results.forEach((item)=>{
                    this.push('items', item);
                })
            });
        }
        return Promise.reject('_searchIterator not define you probably did not search for items')
    }

    /**
     * find one item in ozone collection.
     * The item found is added in the items array.
     * @param id {uuid} id of the item to get.
     * @return {Promise<Item>} promise resolve with the item or null (if not found).
     */
    findOne(id:uuid):Promise<Item | null>{
        try {
            this.isDefined(id);

            const index = this.getIndexById(id);
            let result;
            if (index < 0) {
                this._verifySource();
                result = this._getSource.getOne(id)
                    .then(item => {
                        if (item) {
                            this.push('items', item);
                        }
                        return item;
                    });
            } else {
                result = Promise.resolve(this.items[index]);
            }
            return result
        } catch (err) {
            return Promise.reject(err)
        }
    }

    private isDefined(param: any) {
        if (!param) throw new TypeError('parameter is undefined');
    }

    /**
     * save all items present in items on ozone.
     * items are updated with the result of the save.
     * @return {Promise<Array<Items>>} promise resolve with the list io items saved.
     */
    saveAll():Promise<any>{
        try {
            this._verifySource();
            return this._getSource.bulkSave(this.items)
                .then(items => {
                    this.set('items', items);
                    return items;
                })
        } catch (err){
            return Promise.reject(err);
        }
    }

    /**
     * get index of an id in items
     * @param id {uuid} id of the item
     * @return {number} index of the item in items. -1 when not found.
     */
    getIndexById(id?:uuid):number{
        let index = -1;
        if (id){
            index = this.items.findIndex(item => item.id == id)
        }
        return index;
    }

    /**
     * save one item in ozone.
     * result is reflect in items.
     * @param {Item} item to save.
     * @param reflect {boolean} reflect change from ozone in items list
     * @return {Promise<number>} Promise resolve with index of the item in items.
     */
    saveOne(item:Item, reflect:boolean=true):Promise<number>{
        try {
            this.isDefined(item);
            const index = this.getIndexById(item.id);
            let result;
            if (index > -1) {
                this._verifySource();
                result = this._getSource.update(item)
                    .then(item => {
                        this.items[index] = item;
                        this.notifyPath('items');
                        return index;
                    })
            } else {
                result = this.add(item);
            }
            return result;
        } catch (err){
            return Promise.reject(err);
        }
    }

    /**
     * Create a new item in the collection
     * @param item
     * @param reflect {boolean} reflect change from ozone in items list
     * @return {Promise<number>} promise the resolve with the index in items
     */
    add(item:Item, reflect:boolean=true):Promise<number>{
        try {
            this.isDefined(item);
            this._verifySource();
            return this._getSource.create(item)
                .then(item => {
                    if(reflect) {
                        this.push('items', item);
                    }
                    return this.items.length - 1;
                });
        } catch (err){
            return Promise.reject(err)
        }
    }

    /**
     * delete all items store in items from ozone.
     * @param reflect {boolean} reflect change from ozone in items list
     * @return {Promise}
     */
    deleteAll(reflect:boolean=true):Promise<any>{
        try {
            this._verifySource();
            const ids = this.items.map(item => item.id);
            return this._getSource.bulkDelete(ids)
                .then((result) => {
                    if(reflect) {
                        this.set('items', []);
                    }
                    return result;
                });
        } catch (err){
            return Promise.reject(err);
        }
    }

    /**
     * Delete from ozone a list of item.
     * @param ids {Array<uuid>} list of id to delete from ozone.
     * @param reflect {boolean} reflect change from ozone in items list
     * @return {any}
     */
    deleteItems(ids:Array<uuid>, reflect:boolean=true){
        try {
            this.isDefined(ids);
            this._verifySource();
            this._verifySource();
            return this._getSource.bulkDelete(ids)
                .then((ids)=>{
                    if(reflect) {
                        ids.map(id => {
                            this._removeOne(id);
                        });
                    }

                });
        } catch (err){
            return Promise.reject(err);
        }
    }

    /**
     * delete one item from ozone.
     * @param id {uuid} id to delete
     * @param reflect {boolean} reflect change from ozone in items list
     * @return {any}
     */
    deleteOne(id:uuid, reflect:boolean=true){
        try {
            this.isDefined(id);
            this._verifySource();
            return this._getSource.deleteOne(id)
                .then((id)=>{
                    if(reflect) {
                        this._removeOne(id);
                    }
                });
        } catch (err){
            return Promise.reject(err);
        }
    }

    _removeOne (id:uuid) {
        const index = this.getIndexById(id);
        if (index > -1 ){
            this.splice('items', index, 1);
        }
    }

    _verifySource() {
        if(!this._source){
            throw new Error('Invalid source')
        }
    }
}