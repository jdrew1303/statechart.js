import createSandbox from './sandbox';
export { default as load } from './loader';

export function init(api, ioprocessors) {
  var sandbox = createSandbox({
    _ioprocessors: ioprocessors,
    In: api.isActive,
    _raise: api.raise,
    _send: api.send,
    _cancel: api.cancel,
  });

  var pending = [];

  var datamodel = Object.assign({
    push: function(str) {
      try {
        var value = sandbox.exec(str);
      } catch (err) {
        // TODO send error into api
        console.error(err);
      }
      if (value && value.then) pending.push(value);
      return datamodel;
    },

    event: function(event) {
      sandbox.global._event = event;
      return datamodel;
    },

    flush: function() {
      var p = pending;
      pending = [];
      return Promise
        .all(p)
        .then(function() {
          sandbox.global._event = null;
          return Promise.resolve(datamodel);
        })
        .catch(function(error) {
          sandbox.global._event = null;
          // TODO send error into api
          return Promise.reject(error);
        });
    }
  }, sandbox);

  return datamodel;
}
