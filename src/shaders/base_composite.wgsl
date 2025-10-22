// Retrieve base, effects, and overlay textures
@group(0) @binding(0)
var base_texture: texture_2d<f32>;
@group(0) @binding(1)
var effects_texture: texture_2d<f32>;
@group(0) @binding(2)
var overlay_texture: texture_2d<f32>;

// Retrieve shared texture sampler
@group(0) @binding(3)
var texture_sampler: sampler;

// Vertex Output
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
}; 

// 
@vertex
fn vs_main(@builtin(vertex_index) vertex_index: u32) -> VertexOutput {
    var out: VertexOutput;
    
    switch (vertex_index) {
        case 0u: {
            out.position = vec4<f32>(-1.0, -1.0, 0.0, 1.0);
            out.uv = vec2<f32>(0.0, 0.0);
        }
        case 1u: {
            out.position = vec4<f32>( 3.0, -1.0, 0.0, 1.0);
            out.uv = vec2<f32>(2.0, 0.0);
        }
        case 2u: {
            out.position = vec4<f32>(-1.0,  3.0, 0.0, 1.0);
            out.uv = vec2<f32>(0.0, 2.0);
        }
        default: {
            out.position = vec4<f32>(0.0, 0.0, 0.0, 1.0);
            out.uv = vec2<f32>(0.0, 0.0);
        }
    }
    
    return out;
}

// Helper for blending
fn alpha_blend(base: vec4<f32>, over: vec4<f32>) -> vec4<f32> {
    let inv_alpha = 1.0 - over.a;
    let color = over.rgb * over.a + base.rgb * inv_alpha;
    let alpha = over.a + base.a * inv_alpha;
    return vec4<f32>(color, alpha);
}

//
@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let base_color = textureSample(base_texture, texture_sampler, in.uv);
    var out_color = base_color;

    let effects_color = textureSample(effects_texture, texture_sampler, in.uv);
    if (effects_color.a > 0.001) {
        out_color = alpha_blend(out_color, effects_color);
    }
    
    let overlay_color = textureSample(overlay_texture, texture_sampler, in.uv);
    if (overlay_color.a > 0.001) {
        out_color = alpha_blend(out_color, overlay_color);
    }

    return out_color;
}