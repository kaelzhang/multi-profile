'use strict';

module.exports = profile;
profile.Profile = Profile;


var event_emitter   = require('events').EventEmitter; 
var node_util       = require('util');
var node_path       = require('path');
var fs              = require('fs-sync');
// var ini             = require('ini');

var Attr            = require('./lib/attributes');


function profile(options) {
    return new Profile(options);
}


var TYPES = {
    FOLDER: {
        setup: function (value) {
            if(!fs.isDir(value)){
                fs.mkdir(value);
            }
        }
    },

    FILE: {
        setup: function (value) {
            if(!fs.isFile(value)){
                fs.write(value, '');
            }
        }
    }
};


profile.TYPES = TYPES;

Object.freeze(profile.TYPES);
Object.preventExtensions(profile.TYPES);


// Constructor of Profile has no fault-tolerance, make sure you pass the right parameters
// @param {Object} options
// - path: {node_path} path to save the profiles
function Profile(options) {
    this.path = this._formatPath(options.path);
    this.profile = new Attr(options.schema);

    this._prepare();
}

node_util.inherits(Profile, event_emitter);


function mix (receiver, supplier, override){
    var key;

    if(arguments.length === 2){
        override = true;
    }

    for(key in supplier){
        if(override || !(key in receiver)){
            receiver[key] = supplier[key]
        }
    }

    return receiver;
}

mix(Profile.prototype, {

    // get all profile names
    // @return {Array.<string>}
    getAll: function() {
        return this.attr.get('profiles');
    },

    // get the current profile name
    // @return {string|null}
    getCurrent: function() {
        return this.attr.get('current');
    },

    // 
    switchTo: function(name, callback) {
        this.emit('switch', {
            // former: 
            // current: 
        });
    },

    // @return {boolean}
    add: function(name, callback) {
        this.emit('add', {
            // name:
        });
    },

    // apply the current schema preferences, if it's an empty profile
    _applySchema: function () {
        
    },

    // @param 
    option: function(key, value) {
        switch(arguments.length){
            case 0:
                return this._getAllOption();
                break;

            case 1:
                return this._getOption(key);
                break;

            case 2:
                this._setOption(key, value);
                break;
        }
    },

    addOption: function () {
        
    },

    _getAllOption: function () {
        
    },

    _getOption: function(key) {
        
    },

    _setOption: function(key, value) {
        this.emit('optionChange', {
            // key: key,
            // value: 
            // formerValue:
        });
    },

    // @param {string} name profile name
    del: function(name, callback) {
        
        this.emit('delete', {
            name: name
        });
    },

    // prepare environment
    _prepare: function() {
        var self = this;

        this.attr = new Attr({
            path: {
                value: this.path,
                type: {
                    readOnly: true,
                    setup: function (value) {
                        if(!fs.isDir(value)){
                            fs.mkdir(value);
                        }

                        var profiles = self.path_profiles = node_path.join(value, 'profiles');
                        var current = self.path_current = node_path.join(value, 'current_profile');

                        if(!fs.isFile(profiles)){
                            fs.write(profiles, '');
                        }

                        if(!fs.isFile(current)){
                            fs.write(current, '');
                        }


                    }
                }
            },

            profiles: {
                type: {
                    getter: function () {
                        return fs.read(self.path_profiles).split(/[\r\n]+/).filter(Boolean);
                    },

                    setter: function () {
                        
                    }
                }
            },

            current: {
                type: {
                    getter: function () {
                        return fs.read(self.path_current).trim();
                    },

                    setter: function (v) {
                        fs.write(self.path_current, v);
                    }
                }
            }
        });
    },

    // normalize path, convert '~' to the absolute pathname of the current user
    _formatPath: function(path) {
        if( path.indexOf('~') === 0){
            var USER_HOME = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

            path = path.replace( /^~/, USER_HOME );
        }

        return path;
    }
});
