/* ========================================
 * Rebirth
 * ======================================== */

const _ = require('underscore.string')
const chalk = require('chalk')
const Generator = require('yeoman-generator')
const moment = require('moment')
const mkdirp = require('mkdirp')
const path = require('path')
const yosay = require('yosay')

function copy(source, destination, generator) {
  generator.fs.copyTpl(
    generator.templatePath(source),
    generator.destinationPath(destination),
    generator
  )
}

class Rebirth extends Generator {
  constructor(args, opts) {
    super(args, opts)
    this.pkg = require('../../package.json')
    this.generatorDate = moment().format('D.M.YYYY')
    this.generatorRepository = this.pkg.repository

    this.argument('dir', {
      desc: 'Your project folder',
      required: true,
      type: String
    })

    this.option('project', {
      defaults: 'typo3',
      type: String
    })

    this.option('docker', {
      defaults: true,
      type: String
    })

    this.typo3 = this.options.project === 'typo3'
    this.wp = this.options.project === 'wordpress'
    this.html = this.options.project === 'html'
    this.cms = this.typo3 || this.wp
    this.docker = (this.options.docker === true || this.options.docker === 'true') && !this.html

    this.name = () => {
      if (this.typo3) { return 'TYPO3' }
      else if (this.wp) { return 'WordPress' }
      else { return 'Html' }
    }

    /**
     * Setup proper install directory
     */
    this.dir = this.options.dir.toLowerCase()

    if (this.typo3) {
      let extension = _.underscored(this.dir).replace(/_/g, '')

      if (this.docker) {
        this.destinationRoot(`${extension}-docker/${extension}`)
      } else {
        this.destinationRoot(extension)
      }

      this.dir = extension
    }

    if (this.wp) {
      if (this.docker) { this.destinationRoot(`${this.dir}-docker/${this.dir}`) }
      else { this.destinationRoot(this.dir) }
    }

    if (this.html) {
      this.destinationRoot(this.dir)
    }
  }

  prompts() {
    this.log(yosay(`Hi! Welcome to ${chalk.blue('Rebirth')}. Let's create a ${chalk.green(this.name())} project!`))

    const prompts = [
      {
        type: 'input',
        name: 'name',
        message: 'Project name:',
        default: path.basename(process.cwd())
      }, {
        when: props => {
          const deeperDir = this.docker ? `${this.dir}-docker/` : ''
          const installPath = this.docker ? `${this.dir}-docker/` : this.dir

          if (this.typo3) {
            this.log(`${chalk.green('  ❯')} Install path: ${chalk.cyan('./' + installPath)}`)
            this.log(`${chalk.green('  ❯')} Extension key: ${chalk.cyan(this.dir)}`)
            this.log(`${chalk.green('  ❯')} Extension path: ${chalk.cyan('./' + deeperDir + this.dir)}`)

            if (this.docker) {
              this.log(`${chalk.green('  ❯')} TYPO3 path: ${chalk.cyan('./' + deeperDir + 'typo3')}`)
            }
          } else if (this.wp) {
            this.log(`${chalk.green('  ❯')} Install path: ${chalk.cyan('./' + installPath)}`)
            this.log(`${chalk.green('  ❯')} Theme path: ${chalk.cyan('./' + deeperDir + this.dir)}`)

            if (this.docker) {
              this.log(`${chalk.green('  ❯')} WordPress path: ${chalk.cyan('./' + deeperDir + 'wp')}`)
            }
          } else {
            this.log(`${chalk.green('  ❯')} Install path: ${chalk.cyan('./' + this.dir)}`)
            this.log(`${chalk.green('  ❯')} Source path: ${chalk.cyan('./' + this.dir + '/src/')}`)
            this.log(`${chalk.green('  ❯')} Build path: ${chalk.cyan('./' + this.dir + '/dist/')}`)
          }
        }
      }, {
        type: 'input',
        name: 'author',
        message: 'Author name:',
        default: this.user.git.name() ? this.user.git.name() : 'Author'
      }, {
          type: 'input',
          name: 'appNameSpace',
          message: 'Project namespace:',
          default: 'App',
          when: () => this.cms
      }, {
        type: 'input',
        name: 'url',
        message: 'Project URL (production):',
        default: props => `http://${_.dasherize(_.slugify(props.name))}.com`
      }, {
        type: 'input',
        name: 'description',
        message: 'Project description:',
        default: props => `Website for ${_.humanize(props.name)}`
      }, {
        type: 'confirm',
        name: 'pluginWPML',
        message: 'Install WPML?:',
        default: false,
        when: () => this.wp && this.docker
      }, {
        when: () => {
          if (this.wp && this.docker) {
            this.log(`${chalk.green('!')} ACF subscription key can be found from ${chalk.underline.yellow('https://www.advancedcustomfields.com/my-account/')}`)
          }
        }
      }, {
        type: 'input',
        name: 'pluginACFkey',
        message: 'ACF key (leave empty for not installing):',
        default: false,
        when: () => this.wp && this.docker
      }
    ]

    return this.prompt(prompts).then(props => {
      this.appName = props.name
      this.appNameDasherize = _.dasherize(_.slugify(props.name))
      this.appNameHumanize = _.humanize(this.appNameDasherize)
      this.appNameUnderscored = _.underscored(this.appNameDasherize)
      this.appNamePascalize = _.capitalize(_.camelize(this.appNameDasherize))
      this.appAuthor = props.author
      this.appAuthorDasherize = _.dasherize(_.slugify(this.appAuthor))
      this.appNameSpace = _.capitalize(_.camelize(props.appNameSpace))
      this.appURL = props.url
      this.appDescription = props.description
      this.dirCapitalize = _.capitalize(this.dir)
      this.git = props.git
      this.pluginWPML = props.pluginWPML
      this.pluginACFkey = props.pluginACFkey
    })
  }

  setup() {
    if (this.typo3) { this.config.set('assetsPath', 'Assets/') }
    if (this.html) { this.config.set('assetsPath', 'src/assets/') }
    if (this.wp) { this.config.set('assetsPath', 'assets/') }
  }

  copySharedFiles() {
    copy(`shared/_README.md`, `README.md`, this)
    copy(`shared/_gitignore`, `.gitignore`, this)
    copy(`shared/_dploy.example.yaml`, `dploy.example.yaml`, this)
    copy(`shared/_dploy.example.yaml`, `dploy.yaml`, this)
    copy(`shared/editorconfig`, `.editorconfig`, this)
    copy(`shared/eslintrc`, `.eslintrc`, this)
    copy(`shared/_bower.json`, `bower.json`, this)
  }

  assets() {
    const assetsDir = this.templatePath('../../../node_modules/rebirth-ui/src/')

    const assets = [
      'components/elements/Container/',
      'components/elements/Heading/',
      'components/elements/Icon/',
      'components/elements/IeFrame/',
      'components/elements/Text/',
      'components/elements/Width/',
      'components/elements/Wrap/',
      'components/collections/Grid/_Grid.scss',
      'components/layouts/Footer/',
      'components/layouts/Header/',
      'components/layouts/Page/',
      'stylesheets/generic/',
      'stylesheets/helpers/_helper.scss',
      'stylesheets/mixins/',
      'stylesheets/vendors/_normalize.scss',
      '_config.scss',
      'config.js'
    ].forEach(file => {
      copy(`${assetsDir}${file}`, `${this.config.get('assetsPath')}${file}`, this)
    })

    copy(`shared/assets/components/collections/Grid/`, `${this.config.get('assetsPath')}components/collections/Grid/`, this)
    copy(`shared/assets/_app.head.js`, `${this.config.get('assetsPath')}app.head.js`, this)
    copy(`shared/assets/app.js`, `${this.config.get('assetsPath')}app.js`, this)
    copy(`shared/assets/app.scss`, `${this.config.get('assetsPath')}app.scss`, this)

    mkdirp(`${this.config.get('assetsPath')}javascripts`)
    mkdirp(`${this.config.get('assetsPath')}images`)
    mkdirp(`${this.config.get('assetsPath')}fonts`)
  }

  typo3() {
    if (this.typo3) {
      copy(`typo3/_package.json`, `package.json`, this)
      copy(`typo3/_gulpfile.js`, `gulpfile.js`, this)
      copy(`typo3/Configuration/TypoScript/_setup.txt`, `Configuration/TypoScript/setup.txt`, this)
      copy(`typo3/Resources/Private/Templates/Page/_HomePage.html`, `Resources/Private/Templates/Page/HomePage.html`, this)
      copy(`typo3/Resources/Private/Partials/_Top.html`, `Resources/Private/Partials/Top.html`, this)
      copy(`typo3/Resources/Private/Partials/_Bottom.html`, `Resources/Private/Partials/Bottom.html`, this)
      copy(`typo3/_ext_emconf.php`, `ext_emconf.php`, this)
      copy(`typo3/_ext_tables.php`, `ext_tables.php`, this)
      copy(`typo3/typo3/_composer.json`, `typo3/composer.json`, this)
      copy(`typo3/Resources/Private/Layouts/App.html`, `Resources/Private/Layouts/App.html`, this)

      if (this.docker) {
        copy(`typo3/docker/_gitignore`, `../.gitignore`, this)
        copy(`typo3/docker/_install.sh`, `../install.sh`, this)
        copy(`typo3/docker/_Makefile`, `../Makefile`, this)
        copy(`typo3/docker/_docker-compose.yml`, `../docker-compose.yml`, this)
        copy(`typo3/docker/Dockerfile`, `../Dockerfile`, this)
        copy(`shared/gitkeep`, `../database/.gitkeep`, this)
      }
    }
  }

  html() {
    if (this.html) {
      copy(`html/_package.json`, `package.json`, this)
      copy(`html/_assemblefile.js`, `assemblefile.js`, this)
      copy(`html/src/_app.json`, `src/app.json`, this)
      copy(`html/src/templates/_index.hbs`, `src/templates/index.hbs`, this)
      copy(`html/src/partials/bottom.hbs`, `src/partials/bottom.hbs`, this)
      copy(`html/src/helpers/assets.js`, `src/helpers/assets.js`, this)
      copy(`html/src/layouts/default.hbs`, `src/layouts/default.hbs`, this)
      copy(`'html/src/partials/top.hbs`, `src/partials/top.hbs`, this)
    }
  }

  wp() {
    if (this.wp) {
      copy(`wordpress/_package.json`, `package.json`, this)
      copy(`wordpress/_gulpfile.js`, `gulpfile.js`, this)
      copy(`wordpress/_functions.php`, `functions.php`, this)
      copy(`wordpress/lib/_clean-up.php`, `lib/clean-up.php`, this)
      copy(`wordpress/lib/_cpt-name.php`, `lib/cpt-name.php`, this)
      copy(`wordpress/lib/_NavWalker.php`, `lib/NavWalker.php`, this)
      copy(`wordpress/lib/_sc-name.php`, `lib/sc-name.php`, this)
      copy(`wordpress/lib/_setup.php`, `lib/setup.php`, this)
      copy(`wordpress/lib/_utils.php`, `lib/utils.php`, this)
      copy(`wordpress/_index.php`, `index.php`, this)
      copy(`wordpress/_style.css`, `style.css`, this)
      copy(`wordpress/wp/_composer.json`, `wp/composer.json`, this)
      copy(`wordpress/header.php`, `header.php`, this)
      copy(`wordpress/footer.php`, `footer.php`, this)
      copy(`wordpress/partials`, `partials`, this)

      if (this.pluginACFkey) {
        mkdirp('acf-json')
        copy(`wordpress/lib/_utils-acf.php`, `lib/utils-acf.php`, this)
      }

      if (this.pluginWPMLuserID) {
        mkdirp('languages')
      }

      if (this.docker) {
        copy(`wordpress/docker/_README.md`, `../README.md`, this)
        copy(`wordpress/docker/_gitignore`, `../.gitignore`, this)
        copy(`wordpress/docker/_docker-compose.yml`, `../docker-compose.yml`, this)
        copy(`wordpress/docker/_docker-compose.override.yml`, `../docker-compose.override.yml`, this)
        copy(`wordpress/docker/_wp-config.development.php`, `../wp-config.development.php`, this)
        copy(`wordpress/docker/_install.sh`, `../install.sh`, this)
        copy(`wordpress/docker/_Makefile`, `../Makefile`, this)
      }
    }
  }

  _installDocker() {
    // this.spawnCommandSync('./install.sh', [''], { cwd: '../' })
    this._git()
  }

  install() {
    this.installDependencies({
      skipInstall: this.options['skip-install'],
      callback: () => {
        if (!this.options['skip-install']) {
          if (this.docker) {
            this._installDocker()
          } else {
            this._git()
          }
        } else {
          this._git()
        }
      }
    })
  }

  _git() {
    const done = this.async()

    this.spawnCommandSync('git', ['init'])
    this.spawnCommandSync('git', ['add', '-A'])
    this.spawnCommandSync('git', ['commit', '-m', 'init'])

    if (this.docker) {
      this.spawnCommandSync('git', ['init'], { cwd: '../' })
      this.spawnCommandSync('git', ['submodule', 'add', `git@bitbucket.org:
        ${this.appAuthorDasherize}/${this.dir}.git`, this.dir], { cwd: '../' })
      this.spawnCommandSync('git', ['add', '-A'], { cwd: '../' })
      this.spawnCommandSync('git', ['commit', '-m', 'init'], { cwd: '../' })
    }

    done()
    this._end()
  }

  _end() {
    this.log(`\n  ====================================================================== \n`)
    this.log(`${chalk.green('  !')} ${chalk.bold('Project details')}`)
    this.log(`${chalk.green('  ❯')} Name: ${chalk.cyan(this.appName)}`)
    this.log(`${chalk.green('  ❯')} Description: ${chalk.cyan(this.appDescription)}`)
    this.log(`${chalk.green('  ❯')} Author: ${chalk.cyan(this.appAuthor)}`)
    this.log(`${chalk.green('  ❯')} Type: ${chalk.cyan(this.name())}`)
    this.log(`${chalk.green('  ❯')} Production URL: ${chalk.cyan(this.appURL)}`)

    if (this.docker) {
      this.log(`\n`)
      this.log(`${chalk.green('  !')} Your Docker containers are up and running. See points ${chalk.bold('3.')} and ${chalk.bold('4.')} in \n ${chalk.cyan('    README.md')} to finish your setup.`)
    }

    this.log(`${chalk.green('  !')} Please read every ${chalk.cyan('README.md')} for instructions and available commands.`)
    this.log(`${chalk.green('  !')} Make sure all the settings such as git urls are correctly generated.`)
    this.log(`${chalk.green('  ! Happy developing! :)')}`)
    this.log(`\n  ====================================================================== \n`)
  }
}

module.exports = Rebirth
