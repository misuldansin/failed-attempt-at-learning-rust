use crate::structs::color::Color;
use crate::structs::math::Vector2D;
use crate::structs::particle_data::ParticleData;
use rand::{Rng, random};

#[derive(Debug, Clone)]
pub struct Particle {
    pub handle: u32,
    pub id: u16,
    pub category: u16,
    pub name: String,
    pub color: Color,
    pub position: Vector2D,
    pub index: u32,
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
            category: particle_data.category,
            name: particle_data.name.clone(),
            color: final_color,
            position: Vector2D::new(x, y),
            index: 0,
        };
        return new_particle;
    }
}
