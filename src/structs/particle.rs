use crate::structs::color::Color;
use crate::structs::math::Vector2;
use crate::structs::particle_data::ParticleData;
use rand::{Rng, random};

#[derive(Debug, Clone)]
pub struct Particle {
    pub handle: u32,
    pub id: u16,
    pub name: String,
    pub category: u16,
    pub color: Color,
    pub position: Vector2<i32>,
    pub index: u32,
    pub is_movable: bool,
    pub density: f32,
}

impl Particle {
    pub fn new(particle_data: &ParticleData, x: i32, y: i32, handle: u32) -> Particle {
        // Get a random number between 0 and 1 for lerp alpha
        let alpha: f32 = rand::rng().random_range(0.0..1.0);

        // Quantize alpha to the nearest discrete 6 steps
        let resolution: f32 = 6.0;
        let steps: f32 = resolution - 1.0;
        let t: f32 = (alpha * steps).round() / steps;

        // Get a color for this particle between it's base and variant colors based on the random alpha
        let final_color: Color = Color::lerp_hex(&particle_data.base_color, &particle_data.variant_color, t);

        // Create and return particle struct
        let new_particle: Particle = Particle {
            handle: handle,
            id: particle_data.id,
            name: particle_data.name.clone(),
            category: particle_data.category,
            color: final_color,
            position: Vector2::<i32>::new(x, y),
            index: 0,
            is_movable: particle_data.is_movable,
            density: particle_data.density,
        };
        return new_particle;
    }
}
