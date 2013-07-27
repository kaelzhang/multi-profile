'use strict';

module.exports = profile;
profile.Profile = Profile;


var event_emitter   = require('events').EventEmitter; 
var node_util       = require('util');
var node_path       = require('path');
var fs              = require('fs-sync');


function profile(options) {
    return new Profile(options);
}


// Constructor of Profile has no fault-tolerance, make sure you pass the right parameters
// @param {Object} options
// - path: {node_path} path to save the profiles
function Profile(options) {
    this.path = this._formatPath(options.path);

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
        
    },

    // get the current profile name
    // @return {string|null}
    getCurrent: function() {
        
    },

    // 
    switchTo: function(name, callback) {
        this.emit('switch', {
            former: 
            current: 
        });
    },

    // @return {boolean}
    add: function(name, callback) {
        this.emit('add', {
            name:
        });
    },

    // @param 
    option: function(key, value) {
        this.emit('optionChange', {
            key: key,
            value: 
            formerValue:
        });  
    },

    _getOption: function(key) {
        
    },

    _setOption: function(key, value) {
        
    },

    // @param {string} name profile name
    del: function(name, callback) {
        
        this.emit('delete', {
            name: name
        });
    },

    // prepare environment
    _prepare: function() {
        if(!fs.exists(this.path)){
            fs.mkdir(this.path);
        }
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
