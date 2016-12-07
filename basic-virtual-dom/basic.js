(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
window.basicVirtualDom = {
  h : require('./').h,
  diff : require('./').diff,
  patch : require('./').patch
};
},{"./":2}],2:[function(require,module,exports){
exports.h     = require('./lib/h').h;
exports.diff  = require('./lib/diff').diff;
exports.patch = require('./lib/patch').patch;

exports.PATCH_CREATE  = require('./lib/diff').PATCH_CREATE;
exports.PATCH_REMOVE  = require('./lib/diff').PATCH_REMOVE;
exports.PATCH_REPLACE = require('./lib/diff').PATCH_REPLACE;
exports.PATCH_REORDER = require('./lib/diff').PATCH_REORDER;
exports.PATCH_PROPS   = require('./lib/diff').PATCH_PROPS;

},{"./lib/diff":3,"./lib/h":4,"./lib/patch":5}],3:[function(require,module,exports){
/*
 * Diff
 */

var PATCH_CREATE  = 0;
var PATCH_REMOVE  = 1;
var PATCH_REPLACE = 2;
var PATCH_REORDER = 3;
var PATCH_PROPS   = 4;

/**
 * Diff two virtual dom trees
 *
 * @name diff
 * @function
 * @access public
 * @param {Object} oldNode virtual tree to compare
 * @param {Object} newNode virtual tree to compare with
 */
var diff = function(oldNode, newNode) {

  if (typeof oldNode === 'undefined' ||typeof newNode === 'undefined') {
    throw new Error('cannot diff undefined nodes');
  }

  if (!_isNodeSame(oldNode, newNode)) {
    throw new Error('unable create diff replace for root node');
  }

  return _diffTree(oldNode, newNode, []);
};

/**
 * Tree walker function
 *
 * @name _diffTree
 * @function
 * @access private
 * @param {} a
 * @param {} b
 * @param {} patches
 */
var _diffTree = function(a, b, patches) {

  _diffProps(a, b, patches);

  if (b.tag === 'text') {
    if (b.children !== a.children) {
      patches.push({ t : PATCH_REPLACE, node : a, with : b });
    }
    return;
  }

  if (Array.isArray(b.children)) {
    _diffChild(a.children, b.children, a,  patches);
  }

  return patches;
};

/**
 * Tree children diffings
 *
 * @name _diffChild
 * @function
 * @access private
 * @param {} a
 * @param {} b
 * @param {} pn
 * @param {} patches
 */
var _diffChild = function(a, b, pn, patches) {
  var reorderMap = [], i, j, found;

  for (i = 0; i < b.length; i++) {
    found = false;

    for (j = 0; j < a.length; j++) {
      if (_isNodeSame(a[j], b[i]) && reorderMap.indexOf(a[j]) === -1) {
        if (j !== i) {
          patches.push({ t : PATCH_REORDER, from : j, to : i, node : _nodeId(pn), item : _nodeId(a[j])});
        }
        reorderMap.push(a[j]);

        _diffTree(a[j], b[i], patches);
        found = true;
        break;
      }
    }

    if (found === false) {
      reorderMap.push(null);
      patches.push({ t : PATCH_CREATE, to : i, node : _nodeId(pn), item :
        b[i].tag === 'text' ? _nodeId(b[i]) :_nodeId(b[i].clone())});
    }
  }

  for (i = 0; i < a.length; i++) {
    if (reorderMap.indexOf(a[i]) === -1) {
      patches.push({ t: PATCH_REMOVE, from : i, node : _nodeId(pn), item : _nodeId(a[i])});
    }
  }
};

/**
 * Props diffings
 *
 * @name _diffProps
 * @function
 * @access private
 * @param {} a
 * @param {} b
 * @param {} patches
 * @param {} type
 */
var _diffProps = function(a, b, patches) {
  if (!a || !b || !a.props && !b.props) {
    return;
  }

  var toChange = [];
  var toRemove = [];
  var battrs = Object.keys(b.props);
  var aattrs = Object.keys(a.props);
  var i;

  for (i = 0; i < battrs.length || i < aattrs.length; i++) {
    if (i < battrs.length) {
      if (!(battrs[i] in a.props) || b.props[battrs[i]] !== a.props[battrs[i]]) {
        toChange.push({ name : battrs[i], value : b.props[battrs[i]] });
      }
    }

    if (i < aattrs.length) {
      if (!(aattrs[i] in b.props)) {
        toRemove.push({ name : aattrs[i] });
      }
    }
  }

  if (toRemove.length > 0) {
    patches.push({ t : PATCH_PROPS, remove : toRemove, node : _nodeId(a) });
  }

  if (toChange.length > 0) {
    patches.push({ t : PATCH_PROPS, change : toChange, node : _nodeId(a) });
  }
};

/**
 * Node identifier
 *
 * @name _nodeId
 * @function
 * @access private
 * @param {} node
 */
var _nodeId = function(node) {
  return node;
};

/**
 * Nodes comparison
 *
 * @name _isNodeSame
 * @function
 * @access private
 * @param {} a
 * @param {} b
 */
var _isNodeSame = function(a, b) {
  return a.tag === b.tag;
};

exports.PATCH_CREATE  = PATCH_CREATE;
exports.PATCH_REMOVE  = PATCH_REMOVE;
exports.PATCH_REPLACE = PATCH_REPLACE;
exports.PATCH_REORDER = PATCH_REORDER;
exports.PATCH_PROPS   = PATCH_PROPS;
exports.diff = diff;

},{}],4:[function(require,module,exports){
/*
 * Element
 */

/**
 * General tree
 *
 * /** @jsx h * /
 *
 * @name h
 * @function
 * @access public
 */
var h = function(argv) {
  if (!(this instanceof h)) {
    return new h(arguments);
  }
  this.tag = argv[0].toLowerCase();
  this.props = argv[1] || {};

  if (argv.length > 2) {
    if (typeof argv[2] !== 'object' && argv.length === 3) {
      this.children = [_createTextNode(argv[2])];
    } else if (Array.isArray(argv[2])) {
      this.children = argv[2];
    } else {
      this.children = [].slice.call(argv, 2, argv.length)
        .map(function(n) {
          if (typeof n === 'string') {
            return _createTextNode(n);
          } else {
            return n;
          }
        });
    }
  }
};

/**
 * Tree renderer
 *
 * @name render
 * @function
 * @access public
 * @param {Boolean} fasle - do not save DOM into tree
 */
h.prototype.render = function(node, parent) {
  node = node || this;

  node.el = createElement(node.tag ? node : this, parent);

  var children = node.children;

  if (typeof children === 'object') {
    for (var i = 0; i < children.length; i++) {
      node.el.appendChild(this.render(children[i], node.el));
    }
  }

  return node.el;
};

h.prototype.setProp = function(name, value) {
  if (typeof this.el !== 'undefined') {
    if (name === 'className') {
      this.el.setAttribute('class', value);
    } else if (name === 'style' && typeof value !== 'string') {
      this.el.setAttribute('style', _stylePropToString(value));
    } else if (name.match(/^on/)) {
      this.addEvent(name, value);
    } else if (name === 'ref') {
      if (typeof value === 'function') {
        value(this.el);
      }
    } else if (typeof value === 'boolean') {
      this.el.setAttribute(name, value);
      this.el[name] = Boolean(value);
    } else {
      this.el.setAttribute(name, value);
    }
  }

  this.props[name] = value;
};

h.prototype.setProps = function(props) {
  var propNames = Object.keys(props);

  for (var i = 0; i < propNames.length; i++) {
    var prop = propNames[i];
    this.setProp(prop, props[prop]);
  }
};

h.prototype.rmProp = function(name) {
  if (typeof this.el !== 'undefined') {
    if (name === 'className') {
      this.el.removeAttribute('class');
    } else if (name.match(/^on/)) {
      this.removeEvent(name);
    } else if (name === 'ref') {
      /* Nothing to do */
    } else if (typeof value === 'boolean') {
      this.el.removeAttribute(name);
      delete this.el[name];
    } else {
      this.el.removeAttribute(name);
    }
  }

  delete this.props[name];
};

h.prototype.addEvent = function(name, listener) {
  name = name.slice(2).toLowerCase();

  this.listeners = this.listeners || {};

  if (name in this.listeners) {
    this.removeEvent(name);
  }

  this.listeners[name] = listener;
  this.el.addEventListener(name, listener);
};

h.prototype.removeEvent = function(name) {
  if (name in this.listeners) {
    this.el.removeEventListener(name, this.listeners[name]);
    delete this.listeners[name];
  }
};

h.prototype.clone = function() {
  var node = {
    tag : String(this.tag),
    props : _cloneProps(this.props)
  };

  if (typeof this.children !== 'undefined') {
    node.children = this.tag === 'text' ? String(this.children) :
      this.children.map(function(child) {
        return child.tag === 'text' ? _createTextNode(child.children) : child.clone();
      });
  }

  return h(node.tag, node.props, node.children);
};

var _cloneProps = function(props, keepRefs) {
  if (typeof keepRefs === 'undefined') {
    keepRefs = true;
  }

  var attrs = Object.keys(props), i, name, cloned = {};

  for (i = 0; i < attrs.length; i++) {
    name = attrs[i];

    if (typeof props[name] === 'string') {
      cloned[name] = String(props[name]);
    } else if (typeof props[name] === 'function' && keepRefs === true) {
      cloned[name] = props[name];
    } else if (typeof props[name] === 'object') {
      cloned[name] = _cloneProps(props[name]);
    }
  }

  return cloned;
};

var _stylePropToString = function(props) {
  var out = '';
  var attrs = Object.keys(props);

  for (var i = 0; i < attrs.length; i++) {
    out += attrs[i].replace(/([A-Z])/g, '-$1').toLowerCase();
    out += ':';
    out += props[attrs[i]];
    out += ';';
  }

  return out;
};

var _createTextNode = function(text) {
  return {
    tag : 'text',
    children : String(text)
  };
};

var createElement = function(node, parent) {
  node.el = node.tag === 'text' ?
    document.createTextNode(node.children) :
    document.createElement(node.tag);

  if (typeof node.props !== 'undefined') {
    node.setProps(node.props);
  }

  if (typeof parent !== 'undefined') {
    parent.appendChild(node.el);
  }

  return node.el;
};

exports.h = h;
exports.createElement = createElement;

},{}],5:[function(require,module,exports){
/*
 * Patch
 */

var PATCH_CREATE  = require('./diff').PATCH_CREATE;
var PATCH_REMOVE  = require('./diff').PATCH_REMOVE;
var PATCH_REPLACE = require('./diff').PATCH_REPLACE;
var PATCH_REORDER = require('./diff').PATCH_REORDER;
var PATCH_PROPS   = require('./diff').PATCH_PROPS;

var createElement = require('./h').createElement;

/**
 * Patch DOM and virtual tree
 *
 * @name patch
 * @function
 * @access public
 * @param {Object} tree Tree to patch
 * @param {Array} patches Array of patches
 */
var patch = function(tree, patches) {
  var render = true;

  if (typeof tree.el === 'undefined') {
    render = false;
  }

  for (var i = 0; i < patches.length; i++) {
    var p = patches[i];
    p.render = render;

    switch(p.t) {
      case PATCH_REORDER:
        _patchReorder(p);
        break;
      case PATCH_CREATE:
        _patchCreate(p);
        break;
      case PATCH_REMOVE:
        _patchRemove(p);
        break;
      case PATCH_REPLACE:
        _patchReplace(p);
        break;
      case PATCH_PROPS:
        _patchProps(p);
        break;
    }
  }
};

/**
 * Replace existen node content
 *
 * @name patchReplace
 * @function
 * @access private
 */
var _patchReplace = function(p) {
  p.node.children = String(p.with.children);

  if (p.render === true) {
    p.node.el.nodeValue = String(p.with.children);
  }
};

/**
 * Reorder existen node
 *
 * @name patchReorder
 * @function
 * @access private
 */
var _patchReorder = function(p) {
  if (p.render === true) {
    p.node.el.insertBefore(p.item.el, p.node.el.childNodes[p.to]);
  }

  p.node.children.splice(p.to, 0,
    p.node.children.splice(p.node.children.indexOf(p.item), 1)[0]);
};

/**
 * Create new tree node
 *
 * @name patchCreate
 * @function
 * @access private
 */
var _patchCreate = function(p) {
  var element;

  if (p.render === true) {
    element = p.item.tag === 'text' ?
      createElement(p.item) : p.item.render();
  }

  if (p.node.children.length - 1 < p.to) {
    p.node.children.push(p.item);

    if (p.render === true) {
      p.node.el.appendChild(element);
    }
  } else {
    p.node.children.splice(p.to, 0, p.item);

    if (p.render === true) {
      p.node.el.insertBefore(element, p.node.el.childNodes[p.to]);
    }
  }
};

/**
 * Remove tree node
 *
 * @name patchRemove
 * @function
 * @access private
 */
var _patchRemove = function(p) {
  if (p.render === true) {
    p.node.el.removeChild(p.item.el);
  }

  for (var i = 0; i < p.node.children.length; i++) {
    if (p.node.children[i] === p.item) {
      p.node.children.splice(i, 1);
    }
  }
};

/**
 * Replace props
 *
 * @name _patchProps
 * @function
 * @access private
 */
var _patchProps = function(p) {
  var i;

  if ('remove' in p) {
    for (i = 0; i < p.remove.length; i++) {
      p.node.rmProp(p.remove[i].name);
    }
    return;
  }

  if ('change' in p) {
    for (i = 0; i < p.change.length; i++) {
      p.node.setProp(p.change[i].name, p.change[i].value);
    }
    return;
  }
};

exports.patch = patch;

},{"./diff":3,"./h":4}]},{},[1]);
