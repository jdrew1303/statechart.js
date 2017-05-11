import createStack from 'unist-util-transform-stack';
import {
  SCXML,
  TRANSITION,
  INTERNAL,
  COMPOUND,
  PARALLEL,
  ATOMIC,
  FINAL,
} from '../identifiers';
import { getTransitionSource } from './util';

function unknownTarget(target) {
  throw new Error('Unknown target: ' + target)
}

export default function() {
  return createStack(SCXML, function(scxml) {
    return scxml.data;
  }, {
    types: [TRANSITION],
    enter: function(node, index, parent, conf) {
      const targets = node.data.targets = (node.target || []).map(function(target) {
        return conf.ids.get(target) || unknownTarget(target);
      });

      node.data.exits = targets.length ?
        getExitSet(conf.states, node, targets) :
        [];

      return node;
    }
  });
};

const exitTypes = new Set([PARALLEL, COMPOUND, ATOMIC, FINAL]);
function getExitSet(states, transition, targets) {
  const domain = getTransitionDomain(states, transition, targets);
  return domain.data.descendants.filter(function(anc) {
    return exitTypes.has(states.get(anc).data.type)
  });
}

function getTransitionDomain(states, transition, targets) {
  const source = getTransitionSource(states, transition);

  if (
    transition.data.type === INTERNAL &&
    source.data.type === COMPOUND &&
    areDescendants(source, targets)
  ) return source;

  return findLCCA(states, source, targets);
}

const lccaTypes = new Set([PARALLEL, COMPOUND, ATOMIC]);
function findLCCA(states, source, targets) {
  const ancestors = source.data.ancestors.filter(function(anc) {
    return lccaTypes.has(states.get(anc).data.type);
  });

  const selfAndTargets = targets.concat([source.idx]);

  var anc;
  for (var i = ancestors.length - 1; i >= 0; i--) {
    anc = states.get(ancestors[i]);
    if (areDescendants(anc, selfAndTargets)) break;
  }
  return anc || source;
}

function areDescendants(state, targets) {
  const descendants = new Set(state.data.descendants);
  for (var i = 0; i < targets.length; i++) {
    if (!descendants.has(targets[i])) return false;
  }
  return true;
}
