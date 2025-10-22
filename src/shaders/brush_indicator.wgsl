struct Brush {
    center: vec2<f32>, 
    radius: f32,       
    _padding: f32,
};

@group(0) @binding(0)
var<uniform> brush: Brush; 

let INDICATOR_COLOR: vec4<f32> = vec4<f32>(0.506, 0.506, 0.506, 1.0);

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let uv = in.uv;

    let LINE_WIDTH_NORMALIZED = 0.005;

    let distance_to_center = distance(uv, brush.center); 
    let d = abs(distance_to_center - brush.radius);
    let delta = fwidth(d); 
    let line_half = LINE_WIDTH_NORMALIZED * 0.5;
    let final_alpha = 1.0 - smoothstep(line_half - delta, line_half, d);
    return vec4<f32>(INDICATOR_COLOR.rgb, final_alpha);
}