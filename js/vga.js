angular.module("vga").directive('vgaBuffer', function() {
  return {
    templateUrl: "partials/vga.html",
    restrict: "E",
    scope: {
      buffer: "="
    },
    controller: function($scope, $element, $http, $q) {
      var canvasEle = $element.find("canvas");
      var vgaBuffer = new VGABuffer(canvasEle, $http, $q);
      canvasEle.ready(function() {
        vgaBuffer.init();
        vgaBuffer.clear();
      });
    }
  };
});

function VGABuffer(canvas, $http, $q) {
  var VGA_WIDTH = 80;
  var VGA_HEIGHT = 60;
  var BUFF_WIDTH = 128; //Powers of 2
  var BUFF_HEIGHT = 64;

  var self = this;
  self.canvas = canvas;
  self.gl = undefined;
  self.sqBuff = undefined;
  self.shader = undefined;
  self.fragShader = undefined;
  self.vertShader = undefined;

  self.textBuffer = undefined;
  self.fgBuffer = undefined;
  self.bgBuffer = undefined;

  self.textBufferBytes = undefined;
  self.fgBufferBytes = undefined;
  self.bgBufferBytes = undefined;

  self.textTexture = undefined;
  self.fgTexture = undefined;
  self.bgTexture = undefined;


  this.init = function() {
    try {
      self.gl = canvas[0].getContext("webgl") || canvas[0].getContext("experimental-webgl");
    } catch (e) {
    }

    if (!self.gl) {
      alert("No WebGL :(");
      return;
    }

    //Basic GL init
    var gl = self.gl;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    //gl.enable(gl.TEXTURE_2D);

    //Auto-resize
    canvas.on("resize", function() {
      gl.viewport(0, 0, canvas[0].width, canvas[0].height);
    });

    //The square buffer that covers the entire screen
    self.sqBuff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, self.sqBuff);
    var vertices = [
      1.0, 1.0, 0.0,
      0.0, 1.0, 0.0,
      1.0, 0.0, 0.0,
      0.0, 0.0, 0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    //Promises to wait for
    var toWaitFor = [];

    //Setup buffers
    self.textBuffer = new Uint16Array(BUFF_WIDTH * BUFF_HEIGHT);
    self.fgBuffer = new Uint16Array(BUFF_WIDTH * BUFF_HEIGHT);
    self.bgBuffer = new Uint16Array(BUFF_WIDTH * BUFF_HEIGHT);

    var str = "a-";
    for (var x = 1; x < VGA_WIDTH - 1; x++) {
      for (var y = 1; y < VGA_HEIGHT - 1; y++) {
        self.textBuffer[x + y * BUFF_WIDTH] = str.charCodeAt((x + y % 2) % str.length);
        self.fgBuffer[x + y * BUFF_WIDTH] = 15; //White
        self.bgBuffer[x + y * BUFF_WIDTH] = 0; //Black
      }
    }

    self.textTexture = gl.createTexture();
    self.fgTexture = gl.createTexture();
    self.bgTexture = gl.createTexture();

    self.pushBuffers();

    //Load shaders
    var shaderFuture = $http.get("shaders/vga.frag");
    toWaitFor.push(shaderFuture);
    shaderFuture.success(function(data) {
      self.fragShader = createShader(data, gl.FRAGMENT_SHADER);
    });
    shaderFuture = $http.get("shaders/vga.vert");
    toWaitFor.push(shaderFuture);
    shaderFuture.success(function(data) {
      self.vertShader = createShader(data, gl.VERTEX_SHADER);
    });

    $q.all(toWaitFor).then(function(data) {
      //Finish shader setup
      self.shader = gl.createProgram();
      gl.attachShader(self.shader, self.fragShader);
      gl.attachShader(self.shader, self.vertShader);
      gl.linkProgram(self.shader);
      if (!gl.getProgramParameter(self.shader, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program.");
      }

      gl.useProgram(self.shader);

      function loc(name) {
        return gl.getUniformLocation(self.shader, name);
      }

      gl.enableVertexAttribArray(gl.getAttribLocation(self.shader, "aVertexPosition"));

      gl.uniform1i(loc("font"), 0);
      gl.uniform1i(loc("textBuff"), 1);
      gl.uniform1i(loc("fgBuff"), 2);
      gl.uniform1i(loc("bgBuff"), 3);

      //8:640 = n:1
      function updateRatioUniforms() {
        var hRatio = VGA_WIDTH / BUFF_WIDTH;
        var vRatio = VGA_HEIGHT / BUFF_HEIGHT;
        gl.uniform1f(loc("width"), VGA_WIDTH / BUFF_WIDTH);
        gl.uniform1f(loc("height"), VGA_HEIGHT / BUFF_HEIGHT);
      }
      updateRatioUniforms();
      canvas.on("resize", updateRatioUniforms());

      //Begin main render loop
      self.startLoop();
    });
  };

  this.clear = function() {
    self.gl.clear(self.gl.COLOR_BUFFER_BIT);
  };

  this.update = function() {
    self.clear();

    var gl = self.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, self.sqBuff);
    gl.vertexAttribPointer(self.sqBuff, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  this.startLoop = function() {
    self.update();
  };

  this.pushBuffers = function() {
    var gl = self.gl;

    function push(tex, texID, img) {
      gl.activeTexture(texID);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, BUFF_WIDTH, BUFF_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_SHORT_4_4_4_4, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    }

    push(self.textTexture, gl.TEXTURE1, self.textBuffer);
    push(self.fgTexture, gl.TEXTURE2, self.fgBuffer);
    push(self.bgTexture, gl.TEXTURE3, self.bgBuffer);
  };

  function createShader(src, type) {
    var gl = self.gl;
    var ret = gl.createShader(type);
    gl.shaderSource(ret, src);
    gl.compileShader(ret);
    if (!gl.getShaderParameter(ret, gl.COMPILE_STATUS)) {
      console.log("An error occurred compiling the shaders:");
      console.log(gl.getShaderInfoLog(ret));
      return null;
    }
    return ret;
  }
}