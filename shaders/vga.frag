#version 100

varying highp vec2 pos;


uniform highp float hRatio;
uniform highp float vRatio;
uniform highp float width;
uniform highp float height;

uniform sampler2D font;
uniform sampler2D textBuff;
uniform sampler2D fgBuff;
uniform sampler2D bgBuff;

void main(void) {
    highp vec2 cell = vec2(pos.x * hRatio, pos.y * vRatio);

    highp vec4 cVec = texture2D(textBuff, cell);
    highp float c = (cVec.a * 256.0 + cVec.b * 65536.0);
    highp float fg = texture2D(textBuff, cell).a * 256.0;
    highp float bg = texture2D(textBuff, cell).a * 256.0;

    highp float tileS = (8.0/128.0);
    highp float tileX = floor(c / 16.0) * tileS;
    highp float tileY = (3.0) * tileS;//floor(mod(c, 16.0)) * tileS;
    highp float offX = fract(cell.x * width) * tileS;
    highp float offY = fract(cell.y * height) * tileS;
    highp vec4 p = texture2D(font, vec2(tileX + offX, tileY + offY));

    //rgba
//    gl_FragColor = vec4((offX + offY) / 2.0, 0, 0, 1);//vec4(1.0-dist, 0, 0, 1.0);
    gl_FragColor = p;
}