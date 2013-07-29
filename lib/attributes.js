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

    var key;

    for(key in attrs){
        this.add(key, attrs[key]);
    }
};

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

Object.seal(Attributes);
Object.seal(Attributes.TYPES);
Object.preventExtensions(Attributes.TYPES);


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

    _set: function (key, value) {
        var attr = this.__attrs[key];

        if(!attr){
            return;
        }

        if(attr.readOnly){
            return;
        }

        var validator = attr.type.validator;

        if(!validator.call(this.host, value, key, this)){
            return;
        }

        var setter = attr.type.setter;

        if(setter){
            attr.value = setter.call(this.host, value, key, this);

        }else{
            attr.value = value;
        }
    },

    set: function (key, value) {
        if(Object(key) === key){
            var list = key;

            for(key in list){
                value = list[key];

                this._set(key, value);
            }
        }else{
            this._set(key, value);
        }
    },

    // @param {Object} attr
    // - value: {mixed} default value
    // - type:
    //  
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

        attr.type = type;

        var setup = type.setup;

        if(setup){
            setup.call(this.host, attr.value, key, this);
        }

        this.__attrs[key] = attr;

        return true;
    }
};