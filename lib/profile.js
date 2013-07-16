#!/usr/bin/env node

var fs = require('fs-sync');
var node_path = require('path');

var USER_HOME = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

// get user profile from
//      ~/.cortexrc.js  // require as an module
//      ~/.cortexrc     // read as an JSON file    
function user_options() {
    var user_profile_file = node_path.join( USER_HOME, '.cortexrc' );
    var user_profile_file_js = user_profile_file + '.js';

    if( fs.exists( user_profile_file_js ) ){
        try {
            return require( user_profile_file_js );
        } catch(e) {
            process.stdout.write('Failed to load "' + user_profile_file_js + '"\n');
            throw e;
            // process.exit(1);
        }
    }

    if( fs.exists( user_profile_file ) ){
        try {
            return fs.readJSON( user_profile_file );
        } catch(e) {
            process.stdout.write('Failed to load "' + user_profile_file + '"\n');
            throw e;
        }
    }

    return {};
};


var cortex_root = node_path.join(USER_HOME, '.cortex');
var DEFAULT_OPTIONS = {
    cortex_root     : cortex_root,
    module_root     : node_path.join(cortex_root, 'modules'),
    built_root      : node_path.join(cortex_root, 'built_modules'),
    built_temp      : node_path.join('.cortex', 'built'),
    temp_root       : node_path.join(cortex_root, 'tmp'),
    registry        : 'http://registry.npmjs.org',
    registry_port   : 80,
    server_path     : 'mod',
    language        : 'en'
};

var options = exports.OPTIONS = user_options();
var option;

for(option in DEFAULT_OPTIONS){
    if( !( option in options ) ){
        options[option] = DEFAULT_OPTIONS[option];
    }
}

exports.option = function(key) {
    return options[key];
};

// TODO
// dir checking









