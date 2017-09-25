var gulp        = require('gulp');
uglify          = require('gulp-uglify');
cleanCSS        = require('gulp-clean-css');
autoprefixer    = require('gulp-autoprefixer');
bs              = require('browser-sync');
rename          = require('gulp-rename');
zip             = require('gulp-zip');
sass 		    = require('gulp-sass'),
concat 		    = require('gulp-concat'),
htmlmin 	    = require('gulp-htmlmin'),
plumber         = require('gulp-plumber');
del             = require('del');
dn              = process.platform == "win32" ? __dirname.toString().split('\\').pop() : __dirname.toString().split('/').pop(),
path = {
    css: 	'develop/css/style/*',
    sass:	'develop/css/style/*.css',
    js: 	'develop/js/*.js',
    images: 'develop/images/**/*.{png,jpg,gif,ico}',
    html: 	'develop/*.html',
    all:    'develop/**/*',
    devCss:	'develop/css/*.css',
    outCss: 'develop/css'
},

gulp.watch([path.images,path.html,path.js], ['reload']);
gulp.watch([path.css,path.sass],['css']);

function errrHandler(e) {
	console.log(e);
}

gulp.task('css',['clean'],() => {
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
gulp.task('clean', () => {
    del.sync([path.devCss]);
});
gulp.task('reload', () => {
    bs.reload();
});
gulp.task('default',['clean','css'], function () {
    bs.init({
        server: './develop',
        index: 'index.html',
        browser: 'google chrome',
        port: '8222',
        open: 'external',
        ui: {
            port: 8223,
        }
    })
});
