var gulp = require("gulp"),
	bs = require("browser-sync").create(),
	sass = require("gulp-sass")(require("sass")),
	uglify = require("gulp-uglify"),
	cleanCSS = require("gulp-clean-css"),
	changed = require("gulp-changed"),
	zip = require("gulp-zip"),
	concat = require("gulp-concat"),
	htmlmin = require("gulp-htmlmin"),
	plumber = require("gulp-plumber"),
	del = require("del"),
	watch = require("gulp-watch"),
	browserify = require("browserify") /* 插件，實際是 node 系 */,
	vstream = require("vinyl-source-stream") /* 轉成 stream 流，gulp 系 */,
	vbuffer = require("vinyl-buffer") /* 轉成二進制流，gulp 系 */,
	watchify = require("watchify"),
	babelify = require("babelify"),
	sourcemaps = require("gulp-sourcemaps");

const { glob } = require("glob");
// connect = require('gulp-connect');
var path = {
	css: "develop/css/**/*.css",
	sass: "develop/scss/**/*.scss",
	js: "develop/js/*.js",
	es6_js: "develop/es6/*.js",
	images: "develop/images/**/**",
	html: "develop/**/*.html",
	all: "develop/**/*",
	devCss: "develop/css/*.css",
	outCss: "develop/css",
	outJs: "develop/js",
};
var inPath = {
	css: "develop/css/*.css",
	js: "develop/js/*.js",
	images: "develop/images/**/*.{png,jpg,gif,ico}",
	html: "develop/*.html",
	all: "develop/**/*",
	root: "develop",
};
var outPath = {
	css: "online/css",
	js: "online/js",
	images: "online/images",
	html: "online",
	all: "online/**",
	root: "online",
};

function errrHandler(e) {
	console.log(e);
}

gulp.task("scss", async () => {
	// return gulp
	await console.log("修改css,注入css");

	watch([path.sass], function () {
		console.log("处理scss");

		gulp.src(path.sass)
			// .pipe(changed(path.outCss))
			// .pipe(plumber({
			//     errorHandler: errrHandler
			// }))
			.pipe(sass().on("error", sass.logError))
			// .pipe(autoprefixer({
			//     browsers: ['last 2 versions', 'Android >= 4.0'],
			//     cascade: false
			// }))
			.pipe(gulp.dest(path.outCss))
			.pipe(bs.stream());
	});
});
gulp.task("css", async () => {
	// return gulp
	await console.log("修改css,注入css");

	watch([path.css], function () {
		console.log("处理css");

		gulp.src(path.css).pipe(bs.stream());
	});
});
gulp.task("reload", async () => {
	await console.log("更改Html/JS,刷新页面");

	watch([path.html, path.js], function () {
		bs.reload();
		console.log("资源重载完毕");
	});
});

gulp.task("compileJS", async (done) => {
	await console.log("处理js文件");

	var b = browserify({
		entries: "develop/es6/main.js",
		debug: true,
		// plugin: [watchify],
	});
	b.plugin(watchify);
	b.on("update", async function () {
		console.log("js文件更新");
		await b
			.transform(babelify, {
				presets: ["@babel/preset-env"],
				plugins: ["@babel/plugin-transform-runtime"],
			})
			.bundle()
			.on("error", function (err) {
				console.log(err.message);
				this.emit("end");
			})
			.pipe(vstream("main.js"))
			.pipe(vbuffer())
			.pipe(sourcemaps.init({ loadMaps: true }))
			.pipe(uglify())

			.pipe(sourcemaps.write("."))
			.pipe(gulp.dest(path.outJs));
	});

	return b.bundle();
});

gulp.task("imgLoad", async () => {
	await console.log("部署图片文件");
	ScanFn.init();

	// watch(path.images, function() {
	//         ScanFn.init();
	//         console.log("图片有改动，重写img.js")
	//     }).on('add', function(file) {
	//         console.log('添加了 ' + file);
	//     })
	//     .on('change', function(file) {
	//         console.log('修改了 ' + file);
	//     })
	//     .on('unlink', function(file) {
	//         console.log('删除了 ' + file);
	//     });
});
gulp.task(
	"default",
	gulp.series(
		// "jssssss",
		"compileJS",
		"css",
		"scss",
		"imgLoad",
		"reload",
		// "es6",
		async () => {
			await console.log("启动本地服务器");

			bs.init({
				server: "./develop",

				index: "index.html",

				port: "8222",

				open: "external",

				browser: "Google Chrome",

				https: false,
			});
		}
	)
);
var ScanFn = (function () {
	var fs = require("fs"),
		outJS = [],
		sinPath = ["develop/images"],
		soutPath = "develop/js/img.js",
		fileInfo = {
			b: "var manifest = [",
			e: "];",
		};

	//处理某个类目下所有文件及目录
	function forFiles(files, file_path, callback, allFilesDoneCallback) {
		var arrlength = files.length;
		if (!files || files.length == 0) {
			allFilesDoneCallback(file_path);
			return;
		}

		files.forEach(function (e, i) {
			var fullFilePath = file_path + "/" + e;

			fs.stat(fullFilePath, function (err, stat) {
				if (err) {
					console.log(err);
					return;
				}
				var result = {
					isDir: false,
					isFile: true,
					file: fullFilePath,
				};

				if (stat.isDirectory()) {
					result.isDir = true;
					result.isFile = false;
				} else {
					result.isDir = false;
					result.isFile = true;
				}
				callback(result);
				arrlength--;
				if (arrlength == 0) {
					allFilesDoneCallback(file_path);
				}
			});
		});
	}

	//处理单个目录
	function forDir(dirPath, watchDir, callback) {
		fs.readdir(dirPath, function (err, files) {
			var tempArr = [],
				subFiles = [];

			files.forEach(function (file) {
				if (file.indexOf(".svn") < 0) {
					tempArr.push(file);
				}
			});

			forFiles(
				tempArr,
				dirPath,
				function (result) {
					if (result.isDir) {
						watchDir.push(result.file);
						forDir(result.file, watchDir, callback);
					} else {
						if (result.file.indexOf(".DS_Store") < 0) {
							var resfile = result.file.split("/");
							resfile.shift();
							resfile = resfile.join("/");
							subFiles.push(resfile);
							outJS.push(resfile);
						}
					}
				},
				function (processedDirPath) {
					callback(processedDirPath, subFiles);
				}
			);
		});
	}

	//遍历处理多个类目
	function forDirs(dirs, doneCallback) {
		var copiedDirs = dirs.slice(0),
			watchDir = [],
			allFiles = [];

		copiedDirs.forEach(function (path) {
			watchDir.push(path);
			forDir(path, watchDir, function (processedDirPath, subFiles) {
				allFiles = allFiles.concat(subFiles);
				console.log(processedDirPath + " 处理完成");
				watchDir.splice(watchDir.indexOf(processedDirPath), 1);
				if (watchDir.length == 0) {
					doneCallback(allFiles);
				}
			});
		});
	}

	//写入js文件
	function wf(data) {
		console.log(soutPath);
		fs.writeFile(
			soutPath,
			data + "\n",
			{
				flag: "a",
			},
			function (err) {
				if (err) throw err;
				if (data != fileInfo.b) {
					console.log("写入成功");
				}
			}
		);
	}

	function sortFileNames(files) {
		var collator = new Intl.Collator(undefined, {
			numeric: true,
			sensitivity: "base",
		});
		files.sort(collator.compare);
		return files;
	}

	function regHtml(file) {
		var regCss =
			/<link.*\s+href=(?:"css[^"]*"|'css[^']*'|"\.\.\/css[^"]*"|'\.\.\/css[^']*')[^<]*>/g;
		var regJs =
			/<script[^>].*?src=(?:"js[^"]*"|'js[^']*'|"\.\.\/js[^"]*"|'\.\.\/js[^']*').*?>.*?<\/script>/g;

		var data = fs.readFileSync(outPath.html + "/" + file, "utf8");
		var cssArr = data.match(regCss);
		var jsArr = data.match(regJs);

		if (cssArr != null) {
			cssArr.forEach(function (it, i, arr) {
				if (i != arr.length - 1) {
					data = data.replace(it, "");
				} else {
					data = data.replace(
						it,
						'<link rel="stylesheet" href="css/style.min.css">'
					);
				}
			});
		}

		if (jsArr != null) {
			jsArr.forEach(function (it, i, arr) {
				if (i != arr.length - 1) {
					data = data.replace(it, "");
				} else {
					data = data.replace(
						it,
						'<script src="js/main.min.js"></script>'
					);
				}
			});
		}

		fs.writeFileSync(outPath.html + "/" + file, data);
	}

	return {
		init: function () {
			outJS = [];
			fs.stat(soutPath, function (err, stat) {
				if (stat && stat.isFile()) {
					fs.unlink(soutPath, function (err) {
						if (err) {
							return console.error(err);
						}
						// wf(fileInfo.b);
						forDirs(sinPath, function (fileList) {
							outJS = sortFileNames(outJS);

							console.log(
								"所有目录遍历完成,获取到文件个数为:" +
									fileList.length
							);
							// wf(outJS.join(",\n") + "\n" + fileInfo.e);
							wf(
								fileInfo.b +
									"\n" +
									"	{src:'" +
									outJS.join("', id:''},\n	{src:'") +
									"', id:''},\n" +
									fileInfo.e
							);
						});
					});
				} else {
					// wf(fileInfo.b);
					forDirs(sinPath, function (fileList) {
						outJS = sortFileNames(outJS);
						console.log(
							"所有目录遍历完成,获取到文件个数为:" +
								fileList.length
						);
						wf(
							fileInfo.b +
								"\n" +
								"	{src:'" +
								outJS.join("', id:''},\n	{src:'") +
								"', id:''},\n" +
								fileInfo.e
						);
					});
				}
			});
		},

		reg: function (fn) {
			var files = fs.readdirSync(outPath.html);
			files.forEach(function (file) {
				if (file.indexOf(".html") > 0) {
					regHtml(file);
				}
			});
		},
	};
})();

// ---------------上线打包压缩--------------------
gulp.task("js", () => {
	return gulp
		.src(inPath.js)
		.pipe(
			plumber({
				errorHandler: errrHandler,
			})
		)
		.pipe(concat("main.min.js"))
		.pipe(uglify())
		.pipe(gulp.dest(outPath.js));
});
gulp.task("nanoCss", () => {
	return gulp
		.src(inPath.css)
		.pipe(
			plumber({
				errorHandler: errrHandler,
			})
		)
		.pipe(concat("style.min.css"))
		.pipe(
			cleanCSS({
				advanced: true,
				keepBreaks: false,
				keepSpecialComments: "*",
			})
		)
		.pipe(gulp.dest(outPath.css));
});
gulp.task("html", () => {
	var options = {
		removeComments: true, //清除HTML注释
		collapseWhitespace: true, //压缩HTML
		collapseBooleanAttributes: true, //省略布尔属性的值 <input checked="true"/> ==> <input />
		removeEmptyAttributes: true, //删除所有空格作属性值 <input id="" /> ==> <input />
		removeScriptTypeAttributes: true, //删除<script>的type="text/javascript"
		removeStyleLinkTypeAttributes: true, //删除<style>和<link>的type="text/css"
		minifyJS: true, //压缩页面JS
		minifyCSS: true, //压缩页面CSS
	};

	return gulp
		.src(inPath.html)
		.pipe(
			plumber({
				errorHandler: errrHandler,
			})
		)
		.pipe(htmlmin(options))
		.pipe(gulp.dest(outPath.html));
});
gulp.task("moveImg", () => {
	return gulp
		.src(inPath.images)
		.pipe(plumber())
		.pipe(gulp.dest(outPath.images));
});
gulp.task("reg", gulp.parallel("html"), function () {
	ScanFn.reg();
});
gulp.task("clean", () => {
	del.sync([outPath.all]);
});
gulp.task(
	"zip",
	gulp.parallel("clean", "js", "nanoCss", "html", "moveImg"),
	() => {
		console.log("执行压缩");
		return gulp
			.src(outPath.all)
			.pipe(zip("project.zip"))
			.pipe(gulp.dest(outPath.root));
	}
);
gulp.task(
	"build",
	gulp.parallel("clean", "js", "nanoCss", "reg", "moveImg", "zip"),
	function () {
		console.log("编译打包ending.......");
		process.exit();
	}
);

//单独处理图片路径
gulp.task("imgsrc", async () => {
	ScanFn.init();
	await console.log("图片路径处理完毕");
});
