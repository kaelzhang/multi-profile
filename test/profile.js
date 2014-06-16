'use strict';

var profile = require('../');
var expect = require('chai').expect;
var node_path = require('path');
var fixture = require('test-fixture')();
var assert = require('assert');

fixture.copy(function (err, dir) {
  var p = profile({
    path: dir,
    schema: {
      a: {
        value: 1,
        type: {
          validator: function(v) {
            return v > 10
          }
        }
      },
      b: {
        value: '2',
        type: {
          validator: function(v, key, attr) {
            attr.error('always fail')
          }
        }

      },

      c: {
        value: 3,
        type: {
          setter: function(v, key, attr) {
            attr.error('fail');

            // but return
            return v
          }
        }

      }
    }
  });

  p.init();

  var cases = [
    [
      p.all().sort(),
      ['default', 'a'].sort(),
      'all profiles'
    ],
    [
      p.current(),
      'a',
      'current profile a'
    ],
    [
      (p.add('b'), p.switchTo('b'), p.current()),
      'b',
      'add, switchTo, current profile b'
    ],
    [
      p.all().sort(),
      ['default', 'a', 'b'].sort(),
      'all profiles after adding b'
    ],
    [
      p.getPath(),
      dir,
      'getPath()'
    ]
  ];

  cases.forEach(function (c) {
    assert.deepEqual(c[0], c[1], c[2]);
  });
});
