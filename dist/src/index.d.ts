/**
 * A TypeScript class decorator that defines a custom element with name
 * `tagname` and the decorated class.
 */
import "reflect-metadata";
import "../type/element";
import "../type/shadow";
import "../type/missing";
export declare function element(tagname: string): (clazz: any) => void;
/**
 * A TypeScript class decorator that declare a global class
 * `tagname` and the decorated class.
 */
export declare function jsElement(): (clazz: any) => void;
export interface PropertyOptions {
    /**
     * This field can be omitted if the Metadata Reflection API is configured.
     */
    type?: BooleanConstructor | DateConstructor | NumberConstructor | StringConstructor | ArrayConstructor | ObjectConstructor;
    notify?: boolean;
    reflectToAttribute?: boolean;
    readOnly?: boolean;
    computed?: string;
    statePath?: string;
    observer?: string | ((val: any, old: any) => void);
}
/**
 * A TypeScript property decorator factory that defines this as a Polymer
 * property.
 *
 * This function must be invoked to return a decorator.
 */
export declare function property(options?: PropertyOptions): (proto: any, propName: string) => any;
export declare function domElement<T>(): (proto: any, propName: string) => any;
/**
 * A TypeScript property decorator factory that causes the decorated method to
 * be called when a property changes. `targets` is either a single property
 * name, or a list of property names.
 *
 * This function must be invoked to return a decorator.
 */
export declare function observe(...targets: string[]): (proto: any, propName: string) => any;
