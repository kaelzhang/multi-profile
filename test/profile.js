'use strict';

var profile = require('multi-profile');

var p = profile({
    path: '~/.cortex2',
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
});

console.log('all profiles:', p.all(), 'current profile:', p.current());

console.log('switch to a')
p.add('a');
p.switchTo('a');

console.log('all profiles:', p.all(), 'current profile:', p.current());

console.log('save');
p.save();

console.log(p.profile.__attrs);


console.log(p.option({
    a: 8,
    b: 1,
    c: 4
}))