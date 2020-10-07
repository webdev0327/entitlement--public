const gulp = require('gulp');

const jshint = require('gulp-jshint');

gulp.task('lint', () => {
	return gulp.src([ './**/*.js', './test/specs/**/*.js', '!./node_modules/**', '!./test/SpecRunner.js', '!./example/browser/bundle.js', '!./docs/**', '!./webpack.config.js'])
		.pipe(jshint({ esversion: 9 }))
		.pipe(jshint.reporter('default'))
		.pipe(jshint.reporter('fail'));
});

gulp.task('default', gulp.series('lint'));
