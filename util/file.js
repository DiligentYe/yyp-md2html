// node自带
let fs = require('fs');
let path = require('path');

let file = {
	/**
	 * 查看文件类型
	 * @param  {string} filename 文件名或者文件路径
	 * @return {string}          文件类型
	 *
	 * docType('text.md')  =>   'md'
	 */
	docType: function(filename) {
		let type = {
			'.md': 'md',
			'.js': 'js',
			'.css': 'css',
			'.html': 'html',
			'.txt': 'txt',
			'.pdf': 'pdf'
		};

		let ext = path.extname(filename);

		return (ext in type) ? type[ext] : 'other';
	},

	/**
	 * 删除文件夹（Node自带方法，无法删除非空文件夹）
	 * @param  {string} dirname 目录路径
	 */
	removeDir: function(dirname) {
		let files = fs.readdirSync(dirname);
		let self = this;
		// 递归删除目录中的文件
		files.forEach(function(filename) {
			let dist = path.join(dirname, filename);
			if (self.isFile(dist)) {
				fs.unlinkSync(dist);
			} else {
				self.removeDir(dist);
			}
		});

		// 在删除该文件夹
		fs.rmdirSync(dirname);
	},

	/**
	 * 复制目录中的内容（包括子目录）
	 * @param  {string} dirname 源目录地址
	 * @param  {string} target  目标目录地址
	 * @param  {function} handle 文件内容处理函数
	 */
	copyDir: function(dirname, target, handle) {
		let files = fs.readdirSync(dirname);
		let dist;
		let self = this
		files.forEach(function(filename) {
			let from = path.join(dirname, filename);
			if (self.isFile(from)) {
				// 如果设置了md选项，则进行特定转换
				if (path.extname(from) === '.md') {
					dist = path.join(target, path.basename(filename, '.md') + '.html');
					self.copyFile(from, dist, handle);
				} else {
					dist = path.join(target, filename);
					self.copyFile(from, dist);
				}
			} else {
				// 在目标目录下创建新目录
				dist = path.join(target, filename);
				try {
					// 如果目录已存在，删除该目录
					if (self.isExist(dist)) {
						self.removeDir(dist);
					}
					fs.mkdirSync(dist);
				} catch (e) {
					console.log('an error occur when create directory');
				}

				self.copyDir(from, dist)
			}
		});
	},

	/**
	 * 文件或者目录是否存在
	 * @param  {string}  path 文件或目录所在路径
	 * @return {Boolean}      文件是否存在
	 */
	isExist: function(path) {
		try {
			fs.accessSync(path);
			return true;
		} catch (e) {
			return false;
		}
	},

	/**
	 * 判断给定路径是否是文件
	 * @param  {string}  path 路径
	 * @return {boolean}      是否为文件
	 */
	isFile: function(path) {
		let stats = fs.statSync(path);
		return stats.isFile();
	},

	/**
	 * 拷贝文件
	 * @param  {string} from   源文件路径
	 * @param  {string} target 目标路径
	 * @param  {function} handle 文件内容处理函数
	 */
	copyFile: function(from, target, handle) {
		// 对特定文件进行特定处理后复制
		if (handle) {
			let content;
			try {
				content = fs.readFileSync(from, 'utf8');
			} catch (e) {
				console.log('an error occur when reading file!');
			}

			content = handle(content);

			try {
				fs.writeFileSync(target, content, 'utf8');
			} catch (e) {
				return console.log('an error occur when writing file!');
			}
		} else {
			// 直接复制
			let rStream = fs.createReadStream(from);
			let wStream = fs.createWriteStream(target);
			rStream.pipe(wStream);
		}
	}
};

module.exports = file;