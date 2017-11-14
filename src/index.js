// node自带
let http = require('http');
let fs = require('fs');
let path = require('path');
let child = require('child_process');

// 第三方包，用于解析markdown文档
let marked = require('marked');

// 自定义工具包
let file = require('../util/file');

// 操作对象
let md2html = {};

// 加载基本框架
md2html.htmlUrl = path.join(__dirname, './base.html');
md2html.baseHTML = fs.readFileSync(md2html.htmlUrl, 'utf8');

// 加载基本样式
md2html.cssUrl = path.join(__dirname, './base.css');

// 临时文件目录 
md2html.tmpDir = '/tmp/md2html';

// 服务器端口
md2html.port = 9000;

/**
 * 配置
 * @param  {object} options 配置对象
 * @return {[type]}         [description]
 */
md2html.setup = function(options) {
	for (key in options) {
		md2html[key] = options[key];
	}

	// 设置基本样式
	md2html.baseCSS = fs.readFileSync(md2html.cssUrl, 'utf8');
}

/**
 * 将markdown文档转换为html文档
 * @param  {stirng} from   操作文档的路径，或者目录的路径
 * @param  {string} target 转化后文档路径
 * @param  {string} pwd    当前绝对路径
 *
 * 几种使用情况
 * 0. from: 文件                	   将指定markdown文件 转化为同名文档 存放在当前文件夹
 * 1. from: 文件 -> target: 文件    将指定markdown文件 转化为特定文件名的html文档
 * 2. from: 文件 -> target: 目录    将指定markdown文件 转化为同名的html文档 存入对应目录中
 * 3. from: 目录 -> target: 目录    将指定目录下的markdown文档 转化为同名的html文档 存入对应目录中（目录中的其他文件直接复制）
 * 4. 其他报错
 * @return {[type]}        [description]
 */
md2html.convert = function(from, target) {
	// 判断操作路径是否存在，如果不存在，直接返回
	if (!file.isExist(from)) {
		return console.log('File or Directory may not exist!');
	}

	// 判断操作路径是文件还是目录
	let fromIsFile;

	fromIsFile = file.isFile(from);

	// 如果是文件的话，需要是md文件
	if (fromIsFile && file.docType(from) !== 'md') {
		return console.log('File format should be markdown documentation');
	}

	// 如果没有目标路径，则form必须是一个文件路径
	if (!target && !fromIsFile) {
		return console.log('convert from a directory should provide a directory target path');
	} else if (!target) {
		// target设置为源文件所在目录
		target = path.dirname(from);
	}

	// 如果操作路径路径是目录需要判断文件中是否有md文件
	// 判断target 是文件路径还是目录路径
	// 根据是否有扩展名进行区分
	let targetIsFile = false;

	if (path.extname(target) !== '') {
		// 如果target是文件，需要时html文件
		if (file.docType(target) !== 'html') {
			return console.log('Target file format should be html documentation');
		}
		targetIsFile = true;
	}

	// 判断目标路径是否存在，如果不存在，直接返回
	try {
		if (targetIsFile) {
			fs.accessSync(path.dirname(target));
		} else {
			fs.accessSync(target);
		}
	} catch (e) {
		return console.log('Target Directory may not exist!');
	}


	// 转换操作
	// 如果源路径是文件
	if (fromIsFile) {
		if (!targetIsFile) {
			target = path.join(target, path.basename(from, '.md') + '.html');
		}
		file.copyFile(from, target, generatorHtml);
	} else {
		file.copyDir(from, target, generatorHtml);
	}
};

// test
// md2html.convert('/Users/yyp/Desktop/src', '/Users/yyp/Desktop/copy');

/**
 * 给定markdown文件在浏览器中展示
 * @param  {string} filepath 文件路径
 */
md2html.show = function(filepath) {
	let self = this;

	// 判断文件是否存在
	if (!file.isExist(filepath)) {
		return console.log('file not exist');
	}

	// 判断路径是否为文件
	if (!file.isFile(filepath)) {
		return console.log('The path is not a file');
	}

	// 判断是否是md文件
	if (file.docType(filepath) !== 'md') {
		return console.log('The file is not a markdown documentation');
	}

	// 创建一个临时目录用于存放转换后的文件目录
	try {
		fs.mkdirSync(self.tmpDir);
	} catch (e) {
		file.removeDir(self.tmpDir);
		fs.mkdir(self.tmpDir);
	}

	// 拼接路径
	// 
	let tempFile = path.join(self.tmpDir, path.basename(filepath, '.md') + '.html');

	// 将处理后的文件存放在临时目录中
	file.copyFile(filepath, tempFile, generatorHtml);

	// 监听文件更新

	fs.watch(filepath, function() {
		file.copyFile(filepath, tempFile, generatorHtml);
		console.log('The content is update, please refresh the browser to check the content');
	});

	// 创建本地服务器，展示页面
	let server = http.createServer(function(req, res) {
		res.writeHead(200, {
			'Content-Type': 'text/html'
		});
		fs.createReadStream(tempFile).pipe(res);
	}).listen(self.port, function() {
		console.log('Markdown Browser v0.0.1');
		console.log('Visit http: //127.0.0.1:' + self.port + ' to start browsing.');
		// 打开浏览器
		child.exec('open http://127.0.0.1:' + self.port);
	});
};

// test
// md2html.setup();
// md2html.show('../test.md');

/**
 * 文件处理函数：markdown转换为html
 * @param  {string} content 文件内容
 * @return {string}         处理后的文件内容
 */
function generatorHtml(content) {
	let html = marked(content);
	return md2html.baseHTML.replace(/<%%>/, html).replace('<style></style>', '<style>' + md2html.baseCSS + '</style>');
}

module.exports = md2html;