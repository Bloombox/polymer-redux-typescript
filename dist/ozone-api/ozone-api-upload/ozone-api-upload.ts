/// <amd-module name="ozone-api-upload"/>

import {jsElement} from 'decorators'

export interface UploadSessionResult {
    file: FormData;
    sessionId: string;
}

export interface UploadIdResult extends UploadSessionResult {
    uploadId: string;
    folderId: string;
}

export interface UploadEndResult  extends UploadIdResult {
    uploadFileId: string;
}

export interface XMLHttpRequestLike {

    upload: {
        onprogress: { (event: Event): void }
        onloadstart: { (event: Event): void }
    };

    onreadystatechange: { (): void };

    readyState: number;

    status: number;

    open(method: string, url: string, async: boolean):void;

    send(formData: FormData): void;

    abort():void;

    setRequestHeader(key: string, value: string):void;
}

/**
 * UploadFileRequest is a JavaScrip class that can be use as an
 * XMLHttpRequest to upload file on ozone.
 * If mask the complex series of AJAX call to one XMLHttpRequest like request.
 * Note: that UploadFileRequest implement only a subset of XMLHttpRequest
 *
 * example:
 * ```javaScript
 *  const uploader = new UploadFileRequest();
 *  uploader.open();
 *  const formData = new FormData();
 *  formData.append(file.formDataName, file, file.name);
 *  uploader.send(formData);
 * ```
 *
 * ### Events
 * * *ozone-upload-completed*: *CustomEvent*
 *    Fired when upload is complete with detail: {mediaId: uuid}
*
*/
@jsElement()
export class UploadFileRequest implements XMLHttpRequestLike {

    /**
     * Minimalist XMLHttpRequest.upload interface.
     */
    upload: {
        onprogress: { (event: Event): void }
        onloadstart: { (event: Event): void }
    };

    /**
     * XMLHttpRequest.onreadystatechange event handler
     */
    onreadystatechange: { (): void };
    private callOneadystatechange() {
        if (typeof (this.onreadystatechange) == 'function') {
            this.onreadystatechange();
        }
    }

    /**
     * set the interval to verify ozone has finish the element processing
     * @type {number} poll interval in ms
     */
    pollInterval:number = 500;

    /**
     * XMLHttpRequest.readyState
     * @type {number}
     */
    readyState: number = 0;

    /**
     * XMLHttpRequest.status
     * @type {number}
     */
    status: number;


    protected configPromise: Promise<ConfigType>;
    protected config: ConfigType;

    private isAbort:boolean = false;
    private currentRequest: XMLHttpRequest ;

    constructor() {
        this.configPromise = getOzoneConfig().configPromise as Promise<ConfigType>;
        this.configPromise.then((config) => {
            this.config = config;
        });
        this.upload = {
            onprogress: () => {},
            onloadstart: () => {},
        };
    }

    /**
     * like an XMLHttpRequest.open()
     * Parameters passed are not used.
     * method and URL come from the config file.
     * Request will always be async.
     *
     * @param {string} method
     * @param {string} url
     * @param {boolean} async
     */
    open(method: string, url: string, async: boolean = true) {
        this.readyState = 1;
    }

    /**
     * like an XMLHttpRequest.send()
     * start async process to upload the file inside the form.
     * @param {FormData} formData
     * @return {Promise<void>}
     */
    async send(formData: FormData) {
        await (this.uploadFile(formData));
    }

    /**
     * like XMLHttpRequest.abort()
     * cancel current upload process
     */
    abort() {
        this.isAbort = true;
        if(this.currentRequest){
            this.currentRequest.abort();
        }
    }

    /**
     * unused.
     * @param {string} key
     * @param {string} value
     */
    setRequestHeader(key: string, value: string) {

    }

    protected _createRequest(){
        if(this.isAbort){
            throw new Error('request abort');
        }
        this.currentRequest = new XMLHttpRequest();
        this.currentRequest.withCredentials = true;
        this.currentRequest.responseType = 'json';
        return this.currentRequest;
    }

    private _buildUrl(service: string, ...param: Array<string>): string {
        const otherUrlParam = param || [];
        return [this.config.host, this.config.endPoints[service], ...otherUrlParam]
            .join('/')
            .replace(/\/\//g, '/');
    }

    /**
     * alias to send method.
     * @param {FormData} file
     * @param {string} folderId
     * @return {Promise<string | void>}
     */
    uploadFile(file: FormData, folderId: string = '0'): Promise<string | void> {
        return this.configPromise
            .then(() => {
                return this._startUploadSession(file, folderId)
            })
            .then((result) => this._getUploadId(result))
            .then((result) => this._performUpload(result))
            .then((result) => this._endUploadSession(result))
            .then((result) => this._waitForTask(result))
            .then((mediaId: string) => {
                console.log("upload session complete", mediaId);
                this.status = 200;
                this.readyState = 4;
                this.callOneadystatechange();

                document.dispatchEvent(
                    new CustomEvent('ozone-upload-completed',
                        {bubbles: true, detail: {mediaId}})
                );
                return mediaId;
            }).catch((error: Error)=>{
                this.status = 555;
                this.readyState = 4;
                this.callOneadystatechange();
                console.error(error.message)
        });
    }

    private notifyOnError(xhr: XMLHttpRequest): { (): void } {
        return () => {
            if (xhr.status === 0
                || xhr.status >= 500
                || xhr.status >= 400) {
                this.status = xhr.status;
                this.readyState = 4;
                this.callOneadystatechange();
            }
        };
    }

    _startUploadSession(file: FormData, folderId: string): Promise<UploadSessionResult> {
        const xhr = this. _createRequest();
        const url = this._buildUrl('uploadStart');
        xhr.open('POST', url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Accept", "application/json");

        xhr.onreadystatechange = this.notifyOnError(xhr);

        //TODO understand need of folderId??
        const numeric_id = parseInt('0x' + folderId.split('-')[4]);
        const body = {
            mediaUploadChannelIdentifier: 'uploadChannel1',
            autoCommit: false,
            mediaMetadatas: [{
                "type": {
                    "type": "PROPERTY",
                    "identifier": "org.taktik.metadata.folderId"
                },
                "valueObject": numeric_id.toString()
            }]
        };
        const result = new Promise((resolve, reject) => {
            xhr.addEventListener("load", resolve);
            xhr.addEventListener("error", reject);
        });
        xhr.send(JSON.stringify(body));
        return result
            .then(() => {
                const response = xhr.response;
                return {
                    file: file,
                    sessionId: response.result as string
                }
            });
    }

    _getUploadId(data: UploadSessionResult): Promise<UploadIdResult> {
        const xhr = this. _createRequest();
        const url = this._buildUrl('uploadId', data.sessionId);
        xhr.open('GET', url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Accept", "application/json");

        xhr.onreadystatechange = this.notifyOnError(xhr);

        const result = new Promise((resolve, reject) => {
            xhr.addEventListener("load", resolve);
            xhr.addEventListener("error", reject);
        })
            .then(() => {
                const response = xhr.response;
                const resultInfo:UploadIdResult = data  as UploadIdResult;
                resultInfo.uploadId = response.result;
                resultInfo.folderId = response.folderId;
                return resultInfo;
            });
        xhr.send(null);
        return result;
    }

    _performUpload(data: UploadIdResult): Promise<UploadIdResult> {
        const xhr = this. _createRequest();
        const url = this._buildUrl('upload', data.uploadId);
        xhr.open('POST', url, true);

        xhr.onreadystatechange = this.notifyOnError(xhr);

        xhr.upload.onprogress = this.upload.onprogress;

        const result = new Promise((resolve, reject) => {
            xhr.addEventListener("load", resolve);
            xhr.addEventListener("error", reject);
        });

        xhr.send(data.file);
        return result.then(() => {
            return data;
        });
    }

    _endUploadSession(data: UploadIdResult): Promise<UploadEndResult> {
        const xhr = this. _createRequest();
        const url = this._buildUrl('uploadComplete', data.sessionId);
        xhr.open('POST', url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Accept", "application/json");

        xhr.onreadystatechange = this.notifyOnError(xhr);


        const result = new Promise((resolve, reject) => {
            xhr.addEventListener("load", resolve);
            xhr.addEventListener("error", reject);
        })
            .then(() => {
                const response:UploadEndResult = data as UploadEndResult;
                response.uploadFileId = xhr.response.file;
                return response;
            });

        const info = {
            'selectedFileFieldNames': [['files']],
            mediaMetadatas: [
                { type: { type: 'PROPERTY', identifier: 'org.taktik.metadata.folderId' }, valueObject: data.folderId }
            ]
        };
        xhr.send(JSON.stringify(info));
        return result;
    }

    _waitForTask(uploadEndResult: UploadEndResult): Promise<string> {
        return new Promise((resolve, reject) => {
            let interval = setInterval(() => {
                this._awaitTask(uploadEndResult.uploadFileId)
                    .then((data) => {
                        if (data.taskExecutions[uploadEndResult.uploadFileId].isComplete) {
                            clearInterval(interval);
                            const mediaId: string =  data
                                .taskExecutions[uploadEndResult.uploadFileId].taskResult.mediaId;
                            resolve(mediaId);
                        }
                    })
                    .catch((error) => {
                        clearInterval(interval);
                        reject(error);
                    })
            }, this.pollInterval);
        });
    }

    _awaitTask(uploadFileId: string): Promise<any> {
        const xhr = this. _createRequest();
        const url = this._buildUrl('wait', uploadFileId, '120');
        xhr.open('GET', url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Accept", "application/json");

        xhr.onreadystatechange = this.notifyOnError(xhr);

        const result = new Promise((resolve, reject) => {
            xhr.addEventListener("load", resolve);
            xhr.addEventListener("error", reject);
        })
            .then(() => {
                return xhr.response;
            });
        xhr.send(null);
        return result;
    }
}