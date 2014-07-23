# multi-profile [![NPM version](https://badge.fury.io/js/multi-profile.png)](http://badge.fury.io/js/multi-profile) [![Build Status](https://travis-ci.org/kaelzhang/node-multi-profile.png?branch=master)](https://travis-ci.org/kaelzhang/node-multi-profile) [![Dependency Status](https://gemnasium.com/kaelzhang/node-multi-profile.png)](https://gemnasium.com/kaelzhang/node-multi-profile)

Multi-profile is a module to manage global configurations for multiple profiles.

## Installation

```sh
npm install multi-profile --save
```

## Usage

```js

```

## profile

## Instance Methods

### .add(name)

Add a profile

### .all()

Get all profile names

### .current()

Get the name of the current profile

### .switchTo(name)

Switch to a profile

### .del(name)

Delete a profile by name

### .set(key, value)

Set a configuration. If key is not in the `schema`, nothing will be done.

### .set(key_value_map)

Set a bunch of configurations

### .get()

Get all configurations of the curent profile

### .get(key)

Get the configuration of the current profile by key

### .getConfigFile()

Returns `path` the path of the configuration file.

### .save(data)

Save `data` to the configuration.

If `data` is not specified, all writable key-values will be saved.

## Static Methods

### profile.resolveHomePath(path)

Resolve `'~/'` to the absolute home path of the curernt user.



