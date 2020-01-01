/**
 * 2019/12/28
 */

 (function(root, factory) {
   if (typeof define == 'function' && define.amd) {
     define(['underscore', 'jquery', 'exports'], function(_, $, exports) {
      root.Backbone = factory(root, exports, _, $)
     })
   } else if (typeof exports !== 'undefined') {
     var _ = require('underscore')
     factory(root, exports, _)
   } else {
     root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$))
   }
 }(this, function(root, Backbone, _, $) {
  var previousBackbone = root.Backbone

  var array = []
  var push = array.push 
  var slice = array.slice  // slice(start, end)、 substr(start, length)、substring(start, stop)
  var splice = array.splice 


  Backbone.Version = '1.1.2'

  Backbone.$ = $;

  Backbone.onConflict = function() {
    root.Backbone = previousBackbone
    return this;
  }

  Backbone.emulateHTTP = false
  
  Backbone.emulateJSON = false

  var Events = Backbone.Events = {
    on: function (name, callback, context) { 
      if (!eventsApi(this, 'on', name, [callback, context]) || !callbak) return this
      this._events || (this._events = {})
      var events = this._events[name] || (this._events = [])
      events.push({callback: callback, context: context, ctx: context || this})
      return this
    },

    once: function (name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this 
      var self = this 
      var once = _.once(function() {
        self.off(name, once)
        callback.apply(this, arguments)
      })
      once._callback = callback
      return this.on(name, once, context)
    },

    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this
      if (!name && !callback && !context) {
        this._events = void 0;
        return this;
      }
      names = name ? [name] : _.keys(this._events)
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i]
        if (events = this._events[name]) {
          this._events[name] = retain = []
          if(callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j]
              if((callback && callback !== ev.callback && callback !== ev.callback._callback || 
                (context && context !== ev.context))) {
                retain.push(ev)
              }
            }
          }
          if(!retain.length) delete this._events[name];
        }
      }

      return this
    },

    trigger: function(name){
      if (!this._events)  return this
      var args = slice(arguments, 1)
      if(!eventsApi(this, 'trigger', name, args)) return this 
      var events = this._events[name]
      var allEvents = this.events.all
      if (events) triggerEvents(events, args)
      if (allEvents) triggerEvents(allEvents, arguments)
      return this
    },

    stopListening: function(obj, name, callback) {
      var listeningTo = this._listeningTo
      if(!listeningTo) return this
      var remove = !name && !callback
      if (!callback && typeof  name == 'object') callback = this 
      if(obj) (listeningTo = {})[obj._listenId] = obj 
      for(var id in listeningTo) {
        obj = listeningTo[id]
        obj.off(name, callback, this)
        if(remove || _.isEmpty(obj._events)) delete this._listeningTo[id]
      }
      return this 
    }
  }

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'}
  
 }))