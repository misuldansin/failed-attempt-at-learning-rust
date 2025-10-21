#[derive(Debug, Clone, Copy)]
pub struct Vector2D {
    pub x: i32,
    pub y: i32,
}
impl Vector2D {
    pub fn new(x: i32, y: i32) -> Vector2D {
        return Vector2D { x: x, y: y };
    }
}

pub fn lerp_f32(a: f32, b: f32, t: f32) -> f32 {
    // Interpolation formula: a + (b - a) * t
    return a + (b - a) * t;
}
