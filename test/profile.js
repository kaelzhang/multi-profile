'use strict';

var profile = require('../');
var expect = require('chai').expect;

var node_path = require('path');

var cwd = node_path.resolve('test/fixtures');

var p = profile({
    path: cwd,
    schema: {
        a: {
            value: 1,
            type: {
                validator: function (v) {
                    return v > 10
                }
            }
        },
        b: {
            value: '2',
            type: {
                validator: function (v, key, attr) {
                    attr.error('always fail')
                }
            }
            
        },

        c: {
            value: 3,
            type: {
                setter: function (v, key, attr) {
                    attr.error('fail');

                    // but return
                    return v
                }
            }

        }
    }
}).init();

console.log('all profiles:', p.all(), 'current profile:', p.current());

console.log('switch to a')
p.add('a');
p.switchTo('a');

console.log('all profiles:', p.all(), 'current profile:', p.current());

console.log('save');
p.save();

console.log(p.profile.__attrs);


console.log(p.set({
    a: 8,
    b: 1,
    c: 4
}))