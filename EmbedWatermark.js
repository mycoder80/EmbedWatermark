#!/usr/bin/env node
/*
 * Add a watermark to the input picture file.
 */
var fs = require('fs');
var cheerio = require('cheerio');
var phantom = require('phantom');
var gm = require('gm');

function getFileExt(path) {
  var parts = path.split('.');
  return parts[parts.length - 1];
}

function getFileName(path) {
  return path.split('.')[0];
}

var content = '<html> \
  <head> \
    <style type="text/css"> \
      div.imageSub { position: relative; } \
      div.imageSub img { z-index: 1; } \
      div.imageSub div { \
        position: absolute; \
        left: 15%; \
        right: 15%; \
        bottom: 0; \
        padding: 4px; \
        height: 16px; \
        line-height: 16px; \
        text-align: center; \
        overflow: hidden; \
      } \
      div.imageSub div.label { \
        z-index: 3; \
        color: black; \
        text-align: right; \
        font-size: x-large; \
        opacity: 0.4; \
      } \
    </style> \
  </head> \
  <body style="margin:0px"> \
  </body> \
</html>';

var generatePage = function(watermarkText, inputFilePath) {
  $ = cheerio.load(content);
  var container = '<span id="container" style="border: 1px solid black; float:left; overflow:hidden;"></div>';
  $('body').append(container);

  var imageSubDiv = '<div class="imageSub"> <!-- Put Your Image Width --> </div>';
  $('#container').append(imageSubDiv);

  var image0 = '<image src="' + inputFilePath  + '" />';
  $('.imageSub').append(image0);

  var label = '<div class="label">' + watermarkText + '</div>';
  $('.imageSub').append(label);

  var outputFilePath = inputFilePath + '.html';
  fs.writeFileSync(outputFilePath, $.html());
  
  return outputFilePath;
}

var snapshot = function(watermarkText, inputFilePath) {
  getImageSize(inputFilePath, function(err, size) {
    var htmlPagePath = generatePage(watermarkText, inputFilePath);
    var extension = '.jpg';
    var outputFilePath = getFileName(htmlPagePath) + '_wm' + extension;
    phantom.create(function(ph) {
      ph.createPage(function(page) {
        page.set('viewportSize', {width:size.width,height:size.height})
        page.open(htmlPagePath, function(status) {
          page.render(outputFilePath, function() {
            ph.exit();
          });
        });
      });
    });
  });
}

var getImageSize = function(inputFilePath, callback) {
  var imageMagick = gm.subClass({ imageMagick: true});
  imageMagick(inputFilePath).size(function (err, size) {
    if (err) {
      throw err;
    }
    console.log('width = ' + size.width);
    console.log('height = ' + size.height);
    callback(err, size);
  });
}

if (require.main == module) {
  console.log('Invoked at command line.');
  if (process.argv.length < 4) {
    console.log("Usage: node EmbedWatermark.js <watermark text> <input file path> [output file path]");
    process.kill();
  }
  var watermarkText = process.argv[2];
  var inputFilePath = process.argv[3];

  snapshot(watermarkText, inputFilePath);
} else {
  console.log('Invoked via library call');
}

exports.generatePage = generatePage;
