/* ========================================
 * Gulpfile for `<%= appNameHumanize %>`
 * ========================================
 *
 * @generated <%= (generatorDate) %> using `<%= pkg.name %> v<%= pkg.version %>`
 * @url <%= (generatorRepository) %>
 */

'use strict';

var assemble = require('assemble');
var app = assemble();
var fs = require('fs');
var browserify = require('browserify');
var browserSync = require('browser-sync').create();
var merge = require('merge-stream');
var notifier = require('node-notifier');
var path = require('path');
var prettyHrtime = require('pretty-hrtime');
var rimraf = require('rimraf');
var source = require('vinyl-source-stream');
var through = require('through2');
var watchify = require('watchify');
var $ = require('gulp-load-plugins')();

var production = false;
var open = process.env.npm_config_open;


/* ======
 * Config
 * ====== */

var config = {
  src: 'src/',
  dest: 'dist/',
  buildPath: '/',
  stylesheets: {
    src: 'src/assets/stylesheets/app.scss',
    dest: 'dist/assets/stylesheets/',
    watch: 'src/assets/stylesheets/**/*.scss'
  },
  javascripts: {
    src: 'src/assets/javascripts/',
    dest: 'dist/assets/javascripts/',
    bundle: [{
      file_name: 'app.js',
      src: 'src/assets/javascripts/app.js'
    }, {
      file_name: 'head.js',
      src: 'src/assets/javascripts/head.js'
    }]
  },
  images: {
    src: 'src/assets/images/*.{jpg,jpeg,png,gif,webp,svg}',
    dest: 'dist/assets/images/',
    watch: 'src/assets/images/*.{jpg,jpeg,png,gif,webp,svg}'
  },
  fonts: {
    src: 'src/assets/fonts/*.{eot,svg,ttf,woff}',
    dest: 'dist/assets/fonts/',
    watch: 'src/assets/fonts/*.{eot,svg,ttf,woff}'
  },
  html: {
    data: 'src/*.{json,yml}',
    dest: 'dist/',
    helpers: 'src/helpers/*.js',
    layouts: 'src/layouts/*.hbs',
    partials: 'src/partials/*.hbs',
    templates: 'src/templates/**/*.hbs',
    watch: ['src/{layouts,templates,partials}/**/*.hbs', 'src/*.{json,yml}']
  }
}


/* ======
 * Tasks
 * ====== */

/**
 * Assemble
 */
app.data({ assets: 'assets' });
app.data(config.html.data);
app.helpers(config.html.helpers);

app.preLayout(/\/src\/templates\/.*\.hbs$/, function(view, next) {
  view.layout = 'default';
  next();
});

app.task('html', function() {
  app.data({ dev: !production });
  app.layouts(config.html.layouts);
  app.partials(config.html.partials);

  return app.src(config.html.templates)
    .pipe(app.renderFile())
    .on('error', handleError)
    .pipe($.rename({ extname: '.html' }))
    .pipe(app.dest(config.html.dest));
});

/**
 * Stylesheets
 */
app.task('stylesheets', function() {
  var pipeline = app.src(config.stylesheets.src)
    .pipe($.sass({
      includePaths: ['node_modules', 'bower_components'],
      outputStyle: 'expanded'
    }))
    .on('error', handleError)
    .on('error', $.sass.logError)
    .pipe($.autoprefixer({
      browsers: ['last 2 versions', 'IE 10']
    }))

  if (production) {
    return pipeline = pipeline
      .pipe($.replace('../', config.buildPath + 'assets/'))
      .pipe($.combineMq({ beautify: false }))
      .pipe($.cssnano({ mergeRules: false }))
      .pipe(app.dest(config.stylesheets.dest));
  } else {
    return pipeline = pipeline
      .pipe(app.dest(config.stylesheets.dest))
      .pipe(browserSync.stream());
  }
});

/**
 * Javascripts
 */
app.task('javascripts', function(callback) {

  var bundleQueue = config.javascripts.bundle.length;

  var browserifyBundle = function(bundleConfig) {

    var pipeline = browserify({
      cache: {},
      packageCache: {},
      fullPaths: false,
      entries: bundleConfig.src,
      debug: !production
    });

    var bundle = function() {
      bundleLogger.start(bundleConfig.file_name);

      var collect = pipeline
        .bundle()
        .on('error', handleError)
        .pipe(source(bundleConfig.file_name));

      if (!production) {
        collect = collect.pipe(browserSync.stream())
      }

      return collect
        .pipe(app.dest(config.javascripts.dest))
        .on('end', reportFinished);
    };

    if (!production) {
      pipeline = watchify(pipeline).on('update', bundle);
    }

    var reportFinished = function() {
      bundleLogger.end(bundleConfig.file_name)

      if (bundleQueue) {
        bundleQueue--;
        if (bundleQueue === 0) {
          callback();
        }
      }
    };

    return bundle();
  };

  config.javascripts.bundle.forEach(browserifyBundle);
});

/**
 * Images
 */
app.task('images', function() {
  var pipeline = app.src(config.images.src)
    .pipe($.changed(config.images.dest))
    .pipe($.imagemin())
    .on('error', handleError)
    .pipe(app.dest(config.images.dest));

  if (production) {
    return pipeline;
  }

  return pipeline.pipe(browserSync.stream());
});

/**
 * Fonts
 */
app.task('fonts', function() {
  var pipeline = app.src(config.fonts.src)
    .pipe($.changed(config.fonts.dest))
    .on('error', handleError)
    .pipe(app.dest(config.fonts.dest));

  if (production) {
    return pipeline;
  }

  return pipeline.pipe(browserSync.stream());
});

/**
 * Server
 */
app.task('server', function() {
  browserSync.init({
    open: open === undefined ? 'external' : open,
    port: 9001,
    notify: false,
    server: {
      baseDir: config.dest,
      routes: {
        '/bower_components': 'bower_components',
        '/node_modules': 'node_modules'
      }
    }
  });
});

/**
 * Watch
 */
app.task('watch', function() {
  app.watch(config.html.watch, ['html'], function(cb) {
    setTimeout(function() {
      browserSync.reload();
      cb();
    }, 150);
  });
  app.watch(config.stylesheets.watch, ['stylesheets']);
  app.watch(config.fonts.watch, ['fonts']);
  app.watch(config.images.watch, ['images']);
});

/**
 * JavasScript Coding style
 */
app.task('jscs', function() {
  return app.src(config.javascripts.src + '**/*.js')
    .pipe($.jscs());
});

/**
 * Modernizr
 */
app.task('modernizr', function() {
  return app.src([
    config.javascripts.src + '**/*.js',
    config.stylesheets.dest + 'app.css'
  ])
    .pipe($.modernizr({
      excludeTests: ['hidden'],
      tests: [''],
      options: [
        'setClasses',
        'addTest',
        'html5printshiv',
        'testProp',
        'fnBind',
        'prefixed'
      ]
    }))
    .on('error', handleError)
    .pipe(app.dest(config.javascripts.dest));
});

/**
 * Concat and minify JavaScripts
 */
app.task('minifyScripts', function() {
  var headScripts = app.src([
    config.javascripts.dest + 'modernizr.js',
    config.javascripts.dest + 'head.js'
  ])
    .pipe($.concat('head.js'))
    .pipe($.uglify())
    .pipe(app.dest(config.javascripts.dest));

  var bottomScripts = app.src([
    'bower_components/jquery/dist/jquery.js',
    config.javascripts.dest + 'app.js'
  ])
    .pipe($.concat('app.js'))
    .pipe($.uglify())
    .pipe(app.dest(config.javascripts.dest));

  return merge(headScripts, bottomScripts);
});

/**
 * Inline <head> css/js
 */
app.task('inline', function() {
  return app.src([
    config.dest + '**/*.html'
  ], { base: config.dest })
    .pipe($.replace(inline({ matchFile: 'app.css' }), function() {
      return inline({ file: 'app.css' });
    }))
    .pipe($.replace(inline({ matchFile: 'head.js' }), function() {
      return inline({ file: 'head.js' });
    }))
    .pipe(app.dest(config.dest));
});

/**
 * Revision and remove unneeded files
 */
app.task('rev', function() {
  rimraf.sync(config.stylesheets.dest);
  rimraf.sync(config.javascripts.dest + 'head.js');
  rimraf.sync(config.javascripts.dest + 'modernizr.js');

  return app.src([
    config.dest + 'assets/{javascripts,images,fonts}/**'
  ])
    .pipe($.rev())
    .pipe(app.dest(config.dest + 'assets/'))
    .pipe(rmOriginalFiles())
    .pipe($.rev.manifest())
    .pipe(app.dest('./'));
});

/**
 * Update references
 */
app.task('updateReferences', function() {
  var manifest = app.src('./rev-manifest.json');

  return app.src([
    config.dest + '**'
  ], { base: config.dest })
    .pipe($.revReplace({
      manifest: manifest,
      replaceInExtensions: ['.js', '.css', '.html']
    }))
    .pipe(app.dest(config.dest));
});


/* ======
 * Main collected tasks
 * ====== */

var tasks = ['stylesheets', 'javascripts', 'images', 'fonts'];

app.task('build', ['jscs'], function() {
  rimraf.sync(config.dest);
  production = true;
  app.build(tasks.concat([
    'html',
    'modernizr',
    'minifyScripts',
    'inline',
    'rev',
    'updateReferences'
  ]), function() {});
});

app.task('default', ['build']);

app.task('dev', function() {
  rimraf.sync(config.dest);
  app.build(tasks.concat(['html', 'modernizr']), app.parallel(['server', 'watch']));
});


/* ======
 * Utilities
 * ====== */

function handleError(err) {
  $.util.log(err);
  $.util.beep();
  notifier.notify({
    title: 'Compile Error',
    message: err.message
  });
  return this.emit('end');
}

function inline(opts) {
  opts = opts || {};

  if (opts.matchFile) {
    if (opts.matchFile.match(/.js/)) {
      return new RegExp('<script(.*?)src="(.*?)'+opts.matchFile+'"(.*?)>(.*?)<\/script>');
    }
    return new RegExp('<link(.*?)href="(.*?)'+opts.matchFile+'"(.*?)>');
  }

  if (opts.file) {
    var content;
    var tagBegin = '<script>';
    var tagEnd = '</script>';

    if (opts.file.match(/.js/)) {
      content = fs.readFileSync(config.javascripts.dest + opts.file, 'utf8');
    } else {
      tagBegin = '<style>';
      tagEnd = '</style>';
      content = fs.readFileSync(config.stylesheets.dest + opts.file, 'utf8');
    }

    return tagBegin + content + tagEnd;
  }
}

var startTime, bundleLogger = {
  start: function(filepath) {
    startTime = process.hrtime();
    $.util.log('Bundling', $.util.colors.green(filepath));
  },
  end: function(filepath) {
    var taskTime = process.hrtime(startTime);
    var prettyTime = prettyHrtime(taskTime);
    $.util.log('Bundled', $.util.colors.green(filepath), 'after', $.util.colors.magenta(prettyTime));
  }
}

function rmOriginalFiles() {
  return through.obj(function(file, enc, cb) {

    if (file.revOrigPath) {
      fs.unlink(file.revOrigPath);
    }

    this.push(file);
    return cb();
  });
}

module.exports = app;
