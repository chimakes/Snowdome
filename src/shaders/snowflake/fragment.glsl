uniform sampler2D uTexture;
uniform float uFadeStart;
uniform float uFadeEnd;

varying float vCol;
varying float vRow;
varying float vYPosition;

void main()
{
    vec2 uv = gl_PointCoord;
    
    float cols = 2.0;
    float rows = 2.0;

    vec2 size = vec2(1.0 / cols, 1.0 / rows);

    // move UV into atlas cell
    uv *= size;
    uv.x += vCol * size.x;
    uv.y += vRow * size.y;

    // opacity
    float opacity = smoothstep(uFadeEnd, uFadeStart, vYPosition);
        
    vec4 textureColor = texture(uTexture, uv);

    // Final color
    gl_FragColor = vec4(textureColor.rgb, textureColor.a * opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}