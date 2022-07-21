# jQuery.EasyPrint.js使用文档

原生JS打印插件之jQuery.EasyPrint.js使用文档
调用浏览器自带打印功能，使用JavaScript的 window.print(); 方法。

自主研发的一个轻量级超简单的js打印插件。

## 一、示例：

```js
var $elem = $('#print-elem');
//方案一
$.easyPrint();
$.easyPrint({});
$.easyPrint('.my-elem');
$.easyPrint('.my-elem', {});
//方案二：
$elem.easyPrint();
$elem.easyPrint({
	useIframe : true,// 是否使用iframe的方式
	size : '', // 打印的纸张大小，可以是A4，也可以是尺寸'4in 6in'
	direction : 'portrait',// 打印方向portrait，landscape
	className : '', // 打印页面最外层的class属性，支持自定义后定义其样式
	globalStyles : true, // 是否包含来自父文档的样式
	mediaPrint : true,// 在globalStyles为false的情况下，单独设置是否包含media='print'的链接标签
	printCss : '',// 打印时的额外css样式
	stylesheet : null, // 打印时要包含的外部样式表的URL
	noPrintSelector : ".no-print",
	appendHtml : null, // 在选定内容之后(追加)添加自定义HTML
	prependHtml : null, // 在选定内容之前(前置)添加自定义HTML
	title : '这是标题呀', // 更改打印的标题，默认使用页面标题（即<title>元素）
	doctype : '<!doctype html>', // 在打印的文档框架前添加文档类型
	printColor : 'exact', // 背景图形 exact或economy
	printTagA : true,// 是否打印a标签内容
	groupTableHeader : true,// 分组表格表头，即是否将表头同步至每一页，当一页打不下表格时。
	groupTableFooter : true,// 分组表格表尾，即是否将表尾同步至每一页，当一页打不下表格时。
	beforePrint : null, // 打印前回调，返回iframe对象，或open对象
	afterPrint : null, // 打印完成回调，返回用时（毫秒）
});

```

## 二、参数

#### useIframe

> 是否使用iframe的方式

插件支持两种方式：iframe内置框架、open打开新窗口；

默认为true，会优先使用iframe，在不兼容的情况下还是会用open的方式

- [true],false，也可以使用已存在的elem对象，比如：'.myiframe'

使用open方式时，可能浏览器会拦截弹框，请点击始终允许后再操作~

核心技术：

```js
function printContentInIFrame(config, options) {
	var $iframe = options.useIframe == true || options.useIframe == false ? null : $(options.useIframe + "");
	if ($iframe == null || $iframe.length < 1) {
		// Create a new iFrame if none is given
		$iframe = $('<iframe height="0" width="0" border="0" wmode="opaque"></iframe>').prependTo('body').css({
			"position" : "absolute",
			"top" : -999999,
			"left" : -999999,
			"z-index" : -999999
		});
	}
	var frameWindow = $iframe.get(0);
	return printContentStart(frameWindow, config, options, true);
}

```


#### className

> 打印页面最外层的class属性，支持自定义后定义其样式

插件默认为容器添加``page``的属性，故也可以直接定义``.page``的样式。

<a href="#_tag_100001">示例</a>



#### size

> 打印的纸张大小

- [auto],A4,A5,A3,B5,B4...more...

- 本质上，和纸张方向一起设置的，即size: 4in 6in landscape;


#### direction

> 打印的纸张方向

- [portrait],landscape


#### printCss

> 打印页的样式，常规的，如：``body{margin:1cm;}``

如果技术到位，还可以给打印设置一些特殊处理选项，如：

```
@page {
	margin:0;orphans:2;widows:2;page-break-after:always；
}

@page:first {
	margin: 2cm;
}
```

其中，``@ page``仅支持更改文档的margin，widows,orphans,和分页符。尝试更改任何其他CSS属性将被忽略。


#### printColor

> 和打印页的``背景图形``功能一致，用来迫使基于WebKit引擎浏览器的背景颜色和图像打印。

- 默认 exact；可选：economy,exact,inherit,initial,unset

事实上，使用了：-webkit-print-color-adjust:exact 样式。其中：

- economy ：正常行为。只有当用户在其浏览器的打印设置对话框中明确允许时,才会打印背景颜色和图像。

- exact ：应用该规则的元素的背景色和图像总是被打印,用户的打印设置被覆盖。

<div id="_tag_100001"> </div>

比如：强制白底黑字打印 

```css
.page {
  -webkit-print-color-adjust: exact;
  background: #222;
  color: #eee;
}
```

注：大部分浏览器不会打印 ``body`` 元素的背景，如果将此属性设置为 ``exact`` ，则它将仅应用于其后代。


#### timeout

> 使用iframe或open新窗口时，load加载超时时间（用于加载超时，补加载）


#### globalStyles

> 功能：是否包含来自父文档的样式（style,link）

- [true],false,'style','link' 默认true，即style+link；


#### mediaPrint

> 在globalStyles为false的情况下，单独设置是否包含media='print'的链接标签;由globalStyles选项重写

- 默认false；接收值：Boolean；


#### stylesheet

> 功能：要包含的外部样式表的URL

- 默认null；接收值：URL-string；字符串或数组，注意是url链接


#### title

> 功能：更改打印的标题

- 默认值 null，使用主机页面标题（即<title>元素内容）；接收值：任何单行字符串；


#### noPrintSelector

> 打印元素内，指定元素不打印

- 默认：``.no-print``


#### prependHtml :

> 功能：在选定内容之前(前置)添加自定义HTML

- 默认值 null；接收值：任何有效的jQuery-selector或HTML-text；


#### appendHtml :

> 功能：在选定内容之后(追加)添加自定义HTML

- 默认值 null；接收值：任何有效的jQuery-selector或HTML-text；



#### doctype

> 功能：在打印的文档框架前添加文档类型

- 默认值：``'<!doctype html>'``；接收值：任何有效的doctype字符串；



#### printTagA

> 是否打印a标签内容；即打印时，是否显示a标签的href属性。

- 默认值：true ；false

- 本质上，使用了CSS的特殊样式：
```js
a[href^="http://"]:after, a[href^="https://"]:after {
	content:"(" attr(href) ") ";
}
```


#### groupTableHeader

> 分组表格表头，即是否将表头同步至每一页，当一页打不下表格时。

- 默认值：true ；false

- 本质上，使用了CSS的打印样式：
```js
.page thead{display:table-header-group}
```
#### groupTableFooter

> 分组表格表尾，即是否将表尾同步至每一页，当一页打不下表格时。

- 默认值：true ；false

- 本质上，使用了CSS的打印样式：
```js
.page footer{display:table-footer-group;}
```

#### beforePrint

> 打印前回调，返回iframe对象，或open对象


#### afterPrint

> 打印完成回调，返回用时（毫秒）

注：控件没用到 ``window.onbeforeprint``、``window.onafterprint``事件。而是单纯的执行前与执行后的回调。


#### module

> 打印模板（插件自定义的，如有雷同，直接使用即可）


## 三、关于module模板：

> 特殊模板，是Object，必带key

#### key值是：byA4

- 使用A4纸张大小，竖屏，完美处理四边的元素
- 系统默认左上显示日期，右上显示标题，左下显示域名或IP，右下显示分页数值。本模板改变了该显示方式。
	
	去除浏览器默认页眉页脚

- 本质上，使用了styleHtml、appendHtml、以及绝对定位之间的互相配合。

- 
- leftTop:'左上角内容'
- rightTop:'右上角内容'
- leftBottom:'左下角内容'
- rightBottom:'右下角内容'

## 四、指定元素的分页打印

> 浏览器自带的打印功能是根据内容多少来分页的，就是当前打印页显示不下了才会自动分页，并且有的内容还会出现上下两页分页时，将这个整体内容划开的情况，比如table，img等

那么有没有什么方法可以自定义打印分页呢？

css提供了可以用来设置打印分页的属性：

page-break-after：指定元素后面插入分页符。
page-break-before：指定元素前添加分页符。
page-break-inside ：指定元素中插入分页符。

一般我们都使用 page-break-after:always在元素后插入分页符。

可以看见元素设置了page-break-after:always属性后，该元素之后的内容就会单独分页显示。


- 不能对绝对定位的元素使用以上三种分页属性。



























