# <%= appNameHumanize %>

> <%= appDescription %>. Generated on <%= (generatorDate) %> with [<%= pkg.name %> v<%= pkg.version %>](<%= (generatorRepository) %>).

## Project information<% if (typo3) { %> 
* Extension key: `<%= dir %>`
* Flux extension key: `<%= appNameSpace %>.<%= dirCapitalize %>`<% } %>

Please read [My Web Starter Kit](https://bitbucket.org/mediasignal/my-web-starter-kit) guide.

## Requirements
<% if (typo3) { %>* [Typo3](http://typo3.org)
* [Flux](http://typo3.org/extensions/repository/view/flux)
* [Fluid Pages Engine](http://typo3.org/extensions/repository/view/fluidpages)
* [Fluid Content Engine](http://typo3.org/extensions/repository/view/fluidcontent)
* [Vhs](http://typo3.org/extensions/repository/view/vhs)<% } if (wp) { %> 
* [WordPress](https://wordpress.org/)<% if (pluginACFkey) { %>
* [Advanced Custom Fields Pro](http://www.advancedcustomfields.com/pro/)<% }} if (typo3 || wp) { %>
* [Composer](https://getcomposer.org/)<% } %>
* [Node.js](http://nodejs.org/)
* [Npm](https://www.npmjs.org/)
* [Bower](http://bower.io/)

## Install

**1.** Clone this repository<% if (typo3) { %> to `<%= dir %>` folder<% } %>

**2.** Install node modules
  
    npm install

**3.** Install bower packages
  
    bower install

## Usage

* `npm run build`: Build the application
* `npm run deploy`: Build the application and deploy it to the server<% if (html) { %>* `npm run dist`: Build the application and start a local server for testing purposes<% } %>
* `npm run dev`: Watches files and sets up development environment.
    *  `--host=yourlocalhost.app`: You can also assign your custom host for the BrowserSync<% if (docker) { %>

## Docker development environment 

If you are using GNU/Linux/Unix with Docker you are in luck! Could also work in Windows but not tested (Author, please make sure the following link is correct).

[<%= dir %>-docker](https://@bitbucket.org:<%= appAuthorDasherize %>/<%= dir %>-docker.git)

<% } %>
---

Learn more about the extension and the project structure in [My Web Starter Kit](https://bitbucket.org/mediasignal/my-web-starter-kit/src/master/docs/project/README.md)
