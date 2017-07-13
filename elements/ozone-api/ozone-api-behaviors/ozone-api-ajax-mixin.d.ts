/**
 * Created by hubert on 8/06/17.
 */

/**
 * Extended OzoneApiMixin for ajax kind of query.
 *
 */
declare function OzoneApiAjaxMixin(element: any):OzoneApiAjaxMixinConstructor


declare interface OzoneApiAjaxMixinConstructor {
    new(): OzoneApiAjaxMixinType;
}

/**
 *
 * ### Events
 *
 * * *ozone-request-success* Fired when connection to ozone succeeds.
 *
 * * *ozone-request-error* Fired when connection to ozone fails.
 * Event detail contains status and statusText.
 *
 */
declare class OzoneApiAjaxMixinType extends PolymerElement{

    /**
     * Ozone Config property
     */
    readonly config: ConfigType;

    /**
     * Service URL to be used by each ozone-api instance.
     * Its value is automatically set by computeServiceUrl method.
     */
    readonly serviceUrl: string;

    /**
     * Compute url of each service.
     * This method is foreseen to be called in the observers
     * Example:
     *       `observers: ['computeServiceUrl(config.endPoints.login)'],`
     * @param ozoneEndPoint (String) Api end point as define in the config file.
     */
    computeServiceUrl(ozoneEndPoint: string): void;

}