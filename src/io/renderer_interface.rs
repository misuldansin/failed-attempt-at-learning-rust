use crate::structs::particle::Particle;
use crate::structs::utils::Pixel;

pub trait RendererInterface {
    fn queue_particles(&mut self, particles_to_queue: &[Particle]);
    fn queue_debug_overlay_pixels(&mut self, pixels_to_queue: Vec<Pixel>);
    fn render_frame(&mut self);
}
