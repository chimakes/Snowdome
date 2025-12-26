uniform float uSize;

attribute float aSize;
attribute float aTextureIndex;

varying float vCol;
varying float vRow;
varying float vYPosition;

void main()
{
    float index = aTextureIndex;

    float col = mod(index, 2.0);
    float row = floor(index/ 2.0);

    // Final position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;

    gl_PointSize = uSize * aSize;
    gl_PointSize *= 1.0 / - viewPosition.z;

    vCol = col;
    vRow = row;
    vYPosition = position.y;
}