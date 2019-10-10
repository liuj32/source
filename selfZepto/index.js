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
		isArray = Array.isArray || function(obj){obj instanceof Array};
		

		zepto.matcher = function(){
			
		}


















}());
Window.Zepto = Zepto;
Window.$ === undefined && (Window.$ = Zepto);