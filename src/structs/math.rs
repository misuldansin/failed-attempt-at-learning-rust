#[derive(Debug, Clone, Copy)]
pub struct Vector2<T> {
    pub x: T,
    pub y: T,
}
impl<T> Vector2<T> {
    pub fn new(x: T, y: T) -> Vector2<T> {
        return Vector2 { x: x, y: y };
    }
}

#[derive(Debug, Clone, Copy)]
pub struct Offset2<T> {
    pub dx: T,
    pub dy: T,
}
impl<T> Offset2<T> {
    pub fn new(dx: T, dy: T) -> Offset2<T> {
        return Offset2 { dx: dx, dy: dy };
    }
}

pub fn lerp_f32(a: f32, b: f32, t: f32) -> f32 {
    // Interpolation formula: a + (b - a) * t
    return a + (b - a) * t;
}
