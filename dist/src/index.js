/// <amd-module name="polymer-redux-typescript"/>
/**
 * A TypeScript class decorator that defines a custom element with name
 * `tagname` and the decorated class.
 */
import "reflect-metadata";
import "../type/element";
import "../type/shadow";
import "../type/missing";
export function element(tagname) {
    return (clazz) => {
        clazz.is = tagname;
        window[clazz.name] = clazz; // Register class in windows se that is can be use without IMD module loading.
        // Useful for import in pure JS project.
        window.customElements.define(tagname, clazz);
    };
}
/**
 * A TypeScript class decorator that declare a global class
 * `tagname` and the decorated class.
 */
export function jsElement() {
    return (clazz) => {
        window[clazz.name] = clazz; // Register class in windows se that is can be use without IMD module loading.
        // Useful for import in pure JS project.
    };
}
function createProperty(proto, name, options) {
    const notify = (options && options.notify) || false;
    const reflectToAttribute = (options && options.reflectToAttribute) || false;
    const readOnly = (options && options.readOnly) || false;
    const computed = (options && options.computed) || "";
    const observer = (options && options.observer) || "";
    const statePath = (options && options.statePath) || null;
    let type;
    if (options && options.hasOwnProperty("type")) {
        type = options.type;
    }
    else if (window.Reflect &&
        Reflect.hasMetadata &&
        Reflect.getMetadata &&
        Reflect.hasMetadata("design:type", proto, name)) {
        type = Reflect.getMetadata("design:type", proto, name);
    }
    else {
        console.error(`A type could not be found for ${name}. ` + "Set a type or configure Metadata Reflection API support.");
    }
    if (!proto.constructor.hasOwnProperty("properties")) {
        Object.defineProperty(proto.constructor, "properties", { value: {} });
    }
    const finalOpts = statePath ? { type, notify, reflectToAttribute, computed, observer, statePath, readOnly: true }
        : { type, notify, reflectToAttribute, readOnly, computed, observer };
    proto.constructor.properties[name] = finalOpts;
}
/**
 * A TypeScript property decorator factory that defines this as a Polymer
 * property.
 *
 * This function must be invoked to return a decorator.
 */
export function property(options) {
    return (proto, propName) => {
        createProperty(proto, propName, options);
    };
}
export function domElement() {
    return (proto, propName) => { };
}
/**
 * A TypeScript property decorator factory that causes the decorated method to
 * be called when a property changes. `targets` is either a single property
 * name, or a list of property names.
 *
 * This function must be invoked to return a decorator.
 */
export function observe(...targets) {
    return (proto, propName) => {
        if (!proto.constructor.hasOwnProperty("observers")) {
            proto.constructor.observers = [];
        }
        proto.constructor.observers.push(`${propName}(${targets.join(",")})`);
    };
}
function _ensureConfig(proto) {
    const ctor = proto.constructor;
    if (ctor.hasOwnProperty("__polymer_ts_config")) {
        return ctor.__polymer_ts_config;
    }
    Object.defineProperty(ctor, "config", {
        get() {
            return ctor.__polymer_ts_config;
        }
    });
    const config = (ctor.__polymer_ts_config = ctor.__polymer_ts_config || {});
    config.properties = config.properties || {};
    config.observers = config.observers || [];
    return config;
}
