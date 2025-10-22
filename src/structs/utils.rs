// --------- Structs ---------

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

pub struct Pixel {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: u8,
    pub index: usize,
}
impl Pixel {
    pub fn from_rgba(r: u8, g: u8, b: u8, a: u8, index: usize) -> Pixel {
        return Pixel { r, g, b, a, index };
    }

    pub fn from_raw(raw_color: u32, index: usize) -> Pixel {
        let r: u8 = ((raw_color >> 24) & 0xFF) as u8;
        let g: u8 = ((raw_color >> 16) & 0xFF) as u8;
        let b: u8 = ((raw_color >> 08) & 0xFF) as u8;
        let a: u8 = ((raw_color >> 00) & 0xFF) as u8;
        return Pixel { r, g, b, a, index };
    }
}

// --------- Helper Functions ---------
