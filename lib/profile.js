#!/usr/bin/env node

var fs = require('fs-sync');
var node_path = require('path');

var USER_HOME = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

// get user profile from
// 		~/.cortexrc.js  // require as an module
//		~/.cortexrc		// read as an JSON file	
var user_options = function() {
	var user_profile_file = path.join( USER_HOME, '.cortexrc' );
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
}();


var DEFAULT_OPTIONS = {
	cortex_root	: node_path.join(USER_HOME, '.cortex'),
	module_root	: node_path.join(USER_HOME, '.cortex', 'modules'),
	built_root	: node_path.join(USER_HOME, '.cortex', 'built_modules'),
	npm_registry: 'http://registry.npmjs.org'
};


var option_name;


for(option in DEFAULT_OPTIONS){
	Object.defineProperty(exports, option, {
		
	})
}








