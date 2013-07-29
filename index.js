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


var RESERVED_PROFILE_NAME = ['profiles', 'current_profile'];


// Constructor of Profile has no fault-tolerance, make sure you pass the right parameters
// @param {Object} options
// - path: {node_path} path to save the profiles
function Profile(options) {
    this.path = this._formatPath(options.path);
    this.schema = options.schema;

    this._prepare();
    this._prepareProfile();

    var current = options.current || this.getCurrent();
    current && this._initProfile(current);
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

    exists: function (name) {
        return !! ~ this.getAll().indexOf(name);
    },

    // 
    switchTo: function(name) {
        var current = this.getCurrent();
        var err = null;

        if(current === name){
            err = '"' + name + '" is already the current profile.';

        }else if( ! this.exists(name) ){
            err = 'Profile "' + name + '" not found.'
        
        }else{
            this.attr.set('current', name);

            this._initProfile(name);
        }

        this.emit('switch', {
            err: err
            former: current,
            current: err ? current : name
        });
    },

    // Add a new profile.
    // Adding a profile will not do nothing about initialization
    add: function(name) {
        var err = null;
        
        if( this.exists(name) ){
            err = 'Profile "' + name + '" already exists.'
        
        }else if( ~ RESERVED_PROFILE_NAME.indexOf(name) ){
            err = 'Profile name "' + name + '" is reserved by `multi-profile`';

        }else{
            profiles.push(name);
            this.attr.set('profiles', profiles);
        }

        this.emit('add', {
            err: err,
            name: name
        });
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

    addOption: function (key, attr) {
        return this.profile.add(key, attr);
    },

    _getAllOption: function () {
        return this.profile.get();
    },

    _getOption: function(key) {
        return this.profile.get(key);
    },

    _setOption: function(key, value) {
        var former = this.profile.get(key);

        var success = this.profile.set(key, value);

        this.emit('optionChange', {
            err: !success,
            key: key,
            value: value
            formerValue: former
        });
    },

    // @param {string} name profile name
    // @param {}
    del: function(name, remove_data) {
        var profiles = this.getAll();
        var current = this.getCurrent();
        var index = profiles.indexOf(name);
        var err = null;

        if(current === name){
            err = 'You could not delete current profile.';

        }else if(! ~ index){
            err = 'Profile "' + name + '" not found.';
        }else{
            profiles.splice(index, 1);
            this.attr.set('profile', profiles);

            if(remove_data){
                fs.delete( node_path.join(this.path, name) );
            }
        }

        this.emit('delete', {
            err: err,
            name: name
        });
    },

    // prepare environment
    _prepare: function() {
        this.attr = new Attr({
            path: {
                value: this.path,
                type: {
                    readOnly: true,
                    setup: function (value) {
                        if(!fs.isDir(value)){
                            fs.mkdir(value);
                        }

                        var profiles = this.path_profiles = node_path.join(value, 'profiles');
                        var current = this.path_current = node_path.join(value, 'current_profile');

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
                        return fs.read(this.path_profiles).split(/[\r\n]+/).filter(Boolean);
                    },

                    setter: function (profiles) {
                        fs.write(this.path_profiles, profiles.join('\n'));

                        return profiles;
                    }
                }
            },

            current: {
                type: {
                    getter: function () {
                        return fs.read(this.path_current).trim() || null;
                    },

                    setter: function (v) {
                        fs.write(this.path_current, v);

                        return v;
                    }
                }
            }

        }, {
            host: this
        });
    },

    _prepareProfile: function () {
        this.profile = new Attr(Object.create(options.schema), {
            host: this
        });
    },

    // read properties of current profile
    _initProfile: function (name) {
        
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
