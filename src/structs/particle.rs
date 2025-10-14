use crate::Color;
use crate::structs::math::Vector2D;

#[derive(Debug, Clone)]
pub struct Particle {
    pub handle: u16,
    pub id: u16,
    pub category: u16,
    pub name: String,
    pub color: Color,
    pub position: Vector2D,
    pub index: i32,
}

impl Particle {}
