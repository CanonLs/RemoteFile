var gulp            = require('gulp');
    autoprefixer    = require('gulp-autoprefixer'),
    bs              = require('browser-sync'),
    sass 		    = require('gulp-sass'),
    plumber         = require('gulp-plumber'),
    path = {
        css: 	'develop/css/style/*',
        sass:	'develop/css/style/*.scss',
        js: 	'develop/js/*.js',
        images: 'develop/images/**/*.{png,jpg,gif,ico}',
        html: 	@html1@,
        all:    'develop/**/*',
        devCss:	'develop/css/*.css',
        outCss: 'develop/css'
    };

gulp.watch([path.images],['imgLoad']);
gulp.watch([path.css,path.sass],['css']);
gulp.watch([path.html,path.js], ['reload']);


function errrHandler(e) {
	console.log(e);
}

gulp.task('css',() => {
    return gulp
        .src(path.css)
        .pipe(plumber({errorHandler: errrHandler }))
        .pipe(sass())
        .pipe(autoprefixer({
            browsers: ['last 2 versions', 'Android >= 4.0'],
            cascade: false
        }))
        .pipe(gulp.dest(path.outCss))			
        .pipe(bs.stream());
        
});
gulp.task('reload', () => {
    bs.reload();
});
gulp.task('imgLoad', () => {
    ScanFn.init();
});
gulp.task('default',['css'], function () {
    bs.init({
        server: './develop',
        index: @html2@,
        port: '8222',
        open: 'external',
        ui: {
            port: 8223,
        }
    })
});

var ScanFn = (function(){
    var fs = require('fs'),
        outJS = [],
        inPath = ['develop/images'],
        outPath = 'develop/js/img.js',
        fileInfo = {
            b: 'var manifest = [',
            e: '];'
        };

    //处理某个类目下所有文件及目录
    function forFiles(files, file_path,callback,allFilesDoneCallback) {
        var arrlength=files.length;
        if(!files||files.length==0){
            allFilesDoneCallback(file_path);
            return;
        }

        files.forEach(function (e, i) {
            var fullFilePath = file_path + '/' + e;

            fs.stat(fullFilePath, function (err, stat) {
                var result={
                    isDir:false,
                    isFile:true,
                    file:fullFilePath
                };

                if (stat.isDirectory()) {
                    result.isDir=true;
                    result.isFile=false;
                }else{
                    result.isDir=false;
                    result.isFile=true;
                }
                callback(result);
                arrlength--;
                if(arrlength==0){
                    allFilesDoneCallback(file_path);
                }
            });
        });
    }

    //处理单个目录
    function forDir(dirPath,watchDir,callback){
        fs.readdir(dirPath, function (err, files) {
            var tempArr = [],
                subFiles= [];

            files.forEach(function(file){
                if(file.indexOf('.') < 0) {
                    tempArr.push(file);
                }
            });

            forFiles(tempArr,dirPath,function(result){
                if(result.isDir){
                    watchDir.push(result.file);
                    forDir(result.file,watchDir,callback);
                }else{
                    if(result.file.indexOf('.DS_Store') < 0) {
                        var resfile = result.file.split('/');
                        resfile.shift();
                        resfile = resfile.join('/');
                        subFiles.push(resfile);
                        outJS.push("    {src:'"+resfile+"', id:''}");
                    }
                }
            },function(processedDirPath){
                callback(processedDirPath,subFiles);
            });
        });
    }

    //遍历处理多个类目
    function forDirs(dirs,doneCallback) {
        var copiedDirs=dirs.slice(0),
            watchDir=[],
            allFiles=[];

        copiedDirs.forEach(function(path){
            watchDir.push(path);
            forDir(path,watchDir,function(processedDirPath,subFiles){
                allFiles=allFiles.concat(subFiles);
                console.log(processedDirPath+' 处理完成',);
                watchDir.splice(watchDir.indexOf(processedDirPath),1);
                if(watchDir.length==0){
                    doneCallback(allFiles);
                }
            });
        });
    }

    //写入js文件
    function wf(data){
        fs.writeFile(outPath, data+"\n", {flag:'a'}, function(err){
            if(err) throw err;
            console.log("写入成功");
        });
    }

    return {
        init: function(){
            outJS = [];
            fs.stat(outPath, function(err, stat){
                if(stat&&stat.isFile()) {
                    fs.unlink(outPath, function (err) {
                        if (err) {
                            return console.error(err);
                        }
                        wf(fileInfo.b);
                        forDirs(inPath,function(fileList){
                            console.log('所有目录遍历完成,获取到文件个数为:'+fileList.length);
                            wf(outJS.join(",\n") + "\n" + fileInfo.e);
                        });
                    });
                } else {
                    wf(fileInfo.b);
                    forDirs(inPath,function(fileList){
                        console.log('所有目录遍历完成,获取到文件个数为:'+fileList.length);
                        wf(outJS.join(",\n") + "\n" + fileInfo.e);
                    });
                }
            });
        }
    }
})();