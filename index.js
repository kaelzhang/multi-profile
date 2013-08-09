'use strict';

module.exports = profile;
profile.Profile = Profile;


var event_emitter   = require('events').EventEmitter; 
var node_util       = require('util');
var node_path       = require('path');
var fs              = require('fs-sync');
var code            = require('code-this');

var Attr            = require('./lib/attributes');


function profile(options) {
    return new Profile(options);
}

var DEFAULT_PROFILE = 'default';
var RESERVED_PROFILE_NAME = ['profiles', 'current_profile', DEFAULT_PROFILE];

// normalize path, convert '~' to the absolute pathname of the current user
profile.resolveHomePath = function(path) {
    if( path.indexOf('~') === 0){
        var USER_HOME = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

        path = path.replace( /^~/, USER_HOME );
    }

    return path;
};

// Force to touching a file, if the file is not exists
// If there's already a dir named `path`, the former dir will be copied as a backup before being deleted
profile.touchFile = function (path) {
    if(!fs.isFile(path)){
        if(fs.isDir(path)){
            fs.copy(path, path + '-bak-' + Date.now(), {
                force: true
            });

            fs.remove(path);
        }

        // create empty file
        fs.write(path, '');
    }
};


// Constructor of Profile has no fault-tolerance, make sure you pass the right parameters
// @param {Object} options
// - path: {node_path} path to save the profiles
function Profile(options) {
    this.path = node_path.resolve( profile.resolveHomePath(options.path) );
    this.schema = options.schema;
    this.context = options.context || null;

    this._prepare();
    this._prepareProfile(options.profile);
}

node_util.inherits(Profile, event_emitter);

mix(Profile.prototype, {

    // get all profile names
    // @return {Array.<string>}
    all: function() {
        return this.attr.get('profiles');
    },

    // get the current profile name
    // @return {string|null}
    current: function() {
        return this.attr.get('current');
    },

    currentDir: function () {
        return this.profile_dir || null;  
    },

    exists: function (name) {
        return !! ~ this.all().indexOf(name);
    },

    // 
    switchTo: function(name) {
        var current = this.current();
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
            err: err,
            former: current,
            current: err ? current : name
        });
    },

    // Add a new profile.
    // Adding a profile will not do nothing about initialization
    add: function(name) {
        var err = null;
        var profiles = this.all();
        
        if( ~ profiles.indexOf(name) ){
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
        var data;

        switch(arguments.length){
            case 0:
                return this._getAllOption();
                break;

            case 1:
                if(Object(key) === key){
                    data = key;
                    return this._setOption(data);

                }else if(typeof key === 'string'){
                    return this._getOption(key);
                }
                
                break;

            case 2:
                data = {};
                data[key] = value;
                this._setOption(data);
                break;
        }
    },

    // not allow to add options
    // addOption: function (key, attr) {
    //     return this.profile.add(key, attr);
    // },

    _getAllOption: function () {
        return this.profile.get();
    },

    _getOption: function(key) {
        return this.profile.get(key);
    },

    _setOption: function(data) {
        return this.profile.set(data);
    },

    // @param {string} name profile name
    // @param {}
    del: function(name, remove_data) {
        var profiles = this.all();
        var current = this.current();
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
                fs.remove( node_path.join(this.path, name) );
            }
        }

        this.emit('delete', {
            err: err,
            name: name
        });
    },

    // save the current configurations
    save: function () {
        fs.write(this.profile_file, 'module.exports = ' + code(this.profile.getWritable(), null, 4) + ';' );
    },

    // prepare environment
    _prepare: function() {

        // the attributes for multi-profile itself
        this.attr = new Attr({
            path: {
                value: this.path,
                type: {
                    readOnly: true,
                    setup: function (value) {
                        if(!fs.isDir(value)){
                            fs.mkdir(value);
                        }

                        var profiles = this.profiles_file = node_path.join(value, 'profiles');
                        var current = this.current_file = node_path.join(value, 'current_profile');

                        profile.touchFile(profiles);
                        profile.touchFile(current);
                    }
                }
            },

            // get or set the names of profiles
            profiles: {
                type: {
                    getter: function () {
                        return fs.read(this.profiles_file).split(/[\r\n]+/).filter(Boolean);
                    },

                    setter: function (profiles) {
                        fs.write(this.profiles_file, profiles.join('\n'));

                        return profiles;
                    }
                }
            },

            // get or set the name of the current profile
            current: {
                type: {
                    getter: function () {
                        return fs.read(this.current_file).trim() || null;
                    },

                    setter: function (v) {
                        fs.write(this.current_file, v);

                        return v;
                    }
                }
            }

        }, {
            host: this
        });
    },


    // Initialize the current profile,
    // and create necessary files and dirs if not exists.
    // Initialize properties of current profile
    _initProfile: function (name) {
        this.profile = new Attr(Object.create(this.schema), {
            context: this.context
        });

        var profile_dir = this.profile_dir = node_path.join(this.path, name);

        if( !fs.isDir(profile_dir) ){
            fs.mkdir(profile_dir);
        }

        var profile_file = this.profile_file = node_path.join(profile_dir, 'config.js');

        if( !fs.isFile(profile_file) ){
            fs.write(profile_file, 'module.exports = {};');
        
        }else{
            this.profile.set( require(profile_file) );
        }
    },

    // Prepare profile
    _prepareProfile: function (name) {
        var current = name || this.current();

        // Make sure there is always a 'default' profile
        if( ! ~ this.all().indexOf(DEFAULT_PROFILE) ){
            this.add(DEFAULT_PROFILE);
        }

        if(current){
            this._initProfile(current);
        }else{

            // Use 'default' profile by default
            this.switchTo(DEFAULT_PROFILE);
        }
    },

    // Reload properties
    reload: function () {
        this.profile.set( require(this.profile_file) );
    }
});


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