#version 100

varying highp vec2 pos;

uniform highp float width;
uniform highp float height;

uniform sampler2D font;
uniform sampler2D textBuff;
uniform sampler2D fgBuff;
uniform sampler2D bgBuff;

void main(void) {
    //lowp float dist = pos.x * pos.x + pos.y * pos.y;

    highp vec2 cell = vec2(pos.x * width, pos.y * height);

    highp vec4 textKey = texture2D(textBuff, cell);

    highp float v = textKey.b;

    gl_FragColor = vec4(textKey.a, textKey.g, textKey.b, 1);//vec4(1.0-dist, 0, 0, 1.0);
}