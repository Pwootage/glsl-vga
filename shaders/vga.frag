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
    highp int c = int(cVec.a * 16.0 * 16.0);
//    highp float c = (cVec.a * 16.0 * 16.0 + cVec.b * 256.0 * 16.0);
    highp float fg = texture2D(textBuff, cell).a * 256.0;
    highp float bg = texture2D(textBuff, cell).a * 256.0;

    highp float tileS = (8.0/128.0);
    highp float tileX = float(c - ((c / 16) * 16)) * tileS;
    highp float tileY = float(c / 16) * tileS;
    highp float offX = fract(cell.x * width) * tileS;
    highp float offY = fract(cell.y * height) * tileS;
    highp vec4 p = texture2D(font, vec2(tileX + offX, tileY + offY));

    //rgba
//    gl_FragColor = vec4((offX + offY) / 2.0, 0, 0, 1);//vec4(1.0-dist, 0, 0, 1.0);
    gl_FragColor = p;
}