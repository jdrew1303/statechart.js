var vfile = require('vfile');
var reporter = require('vfile-reporter');
var createInterpreter = require('../');
var engine = require('@statechart/compiler-engine');
var Document = require('@statechart/interpreter-document');

function compile(str) {
  var file = vfile(str);
  var node = engine.parse(file);
  var res = engine.runSync(node, file);
  if (file.messages.length) {
    const msg = reporter([file]);
    if (file.messages.some(msg => msg.fatal)) throw new Error(msg);
    console.warn(msg);
  }
  return res;
}

var ecmascript = {
  load: function(node) {
    if (node.type === 'literal') return JSON.stringify(node.value);
    return node.value;
  },
  init: function(api, ioprocessors) {
    return {
      exec: function(ast) {
        return eval(ast);
      },
      push: function() {
        return ecmascript;
      },
      event: function() {
        return this;
      },
      flush: function() {
        return Promise.resolve();
      },
    };
  },
};

function testTransition(str, expected, events) {
  return function() {
    var doc = new Document(compile(str), {
      ecmascript: ecmascript
    });

    var interpreter = createInterpreter(doc, {

    }, {

    });

    return interpreter
      .start()
      .then(function() {
        expect(interpreter.getConfiguration()).toEqual(expected);
        return loop(interpreter, events || []);
      });
  };
}

function loop(interpreter, events) {
  var pair = events.shift();
  if (!pair) return true;
  var event = pair[0];
  var configuration = pair[1];

  return interpreter
    .send(event)
    .then(function() {
      expect(interpreter.getConfiguration()).toEqual(configuration);
      return loop(interpreter, events);
    });
}

describe('interpreter-macrostep', function() {
  describe('handleEvent', function() {
    it('should pick the correct states', testTransition(`
      <scxml version="1.0" datamodel="ecmascript">
        <state id="s1">
          <transition event="foo" target="s2" />
        </state>

        <state id="s2" />
      </scxml>
    `,
      [ 's1' ], [
        [{ name: 'foo' }, [ 's2' ]]
      ]
    ));

    it('should pick nested states', testTransition(`
      <scxml version="1.0" datamodel="ecmascript">
        <state id="s1">
          <state id="s1-1">
            <transition event="bar" target="s2" />
          </state>
        </state>

        <state id="s2">
          <state id="s2-1" />
        </state>
      </scxml>
    `,
      [ 's1', 's1-1' ], [
        [{ name: 'bar' }, [ 's2', 's2-1' ]]
      ]
    ));

    it('should pass on unmatched events', testTransition(`
      <scxml version="1.0" datamodel="ecmascript">
        <state id="s1">
          <transition event="bar" target="s2" />
        </state>

        <state id="s2" />
      </scxml>
    `,
      [ 's1' ], [
        [{ name: 'foo' }, [ 's1' ]]
      ]
    ));

    it('should work with parallel', testTransition(`
      <scxml version="1.0" datamodel='ecmascript'>
        <parallel id="p">
          <state id="top">
            <state id="top-1">
              <transition event="top" target="top-2" />
            </state>

            <state id="top-2">
              <transition event="top" target="top-1" />
            </state>
          </state>

          <state id="bottom">
            <state id="bottom-1">
              <transition event="bottom" target="bottom-2" />
            </state>

            <state id="bottom-2">
              <transition event="bottom" target="bottom-1" />
            </state>
          </state>
        </parallel>
      </scxml>
    `,
      [ 'p', 'top', 'top-1', 'bottom', 'bottom-1' ], [
        [{ name: 'top' }, [ 'p', 'top', 'top-2', 'bottom', 'bottom-1' ]],
        [{ name: 'bottom' }, [ 'p', 'top', 'top-2', 'bottom', 'bottom-2' ]],
        [{ name: 'bottom' }, [ 'p', 'top', 'top-2', 'bottom', 'bottom-1' ]],
        [{ name: 'bottom' }, [ 'p', 'top', 'top-2', 'bottom', 'bottom-2' ]],
        [{ name: 'top' }, [ 'p', 'top', 'top-1', 'bottom', 'bottom-2' ]],
      ]
    ));

    it('should transition without events', testTransition(`
      <scxml version="1.0" datamodel="ecmascript">
        <state id="s1">
          <transition cond="true" target="s2" />
        </state>

        <state id="s2" />
      </scxml>
    `,
      [ 's2' ]
    ));

    it('should invoke', testTransition(`
      <scxml version="1.0" datamodel="ecmascript">
        <state>
          <invoke type="http://www.w3.org/TR/scxml/" id="123">
            <param name="foo" expr="'bar'" />
          </invoke>
        </state>
      </scxml>
    `,
      [ ]
    ));

    it('should select initial', testTransition(`
      <scxml version="1.0" datamodel="ecmascript">
        <state initial="second">
          <state id="first" />
          <state id="second" />
        </state>
      </scxml>
    `,
      [ 'second' ]
    ));

    it('should disable initial selection', testTransition(`
      <scxml version="1.0" datamodel="ecmascript">
        <state id="parent" initial="_self">
          <transition event="c" target="child" />
          <state id="child" />
        </state>
      </scxml>
    `,
      [ 'parent' ], [
        [{ name: 'c' }, [ 'parent', 'child' ]],
      ]
    ));

    it('should take multiple transitions', testTransition(`
      <scxml version="1.0" datamodel="ecmascript">
        <state id="first">
          <onevent event="evt">
            <assign location="test" />
          </onevent>
          <transition event="evt" target="second" />
        </state>
        <state id="second" />
      </scxml>
    `,
      [ 'first' ], [
        [{ name: 'evt' }, [ 'second' ]],
      ]
    ));
  });
});
