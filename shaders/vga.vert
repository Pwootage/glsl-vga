attribute vec3 aVertexPosition;

//uniform mat4 uMVMatrix;
//uniform mat4 uPMatrix;

varying highp vec2 pos;

void main(void) {
 //gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
 vec4 tmp = (vec4(aVertexPosition, 1.0) - vec4(0.5,0.5,0,0)) * vec4(2,2,1,1);
 gl_Position = tmp;
 pos = vec2(aVertexPosition.x, aVertexPosition.y);
}