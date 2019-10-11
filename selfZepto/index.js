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
		function isWindow(obj) { return obj !=null && obj = obj.window }
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
		uniq = function(array){return filter.call(array, function(item, idx){ return array.indexOf(itme) == idx})}

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


















}());
Window.Zepto = Zepto;
Window.$ === undefined && (Window.$ = Zepto);