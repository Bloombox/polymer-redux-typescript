/// <amd-module name="ozone-type-api"/>
/**
 * Created by hubert on 19/06/17.
 */

import {customElement, domElement, jsElement} from 'decorators'
import {TypeDescriptor, FieldDescriptor, Grants} from 'ozone-type'
import GrantsEnum = Grants.GrantsEnum;

export type TypeDescriptorCollection = Map<string, TypeDescriptor>

/**
 * `ozone-type-api` is low level polymer module to ozone type.
 * It provide read operation on collection type.
 *
 * By default it create a instance of OzoneTypeAPI in the dom.
 * You can retrieve the default ItemApi with *getOzoneTypeAPI*
 *
 * Example:
 * ```html
 * <ozone-type-api id="ozoneTypeApi" ></ozone-type-api>
 * ```
 *  * Example
 * ```javaScript
 * const ozoneTypeAPI = getOzoneTypeAPI(); // return instance of OzoneTypeAPI located in the dom
 * ```
 */
@customElement('ozone-type-api')
export class OzoneTypeAPI  extends OzoneApiAjaxMixin(Polymer.Element){

    /**
     * collection type.
     * @value: item
     */
    collection: string;

    /**
     * cached value of types
     */
    typeCached: TypeDescriptorCollection;

    /**
     *
     * @private
     */
    _typeDescriptor: Promise<TypeDescriptor>;


    static get properties() {
        return {
            collection: {
                type: String,
                notify: false,
                value: 'item'
            },
            _typeDescriptor: {
                type: Object
            },
            typeCached:{
                type: Object,
                value: ():TypeDescriptorCollection =>{return new Map<string, TypeDescriptor>()}
            }
        }
    }
    /**
     * Load api type description form ozone and set typeDescriptor attribute.
     *
     * @return {Promise<TypeDescriptor>}
     */
    loadType(collection?:string):Promise<TypeDescriptor>{
        collection = collection || this.collection;
        this._typeDescriptor = this._buildTypeUrl(collection)
            .then((url)=>{
                return this._getRequest(url)
            }).then((response)=>{
                return response;
            });
        return this._typeDescriptor;
    }

    /**
     *
     * @private
     */
    _getRequest(url:string): Promise<any> {
        this.$.ozoneAccess.url = url;
        this.$.ozoneAccess.method = 'GET';
        return this.$.ozoneAccess
            .generateRequest().completes.then((res:any) => res.response)
    }

    _postRequest(url:string, body:any): Promise<any> {
        this.$.ozoneAccess.url = url;
        this.$.ozoneAccess.method = 'POST';
        this.$.ozoneAccess.body = JSON.stringify(body);
        return this.$.ozoneAccess
            .generateRequest().completes.then((res:any)=> res.response)
    }

    /**
     * get list of fields of the collection.
     * @return {Promise<Array<FieldDescriptor>>} list of field
     */
    getFields(collection?:string): Promise<Array<FieldDescriptor>>{
        collection = collection || this.collection;
        return this._typeDescriptor.then((type)=>{
            if (type.fields) {
                return type.fields;
            }
            else return [];
        });
    }

    /**
     *
     * @private
     */
    _buildTypeUrl(collection:string):Promise<string>{
        return getOzoneConfig().configPromise.then((config) => {
            return `${config.host}${config.type}`
                .replace(/\{type\}/, collection);
        });
    }
    /**
     *
     * @private
     */
    _buildPermissionsUrl(fields:Array<string>):Promise<string>{
        return getOzoneConfig().configPromise.then((config) => {
            return `${config.host}${config.permissions}?fields=${fields.join(',')}`;
        });
    }

    /**
     * will set TypeDescriptor for the given collection in typeCached.
     * @param collection
     * @return {Promise<TypeDescriptorCollection>} promise resolve with collection of typeDescription cached.
     */
    setType(collection: string):Promise<TypeDescriptorCollection>{
        if(this.typeCached.has(collection)){
            return Promise.resolve(this.typeCached);
        } else {
            return this.loadType(collection)
                .then((typeDescrition)=>{
                    return this.typeCached.set(collection, typeDescrition);
                })
        }
    }

    /**
     * retrieve TypeDescriptor of the given collection
     * @param collection
     * @return {TypeDescriptor}
     */
    getType(collection: string):Promise<TypeDescriptor>{
        if(this.typeCached.has(collection)){
            return Promise.resolve(this.typeCached.get(collection));
        } else {
            return this.setType(collection)
                .then((typeCollection)=>{
                    return typeCollection.get(collection);
                })
        }
    }

    /**
     * find FieldDescriptor of a field in a given collection.
     * It will look in parent if needed.
     * @param collection
     * @param field
     * @return {Promise<FieldDescriptor | null>}
     */
    findFieldInCollection(collection: string, field: string): Promise<FieldDescriptor | null>{
        return this.getType(collection)
            .then(typeDescriptor => {
                if(typeDescriptor.fields) {
                    const index = typeDescriptor.fields.findIndex(f => f.identifier == field);
                    if (index > -1) {
                        return typeDescriptor.fields[index];
                    } else if (typeDescriptor.superType) {
                        // look in parent if exist
                        return this.findFieldInCollection(typeDescriptor.superType, field);
                    }
                }
                return null;
            })
    }

    async getAllFields(collection: string):Promise<Array<FieldDescriptor>>{
        const type = await(this.getType(collection));
        const fields = type.fields || [];
        let parentFields:Array<FieldDescriptor> = [];
        if(type.superType){
            parentFields = await(this.getAllFields(type.superType));
        }
        return fields.concat(parentFields);
    }

    async ifIsTypeInstanceOf(currentType:string, instance:string): Promise<boolean>{
        if(currentType == instance){
            return true;
        } else {
            const typeDescriptor = await(this.getType(currentType));
            if (typeDescriptor && typeDescriptor.superType) {
                // look in parent if exist
                return await(this.ifIsTypeInstanceOf(typeDescriptor.superType, instance));
            } else {
                return false;
            }
        }
    }

    async isFildEditable(){
        return false
    }

    async getPermissions(fields:Array<FieldDescriptor>, id:uuid){

        const Ids= [id];

        const fildsId = fields.map(field => field.identifier);

        const url = await(this._buildPermissionsUrl(fildsId));

        const grants:Array<Grants> = await(this._postRequest(url, Ids));

        return new FieldsPermission(grants[0]);
    }
}

export class FieldsPermission{
    grant:Grants;
    isFieldEditable(fieldName:string):boolean{
        if(this.grant.fieldGrants && this.grant.fieldGrants.hasOwnProperty(fieldName)) {
            return typeof (
                    this.grant.fieldGrants[fieldName]
                        .find(i => i == 'FIELD_EDIT')
                ) == 'string';
        }  else {
            return false
        }
    }

    constructor(grant:Grants){
        this.grant = grant;
    }
}

function OzoneTypeAPIGenerator(){
    let ozoneTypeAPI;

    return (): OzoneTypeAPI => {
        if (!document.querySelector('#ozoneTypeAPI')) {
            ozoneTypeAPI = document.createElement('ozone-type-api');
            ozoneTypeAPI.id = 'ozoneTypeAPI';
            document.body.appendChild(ozoneTypeAPI);
        }
        return (document.querySelector('#ozoneTypeAPI')) as OzoneTypeAPI
    }
}

/**
 * return OzoneTypeAPI singleton
 * @type {()=>OzoneItemAPI}
 */
export const getOzoneTypeAPI = OzoneTypeAPIGenerator();
getOzoneTypeAPI();