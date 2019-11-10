/**
 * Zepto.js
 * 2019/10/10
 */
var Zepto = (function(){
	var undefined, key, $, classList, emptyArray = [], concat = emptyArray.concat, filter = emptyArray.filter, slice = emptyArray.slice,
		document = window.document,
		elementDisplay = {}, classCache = {},
		cssNumber = {'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1, 'opacity': 1, 'z-index': 1, 'zoom': 1 },
		fragmentRE = /^\s<(\w|!)[^>]*>/,
		singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
		tagExpanderRE = /^<(?!area|br|col|embed|hr|img|input|input|link|metea|param)(([\w:]+)[^>]*\/>)/ig,
		rootNodeRE = /^(?:body|html)$/i,
		capitalRE = /([A-Z])/g,

		//special attibutes that should be get/set via method calls. 
		methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],
		adjacencyOperators = ['after', 'prepend', 'before', 'append'],
		table = document.createElement('table'),
		tableRow = document.createElement('tr'),
		containers = {
			'tr': document.createElement('tbody'),
			'tbody': table, 'thead': table, 'tfoot': table,
			'td': tableRow, 'th': tableRow,
			'*': document.createElement('div')
		},
		simpleSelectorRE = /^[\w-]*$/,
		class2type = {},
		toString = class2type.toString,
		zepto = {},
		camelize, uniq, 
		tempParent = document.createElement('div'),
		propMap = {
			'tabindex': 'tabIndex',
			'readonly': 'readOnly',
			'for': 'htmlFor',
			'class': 'className',
			'maxlength': 'maxLength',
			'cellspacing': 'cellSpacing',
			'cellpadding': 'cellPadding',
			'rowspan': 'rowSpan',
			'colspan': 'colSpan',
			'usemap': 'useMap',
			'frameborder': 'frameBorder',
			'contenteditable': 'contentEditable'
		},
		isArray = Array.isArray || function(obj){obj instanceof Array}
		zepto.matches = function(element, selector){
			if(!selector || !element || element.nodeType !== 1) return false;
			var matchesSelector = element.matches || element.webkitMatchesSelector || 
														element.mozMatchesSelector || element.oMatchesSelector || 
														element.matchesSelector
			if(matchesSelector) return matchesSelector.call(element, selector);
			//fall back to performing a selector. 
			var match, parent = element.parentNode, temp = !parent;
			if(temp) (parent = tempParent).appendChild(element);
			match = ~zepto.qsa(parent, selector).indexOf(element);
			temp && tempParent.removeChild(element);
			return match;
		}

		function type(obj){
			return obj == null ? String(obj) : 
				class2type[toString.call(obj)] || 'object'
		}

		function isFuntion(value){ return type(value) == 'function'}
		function isWindow(obj) { return obj !=null && obj == obj.window }
		function isDocument(obj) { return obj !=null &&obj.nodeType == obj.DOCUMENT_NODE}
		function isObject(obj) { return type(obj) == 'object'}
		function isPlainObject(obj) {
			return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype;
		}

		function likeArray(obj){
			var length = !!obj && 'length' in obj && obj.length,
					type = $.type(obj);
			
			return 'function' !== type && !isWindow(obj) && 
				('array') == type || length == 0||
				(typeof length == 'number' &&	 length > 0 && (length-1) in obj);
		}

		function compact(array) { return filter.call(array, function(item){ item != null})}
		function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array }
		camelize = function(str) { return str.replace(/-(.)?/g, function(match, chr){ return chr ? chr.toUppercase() : ''})}
		function dasherize(str){
			return str.replace(/::/g, '/')
							.replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
							.replace(/([a-z\d])([A-Z])/g, '$1_$2')
							.replace(/_/g, '-')
							.toLowerCase()
		}
		uniq = function(array){return filter.call(array, function(item, idx){ return array.indexOf(item) == idx})}

		function classRE(name){
			return name in classCache ? 
				classCache[name] : (classCache[name] = new RegExp('(^|\\s)'+ name+ '(\\s|$)'))
		}

		function maybeAddPx(name, value){
			return (typeof value == 'number' && !cssNumber[dasherize(name)]) ? value + 'px' : value;
		}

		function defaultDisplay(nodeName){
			var element, display 
			if(!elementDisplay[nodeName]){
				element = document.createElement(nodeName);
				document.body.appendChild(element);
				display = getComputedStyle(element, null).getPropertyValue('display')
				element.parentNode.removeChild(element)
				display == 'none' && (display = 'block')
				elementDisplay[nodeName] = display
			}
			return elementDisplay[nodeName]
		}

		function children(element){
			return 'children' in element ?
			slice.call(element.children) : 
			$.map(element.childNodes, function(node){ if(node.nodeType == 1) return node})
		}

		function Z(dom, selector){
			var i, len = dom ? dom.length : 0;
			for(i=0;i<len;i++)	this[i] = dom[i];
			this.length = len;
			this.selector = selector || '';
		}		

		zepto.fragment = function(html, name, properties){ 
			var dom, nodes, container 

			if(singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))

			if(!dom){
				if(html.replace) html = html.replace(tagExpanderRE, "<$1><$2>")
				if(name == undefined) name = fragmentRE.test(html) && RegExp.$1 
				if(!(name in containers)) name = '*'
				container = containers[name]
				containers.innerHtml = ''+html
				dom = $.each(slice.call(container.childNodes), function(){
					container.removeChild(this)
				})
			}

			if(isPlainObject(properties)){
				nodes = $(dom)
				$.each(properties, function(key, value){
					if(methodAttributes.indexOf(key)) nodes[key](value)
					else nodes.attr(key, value)
				})
			}

			return dom;
		}

		zepto.Z = function(dom, selector){
			return new Z(dom, selector);
		}

		zepto.isZ = function(object){
			return object instanceof zepto.Z;
		}

		zepto.init = function(selector, context){
			var dom 
			if(!selector) return zepto.Z()
			//Optimize for string selectors 
			else if(typeof selector == 'string'){
				selector = selector.trim() 
				if(selector[0] == '<' && fragmentRE.test(selector))
					dom = zepto.fragment(selector, RegExp.$1, context), selector = null 
				else if(context !== undefined) return $(context).find(selector)
				else dom = zepto.qsa(document, selector)
			}
			else if(isFuntion(selector)) return $(document).ready(selector)
			else if(zepto.isZ(selector)) return selector
			else {
				if(isArray(selector)) dom = compact(selector)
				else if(isObject(selector)){
					dom = [selector], selector = null
				} 
				else if(fragmentRE.test(selector))
					dom = zepto.fragment(selector.trim(),RegExp.$1, context), selector = null
				else if(context !== undefined) return $(context).find(selector)
				else dom = zepto.qsa(document, selector)
			}
			return zepto.Z(dom, selector)
		}

		$ = function(selector, context){
			return zepto.init(selector, context);
		}

		function extend(target, source, deep){
			for(key in source){
				if(deep && (isPlainObject(source[key]) || isArray(source[key]))){
					if(isPlainObject(source[key]) && !isPlainObject(target[key]))
						target[key] = {}
					if(isArray(source[key]) && !isArray(target[key]))
						target[key] = []
					extend(target[key], source[key], deep)
				}
				else if(source[key] !== undefined) target[key] = source[key]
			}
		}

		$.extend = function(target){
			var deep, args = slice.call(arguments, 1)
			if(typeof target == 'boolean'){
				deep = target
				target = args.shift();
			}
			args.forEach(function(arg){ extend(target, arg, deep)})
			return target;
		}	

		zepto.qsa = function(element, selector){
			var found,
					maybeID = selector[0] == '#',
					maybeClass = !selector && selector[0] == '.',
					nameOnly = maybeID || maybeClass ? selector.slice(1) : selector,
					isSimple = simpleSelectorRE.test(nameOnly)
			return (element.getElementById && isSimple && maybeID) ? 
				( (found = element.getElementById(nameOnly)) ? [found] : []) : 
				(element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType ！== 11) ? [] : 
				slice.call(
					isSimple && !maybeID && element.getElementsByClassName ? 
						maybeClass ? element.getElementsByClassName(nameOnly) :
							element.getElementsByTagName(selector) : 
							element.querySlectorAll(selector)
				)
		}

		function  filtered(nodes, selector){
			return selector == null ? $(nodes) : $(nodes).filter(selector)
		}

		$.contains = document.documentElement.contains ? 
			function(parent, node){
				return parent !== node && parent.contains(node)
			} :
			function(parent, node){
				while(node && (node = node.parentNode))
					if(node == parent) return true;
				return false;
			}

			function funcArg(context, arg, idx, payload){
				return isFuntion(arg) : arg.call(context, idx, payload) : arg;
			}

			function setAttribute(node ,name, value){
				value == null ? node.removeAttribute(name) : node.setAttribute(name, value);
			}

			function className(node ,value){
				var klass = node.className || '',
						svg = klass && klass.baseVal !== undefined

					if(value == undefined)  return svg ? klass.baseVal : klass
					svg ?  (klass.baseVal = value) : (node.className = value)
			}

			function deserializeValue(value){
				try{	
					return value ?
						value == 'true' || 
						( value == 'false' ? false : 
							value == 'null' ?  null :
							+value + "" == value ? +value : 
							/^[\[\{]/.test(value) ? $.parseJSON(value) :
						  value )
						: value
				} catch(e){
					return value;
				}
			}

			$.type = type 
			$.isFuntion = isFuntion
			$.isWindow = isWindow
			$.isArray = isArray
			$.isPlainObject = isPlainObject

			$.isEmptyObject = function(obj) {
				var name 
				for(name in obj) return false;
				return true;
			}

			$.isNumeric = function(val) {
				var num = Number(val), type = typeof val;
				return val != null && type != 'boolean' &&
						(type != 'string' || val.length) && 
						!isNaN(num) && isFinite(num) || false;
			}

			$.inArray = function(elem, array, i){
				return emptyArray.indexOf.call(array, elem, i);
			}

			$.camelCase = camelize
			$.trim = function(str){
				return str == null ? '' : String.prototype.trim.call(str);
			}

			//plugin compatibility
			$.uuid = 0
			$.support =  { }
			$.expr = {}
			$.noop = function() {}

			$.map = function(elements, callback){
				var value, values, i, key;
				if(likeArray(elements))
					for(i=0;i<elements.length;i++){
						value = callback(elements[i], i);
						if(value != null) values.push(value)
					}
				else
					for(key in value){
						value = callback(elements[key], key);
						if(value != null) values.push(value)
					}
				return flatten(values);
			}	

			$.each = function(elements, callback){
				var i, key;
				if(likeArray(elements))
					for(i=0;i<elements.length;i++){
						if(callback(elements[i], i, elements[i]) == false) return elements;
					}
				else 
					for(key in elements){
						if(callback(elements[key], key, elements[key]) == false) return elements;
					}
				
				return elements;
			}
					
			$.grep = function(elements, callback){
				return filter.call(elements, callback);
			}

			if(window.JSON) $.parseJSON = JSON.parse;

			//Populate the class2type map
			$.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name){
				class2type[ "[object " + name + "]"] = name.toLowerCase();
			})

			//Define methods that will be available on all
			//Zepto collections
			$.fn = {
				constructor: zepto.Z,
				length: 0,

				//Because a collection acts like an array 
				//copy over these useful array functions. 
				forEach: emptyArray.forEach,
				reduce: emptyArray.reduce,
				push: emptyArray.push,
				sort: emptyArray.sort,
				splice: emptyArray.splice,
				indexOf: emptyArray.indexOf,
				concat: function(){
					var i, value, args = []
					for(i=0;i<arguments.length;i++){
						value = arguments[i];
						args[i] = zepto.isZ(value) ? value.toArray() : value;
					}
					return concat(zepto.isZ(this) ? this.toArray() : this, args)
				},

				//`map` and `slice ` in the jquery 	API	work difference
				//from their array counterparts
				map: function(fn){
					return $($.map(this, function(el, i){ return fn.call(el, i, el)}))
				},
				slice: function(){
					return $(slice.apply(this, arguments))
				},

				ready: function(callback){
					//don't use intereactive on IE<10(it can fired premature)
					if(document.readyState === "complete" || 
						(document.readyState !== "loading" && !document.documentElement.doScroll))
						setTimeout(function(){ callback($)}, 0);
					else {
						var handle = function(){
							document.removeEventListener("DOMContentLoaded", handle, false)
							window.removeEventListener("load", handle, false)
							callback($)
						}
						document.addEventListener('DOMContentLoaded', handle, false)
						window.removeEventListener('load', handle, false)
					}
					return this;
				},
				get: function(idx){
					return idx == undefined ? slice.call(this) : this[idx >=0 ? idx : idx+this.length]
				},
				toArray: function(){ return this.get() },
				size: function(){
					return this.length;
				},
				remove: function(){
					return this.each(function(){
						if(this.parentNode != null)
							this.parentNode.removeChild(this);
					})
				},
				each: function(callback){
					emptyArray.every.call(this, function(el, idx){
						return callback.call(el, idx, el) !== false;
					})
					return this;
				},
				filter: function(selector){
					if(isFuntion(selector)) return this.not(this.not(selector))
					return $(filter.call(this, function(element){
						return zepto.matches(element, selector);
					}))
				},
				add: function(selector){ 
					return $(uniq(this.concat($(selector, context))));
				},
				is: function(selector){
					return typeof selector == "string" ? this.length >0 && zepto.matches(this[0], selector) :
						selector && this.selector == selector.selector;
				},
				not: function(selector){
					var nodes = []
					if(isFuntion(selector) && selector.call !== undefined)
						this.each(function(idx){
							if(!selector.call(this, idx)) nodes.push(this)
						})
					else {
						var excludes = typeof selector == "string" ? this.filter(selector) : 
							(likeArray(selector) && isFuntion(selector.item)) ? slice.call(selector) : $(selector)
						this.forEach(function(el) {
							if(excludes.indexOf(el) < 0) nodes.push(el)
						})
					}
					return $(nodes);
				},
				has: function(selector){
					return this.filter(function(){
						return isObject(selector) ? 
							$.contains(this, selector) : 
							$(this).find(selector).size();
					})
				},
				eq: function(idx){
					return idx === -1 this.slice(idx) : this.slice(idx, +idx+1);
				},
				first: function(){
					var el = this[0]
					return el && isObject(el) ? el :  $(el);
				},
				last: function(){
					var el = this[this.length - 1]
					return el && isObject(el) ? el : $(el);
				},
				find: function(selector){
					var result, $this = this 
					if(!selector) result = $()
					else if(typeof selector == 'object')
						result = $(selector).filter(function(){
							var node = this;
							return emptyArray.some.call($this, function(parent){
								return $.contains(parent, node);
							})
						})
					else if(this.length == 1) result = $(zepto.qsa(this[0], selector))
					else result = this.map(function(){ return zepto.qsa(this, selector)})
					return result;
				},
				closest: function(selector, context){
					var nodes = [], collection = typeof selector == 'object' &&  $(selector)
					this.each(function(_, node){
						while( node && !(collection ? collection.indexOf(node) >=0 : zepto.matches(node, selector)))
							node = node !== context && !isDocument(node) && node.parentNode
						if(node && nodes.indexOf(node) < 0) nodes.push(node)
					})
					return $(nodes);
				},
				parents: function(selector){
					var ancestors = [], nodes = this;
					while(nodes.length > 0)
						nodes = $.map(nodes, function(node){
							if((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0){
								ancestors.push(node)
								return node;
							}
						})
					return filtered(ancestors, selector);
				},
				parent: function(selector){
					return filtered(uniq(this.pluck('parentNode')), selector)
				},
				children: function(selector) { 
					return filtered(this.map(function () { return children(this) }), selector)
				},
				contents: function(){
					return this.map(function(){ this.contentDocument || slice.call(this.childNodes )})
				},
				sibliings: function(selector){
					return filtered(this.map(function(i, el){
						return filter.call(children(el.parentNode), function(child){ return child !== el})
					}), selector)
				},
				empty: function(){
					return this.each(function() { this.innerHtml = ''})
				},
				//`pluck` is borrowed from Prototype.js
				pluck: function(property){
					return $.map(this, function(el){ return el[property] })
				},
				show: function(){
					return this.each(function(){
						this.style.display == "none" && (this.style.display = '')
						if(getComputedStyle(this, '').getPropertyValue("display") == "none")
							this.style.display = defaultDisplay(this.nodeName)
					})
				},
				replaceWith: function(newContent){
					return this.before(newContent).remove();
				},
				wrap: function(){
					var func = isFuntion(structure)
					if(this[0] && !func){
						var dom = $(structure).get(0),
								clone = dom.parentNode || this.length > 1
					}

					return this.each(function(index){
						$(this).wrapAll(
							func ? structure.call(this, index) : 
								clone ? dom.cloneNode(true) : dom
						)
					})
				},
				wrapAll: function(structure){
					if(this[0])
						$(this[0].before(structure = $(structure)))
					var children 
					//drill down to the inmost element
					while((children = structure.children()).length) structure = children.first()
					$(structure).append(this);
				},
        wrapInner: function(structure){
					var func = isFuntion(structure)
					return this.each(function(index){
						var self = $(this), contents = self.contents();
								dom = func ? structure.call(this, index) : structure;
						contents.length ? contents.wrapAll(dom) : self.append(dom);
					})
				},
				unwrap: function(){
					this.parent().each(function(){
						$(this).replaceWith($(this).children())
					})
					return this;
				},
				clone: function(){
					return this.map(function(){ return this.cloneNode(true) })
				},
				hide: function(){
					return this.css("display", "none")
				},
				toggle: function(setting){
					return this.each(function(){
						var el = $(this);
						(setting == undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide();
					})
				},
				prev: function(selector){ return $(this.pluck('previousElementSibling')).filter(selector || '*')},
				next: function(selector){ return $(this.pluck('nextElementSibling')).filter(selector || '*')},
				html: function(html){
					return 0 in arguments ?
						this.each(function(idx){
							var originHtml = this.innerHtml
							$(this).empty().append( funcArg(this, html, idx, originHtml))
						}) : 
						(0 in this ? this[0].innerHTML : null)
				},
				text: function(text){
					return 0 in arguments ? 
						this.each(function(idx){
							var newText = funcArg(this, text, idx, this.textContent)
							this.textContent = newText == null ? '' : ''+newText 
						}) : 
						(0 in this ? this.pluck('textContent').join("") : null)
				},
				attr: function(name, value){
					var result 
					return (typeof name == 'string' && !(1 in arguments)) ? 
						(0 in this && this[0].nodeType == 1 && (result = this[0].getAttribute(name)) != null ? result : undefined) : 
						this.each(function(idx){
							if(this.nodeType !== 1) return 
							if(isObject(name)) for(key in name) setAttribute(this, key, name[key])
							else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
						})						
				},
				removeAttr: function(name){
					return this.each(function(){ this.nodeType === 1 && name.split(' ').forEach(function(attribute){
						setAttribute(this, attribute)
					}, this)})
				},
				
			}

































}());
Window.Zepto = Zepto;
Window.$ === undefined && (Window.$ = Zepto);