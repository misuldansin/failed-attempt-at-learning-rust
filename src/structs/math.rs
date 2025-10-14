#[derive(Debug, Clone)]
pub struct Vector2D {
    x: i32,
    y: i32,
}

pub fn lerp_f32(a: f32, b: f32, t: f32) -> f32 {
    // Interpolation formula: a + (b - a) * t
    return a + (b - a) * t;
}
