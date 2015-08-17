/**
 * ts.Configurator
 * settings manager that uses local storage by default, but can be overridden to use any storage provider.
 * Configurations are stored by key as stringified JSON (meta includes type, mutability, etc)
 */

 ;(function () {
    'use strict';

    let storage = {};

    let getValue = function (key) {
        if (key === undefined) {
            return key;
        }
        key = key.toLowerCase();

        let valueObjStr = storage[key] || '{}';
        let valueObj = JSON.parse(valueObjStr);
        let metaObj = valueObj.meta || {'default':''};

        //load value
        let value = valueObj.value;

        //otherwise use default (if present)
        if (value === undefined && metaObj.default) {
            value = metaObj.default;
        }

        return value;
    };

    let getMetaValue = function (key, metaKey) {
        if (key === undefined) {
            return key;
        }
        key = key.toLowerCase();

        let valueObjStr = storage[key] || '{}';
        let valueObj = JSON.parse(valueObjStr);

        return valueObj.meta ? valueObj.meta[metaKey] : '';
    };

    let setValue = function (key, value, meta) {
        if (key === undefined || value === undefined) {
            return;
        }
        key = key.toLowerCase();
        value = typeof value === 'boolean' || typeof value === 'number' ? value : value.toString();

        //return if read-only
        let mutable = getMetaValue(key, 'mutable');
        if (mutable !== undefined && mutable === false) {
            return;
        }

        //load value object or create new empty value object
        let emptyStorageObj = {'value':value, 'meta':{'mutable':true, 'type':typeof value, 'default':''}};
        let valueObj = storage[key] !== undefined ? JSON.parse(storage[key]) : emptyStorageObj;

        //update value
        valueObj.value = value;

        //update meta
        if (typeof meta === 'object') {
            for (let x in meta) {
                if (meta.hasOwnProperty(x)) {
                    valueObj.meta[x] = meta[x];
                }
            }
        }

        //update value in storage
        storage[key] = JSON.stringify(valueObj);
    };

    let unsetValue = function (key) {
        if (key === undefined) {
            return;
        }
        key = key.toLowerCase();

        //return if read-only
        let mutable = getMetaValue(key, 'mutable');
        if (mutable === false) {
            return;
        }

        //remove value from storage
        if (typeof storage.removeItem === 'function') {
            storage.removeItem(key);
        } else {
            storage[key] = undefined;
        }
    };

    let setReadOnlyValue = function (key, value) {
        setValue(key, value, {'mutable':false});
    };

    let setDefaultValue = function (key, value) {
        setValue(key, value, {'default':value});
    };

    let getKeys = function () {
        return Object.keys(storage);
    };

    let configurator = {
        setStorage: function (storeObject) {
            storage = storeObject;
        },
        getValue: function (key) {
            let value = getValue(key);
            if (value === undefined) {
                return '';
            }

            return value;
        },
        setValue: function (key, value, meta) {
            setValue(key, value, meta);
        },
        loadConfig: function (config) {
            if (storage === undefined) {
                throw 'Storage is undefined. Please call setStorage with a valid storage object';
            }

            for (let i = 0; i < config.length; i++) {
                if (config[i].value !== undefined) {
                    if (config[i].meta.mutable) {
                        setDefaultValue(config[i].name, config[i].value);
                    } else {
                        setReadOnlyValue(config[i].name, config[i].value);
                    }
                }
            }
        },
        unsetValue: function (key, value) {
            unsetValue(key, value);
        },
        purgeValues: function () {
            let keys = getKeys();
            for (let i = 0; i < keys.length; i++) {
                unsetValue(keys[i]);
            }
        }
    };

    exports.setStorage = configurator.setStorage;
    exports.getValue = configurator.getValue;
    exports.setValue = configurator.setValue;
    exports.unsetValue = configurator.unsetValue;
    exports.loadConfig = configurator.loadConfig;
    exports.purgeValues = configurator.purgeValues;
})();
