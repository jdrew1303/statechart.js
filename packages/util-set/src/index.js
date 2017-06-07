export function difference(subject, set) {
  set.forEach(function(element) {
    if (subject.has(element)) subject.delete(element);
    else subject.add(element);
  });
  return subject;
}

export function intersection(subject, set) {
  if (Array.isArray(set)) set = new Set(set);
  set.forEach(function(element) {
    if (!subject.has(element)) subject.delete(element);
  });
  subject.forEach(function(element) {
    if (!set.has(element)) subject.delete(element);
  });
  return subject;
}

export function union(subject, set) {
  set.forEach(function(element) {
    subject.add(element);
  });
  return subject;
}

export function toArray(subject) {
  var arr = [];
  subject.forEach(function(element) {
    arr.push(element);
  });
  return arr.sort();
}

const INTERSECTS = {};
export function hasIntersection(subject, set) {
  try {
    set.forEach(function(element) {
      if (subject.has(element)) throw INTERSECTS;
    });
  } catch (e) {
    if (e === INTERSECTS) return true;
    throw e;
  }
  return false;
}
