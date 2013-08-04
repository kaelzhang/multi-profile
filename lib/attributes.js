'use strict';

module.exports = Attributes;

var node_path = require('path');
var node_url = require('url');


// @param {Object} attrs list of attr(see `this.add`)
// @param {Object} options
// - host: {Object} host object
function Attributes(attrs, options) {
    options = options || {};
    this.host = options.host || this;
    this.__attrs = {};
    this.origin_attrs = attrs;
    this.origin_values = get_values(attrs);
    this.attr_list = [];

    var key;

    for(key in attrs){
        this.add(key, attrs[key]);
    }
};


function get_values(attrs) {
    var ret = {};
    var key;
    var attr;

    for(key in attrs){
        attr = attrs[key];
        if('value' in attr){
            ret[key] = attr.value;
        }
    }

    return;
}


var TYPES = {
    path: {
        validator: function (v) {
            return v || v === '';
        },

        setter: function (v) {
            return path.resolve( String(v) );
        }
    },

    url: {
        validator: function (v) {
            return !!node_url.parse(v).host;
        }
    }
};


[Number, String, Boolean].forEach(function (constructor) {
    var name = constructor.name.toLowerCase();

    TYPES[name] = {
        setter: function (v) {
            return constructor(v);
        }
    }
});


// Object.defineProperties(Attributes, 'TYPES', {
//     value: TYPES
// });

Attributes.TYPES = TYPES;

// TODO
// [Array, Function, ].


Attributes.prototype = {
    _get: function (key) {
        var attr = this.__attrs[key];

        if(!attr){
            return;
        }

        var getter = attr.type.getter;
        var value = attr.value;
    
        return getter ?
        
              // getter could based on the value of the current value
            getter.call(this.host, value, key, this) :
            value;
    },

    get: function (key) {
        if(arguments.length === 0){
            var ret = {};
            var self = this;

            this.attr_list.forEach(function (key) {
                ret[key] = self._get(key);
            });

            return ret;

        }else{
            return this._get(key);
        }
    },

    // Reset to default value.
    // Run this method will execute setup methods
    reset: function () {
        var key;
        // values = values || this.origin_values;
        var values = this.origin_values;

        for( key in values ){
            this._reset(key, values[key], true);
        }
    },

    _reset: function (key, value, attr) {
        attr = attr || this.__attrs[key];
        value = value || attr.value;

        attr.value = value;

        var setup = attr.type.setup;

        if(setup){
            setup.call(this.host, value, key, this);
        }
    },

    // @param {boolean=} ghost, ghost set, skip validation
    _set: function (key, value, ghost) {
        var attr = this.__attrs[key];
        var status = {
            err: true
        };

        if(ghost){
            attr.value = value;
            return;
        }

        if(!attr){
            return status;
        }

        if(attr.readOnly){
            return status;
        }

        // reset error status
        this.error(null);
        delete status.err;

        var validator = attr.type.validator;

        if(!validator || validator.call(this.host, value, key, this)){

            // validator returns true, but there might be error messages
            if( !(status.err = this._get_err()) ){
                var setter = attr.type.setter;
                if(setter){
                    value = setter.call(this.host, value, key, this);
                }

                status.err = this._get_err();
            }

        }else{
            // validation fail
            status.err = this._get_err() || true;
        }

        if(!status.err){
            attr.value = value;
        }

        return status;
    },

    set: function (key, value) {
        if(Object(key) === key){
            var list = key;
            var err;
            var errors = {};
            var result;

            for(key in list){
                value = list[key];
                var result = this._set(key, value);

                if(result.err){
                    err = true;
                    errors[key] = result.err;
                }
            }

            if(err){
                return {
                    err: true,
                    errors: errors
                }
            }else{
                return {};
            }

        }else if(typeof key === 'string'){
            var data = {};
            data[key] = value;

            return this.set(data);

        }else{
            return {
                err: true
            }
        }
    },

    // @param {Object} attr
    // - value: {mixed} default value
    // - type:
    add: function (key, attr) {
        if(key in this.__attrs){ 
            return;
        }

        attr = attr || {};

        var type = attr.type || {};

        if(typeof type === 'string'){
            type = Attributes.TYPES[type];
        }

        if(Object(type) !== type){
            return;
        }

        this.attr_list.push(key);
        attr.type = type;

        this.__attrs[key] = attr;
        this._reset(key, null, attr);

        return true;
    },

    error: function (info) {
        this._err = info;
    },

    _get_err: function () {
        return this._err;  
    }
};


// Object.seal(Attributes);
Object.seal(Attributes.TYPES);
Object.preventExtensions(Attributes.TYPES);