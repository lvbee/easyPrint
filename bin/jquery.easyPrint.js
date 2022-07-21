(function($) {
	"use strict";
	// A nice closure for our definitions
	var nav = navigator.userAgent.toLowerCase();

	function isNode(o) {
		/* http://stackoverflow.com/a/384380/937891 */
		return !!(typeof Node === "object" ? o instanceof Node : o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string");
	}

	// 初始化config，且返回options配置
	function initBaseNode(self, config, _arguments) {
		// $(selector).easyPrint() or $(selector).easyPrint({xxx})
		if (isNode(self)) {
			config.$elem = $(self);
			if (_arguments.length > 0)
				return _arguments[0];
			return {};
		}
		// $.easyPrint()
		if (_arguments.length < 1) {
			config.$elem = $("HTML");
			return {};
		}

		config.$elem = $(_arguments[0]);
		// $.easyPrint(options)
		if (!isNode(config.$elem[0])) {
			// $.easyPrint(options)
			config.$elem = $("html");
			return _arguments[0];
		}
		// $.easyPrint(selector,options)
		if (_arguments.length > 1) {
			return _arguments[1];
		}
		return {};
	}

	function initOptions(options) {
		// Default options
		var defaults = {
			useIframe : true,// 是否使用iframe的方式（默认为true，会优先使用iframe，不兼容的情况下还是会用open的方式）
			size : '', // 打印的纸张大小，可以是A4，也可以是尺寸'4in 6in'
			direction : 'portrait',// 打印方向portrait，landscape
			className : '', // 打印页面最外层的class属性，支持自定义后定义其样式
			globalStyles : true, // 是否包含来自父文档的样式（style,link）,[true],false,'style','link'
			mediaPrint : true,// 在globalStyles为false的情况下，单独设置是否包含media='print'的链接标签,[true],false,'style','link'
			printCss : '',// 打印时的额外css样式
			stylesheet : null, // 打印时要包含的外部样式表的URL
			noPrintSelector : ".no-print",
			appendHtml : null, // 在选定内容之前(前置)或之后(追加)添加自定义HTML
			prependHtml : null, // 在选定内容之前(前置)或之后(追加)添加自定义HTML
			title : null, // 更改打印的标题，默认使用页面标题（即<title>元素）
			doctype : '<!doctype html>', // 在打印的文档框架前添加文档类型
			printColor : 'exact', // 背景图形 exact或economy
			printTagA : true,// 是否打印a标签内容
			groupTableHeader : true,// 分组表格表头，即是否将表头同步至每一页，当一页打不下表格时。
			groupTableFooter : true,// 分组表格表尾，即是否将表尾同步至每一页，当一页打不下表格时。
			beforePrint : null, // 打印前回调，返回iframe对象，或open对象
			afterPrint : null, // 打印完成回调，返回用时（毫秒）
			module : null,
		};
		// Merge with user-options
		return $.extend({}, defaults, (options || {}));
	}

	function printContentInNewWindow(config, options) {
		var windowAttr = "location=yes,statusbar=no,directories=no,menubar=no,titlebar=no,toolbar=no,dependent=no";
		windowAttr += ",width=" + window.innerWidth + ",height=" + window.innerHeight;
		windowAttr += ",resizable=yes,personalbar=no,scrollbars=yes";
		var newWin = window.open("", "EASY_PRINT_WINDOW", windowAttr);
		if (newWin == null)
			return alert('Please allow print control open new window!');
		newWin.doc = newWin.document || '';
		return printContentStart(newWin, config, options, false);
	}

	function printContentInIFrame(config, options) {
		var $iframe = options.useIframe == true || options.useIframe == false ? null : $(options.useIframe + "");
		bk: if ($iframe == null || $iframe.length < 1) {
			$iframe = $('#EASY_TEMP_IFRAME');
			if ($iframe.length > 0)
				break bk;
			// Create a new iFrame if none is given
			$iframe = $('<iframe id="EASY_TEMP_IFRAME" height="0" width="0" border="0" wmode="opaque"/>').prependTo('body').css({
				"position" : "absolute",
				"top" : -999999,
				"left" : -999999,
				"z-index" : -999999
			});
		}
		var frameWindow = $iframe.get(0);
		return printContentStart(frameWindow, config, options, true);
	}

	function printContentStart(frameWindow, config, options, isIframe) {
		var $elem = config.$elem;
		try {
			frameWindow = frameWindow.contentWindow || frameWindow.contentDocument || frameWindow;
			try {
				frameWindow.resizeTo(window.innerWidth, window.innerHeight);
			} catch (err) {
				console.warn(err);
			}
			var wdoc;
			try {
				wdoc = frameWindow.document || frameWindow.contentDocument || frameWindow;
				wdoc.write(options.doctype || '<!DOCTYPE HTML>');
				var html = [];
				html.push('<div class="page ' + options.className + '">');
				html.push($elem.prop("outerHTML"));
				html.push('</div>');
				wdoc.write(html.join('\n'));
			} catch (err) {
				console.warn(err);
			}
			var $wdoc = $(wdoc);
			var title = options.title || $('title').text() || '';
			bk: if (options.module && options.module.key == 'byA4') {// 特殊的自定义模板啊
				var obj = options.module;

				config.styleHtm.push('<style type="text/css" media="print">');
				config.styleHtm.push('@page {margin: 0 !important;size:A4 portrait !important;}');
				config.styleHtm.push('.page {margin: 2cm !important;}');
				config.styleHtm.push('.easy_pf {position: fixed !important;z-index:999 !important;}');
				config.styleHtm.push('.easy_phl{top: 10px; left: 10px;}');
				config.styleHtm.push('.easy_phr{top: 10px; right: 10px;}');
				config.styleHtm.push('.easy_pfl{bottom: 10px; left: 10px;}');
				config.styleHtm.push('.easy_pfr{bottom: 10px; right: 10px;}');
				if (nav.indexOf("chrome") != -1)
					config.styleHtm.push('.easy_pfr:after{content:\'共 \' counter(pages) \' 页，当前第 \' counter(page) \' 页\' !important;}');
				config.styleHtm.push('</style>');
				options.appendHtml = options.appendHtml || '';
				options.appendHtml += '<div class="easy_pf easy_phl">' + (obj.leftTop || '') + '</div><div class="easy_pf easy_phr">' + (obj.rightTop || '') + '</div>';
				options.appendHtml += '<div class="easy_pf easy_pfl">' + (obj.leftBottom || '') + '</div><div class="easy_pf easy_pfr">' + (obj.rightBottom || '') + '</div>';
			}
			$wdoc.find('head').html('<title>' + title + '</title>' + config.linkHtm.join('\n') + config.styleHtm.join('\n'));
			$wdoc.find(options.noPrintSelector).remove();
			var $page = $wdoc.find('.page');
			// 特殊元素处理
			$page.find('canvas').each(function(index, item) {
				var $reCanvas = $elem.find('canvas:eq(' + index + ')');
				// 方案一：
				// var $item = $(item), base64 = $reCanvas[0].toDataURL('image/png');
				// $item.after('<img src="' + base64 + '" style="width:' + $item.width() + 'px !important;height:' + $item.height() + 'px !important;">');
				// $item.remove();
				// 方案二：
				var imgData = $reCanvas[0].getContext("2d").getImageData(0, 0, $reCanvas.width(), $reCanvas.height());
				item.getContext("2d").putImageData(imgData, 0, 0);
			});
			// 应该放在特殊元素处理之后，避免影响：
			if (options.prependHtml)
				$page.prepend(options.prependHtml);
			if (options.appendHtml)
				$page.append(options.appendHtml);

			// load or timeout:
			var isPrinted = false, callPrint = function() {
				if (isPrinted)
					return;
				isPrinted = true;
				if (options.beforePrint)
					options.beforePrint($wdoc);
				// Fix for IE : Allow it to render the iframe
				frameWindow.focus();
				var time = new Date().getTime();
				try {
					// Fix for IE11 - printng the whole page instead of the iframe content
					if (!wdoc.execCommand('print', false, null)) {
						// document.execCommand returns false if it failed-http://stackoverflow.com/a/21336448/937891
						frameWindow.print();
					}
					// focus body as it is losing focus in iPad and content not getting printed
					$elem.focus();
				} catch (e) {
					frameWindow.print();
				}
				wdoc.close();
				$wdoc = null;
				frameWindow.close();
				if (isIframe)
					$(frameWindow).remove();
				return options.afterPrint && options.afterPrint(new Date().getTime() - time);
			};

			// Print once the frame window loads - seems to work for the new-window option but unreliable for the iframe
			$(frameWindow).on("load", callPrint);
			// Fallback to printing directly if the frame doesn't fire the load event for whatever reason
			setTimeout(callPrint, options.timeout || 720);
		} catch (e) {
			console.warn('PrintContent error: ', e);
			if (!isIframe)
				return frameWindow.close();
			$(frameWindow).remove();
			printContentInNewWindow(config, options);
		}
	}

	$.easyPrint = $.fn.easyPrint = function() {
		if ((nav.indexOf("compatible") != -1 && nav.indexOf("msie") != -1) || (nav.indexOf("trident") != -1 && nav.indexOf("rv:11.0") != -1))
			return alert('This plugin does not support IE browser');
		var config = {}, self = this;
		// 先判断用户的调用方法：
		self = (self instanceof $) ? self.get(0) : self;
		var options = initBaseNode(self, config, arguments);
		// 初始化默认设置：
		options = initOptions(options);
		// 获取链接样式：
		var linkHtm = [];
		if (options.globalStyles == true || options.globalStyles == 'link') {
			$('link').each(function(index, item) {
				linkHtm.push($(item).prop("outerHTML"));
			});
		}
		if (!options.globalStyles && (options.mediaPrint == true || options.mediaPrint == 'link')) {
			$('link[media="print"]').each(function(index, item) {
				linkHtm.push($(item).prop("outerHTML"));
			});
		}
		if (options.stylesheet) {
			if (typeof (options.stylesheet) == 'string') {
				linkHtm.push('<link href="' + options.stylesheet + '" rel="stylesheet" type="text/css" media="print"/>');
			} else if (options.stylesheet instanceof Array) {
				$.each(Array, function(index, item) {
					if (typeof (item) != 'string')
						return;
					linkHtm.push('<link href="' + item + '" rel="stylesheet" type="text/css" media="print"/>');
				});
			}
		}
		config.linkHtm = linkHtm;

		// 文本样式：
		var styleHtm = [];
		if (options.globalStyles == true || options.globalStyles == 'style') {
			$('style').each(function(index, item) {
				styleHtm.push($(item).prop("outerHTML"));
			});
		}
		if (!options.globalStyles && (options.mediaPrint == true || options.mediaPrint == 'style')) {
			$('style[media="print"]').each(function(index, item) {
				styleHtm.push($(item).prop("outerHTML"));
			});
		}
		styleHtm.push('<style type="text/css" media="print">');
		styleHtm.push('@page {orphans:2;widows:2;page-break-after:always}');
		if (options.size && options.direction) {
			styleHtm.push('@page {size:' + ($.trim(options.size) + ' ' + $.trim(options.direction)) + '}');
		} else {
			styleHtm.push('@page {size:' + ($.trim(options.size) || $.trim(options.direction) || 'AUTO') + '}');
		}
		options.printColor = $.trim(options.printColor || '');
		if (',economy,exact,inherit,initial,unset,'.indexOf(',' + options.printColor + ',') != -1) {
			styleHtm.push('.page {-webkit-print-color-adjust:' + options.printColor + '}');
		}
		if (options.printTagA == true) {
			styleHtm.push('.page a[href^="http://"]:after, a[href^="https://"]:after{content: " (" attr(href) ") " !important;}');
		}
		if (options.groupTableHeader == true) {
			styleHtm.push('.page thead{display: table-header-group !important;}');
		}
		if (options.groupTableFooter == true) {
			styleHtm.push('.page footer{display:table-footer-group !important;}');
		}
		styleHtm.push('</style>');
		if (options.printCss)
			styleHtm.push('<style type="text/css" media="print">' + options.printCss + '</style>');
		config.styleHtm = styleHtm;

		options.className = $.trim(options.className || '');

		if (options.useIframe) {
			try {
				printContentInIFrame(config, options);
			} catch (e) {
				console.error("Failed to print from iframe", e.stack, e.message);
				printContentInNewWindow(config, options);
			}
			return;
		}
		return printContentInNewWindow(config, options);
	};
})(jQuery);