use crate::structs::particle::Particle;
pub trait RendererInterface {
    fn width(&self) -> usize;
    fn height(&self) -> usize;

    fn render_frame(&mut self);
    fn process_queued_particles(&mut self);
    fn queue_particles(&mut self, particles_to_queue: &[Particle]);
}
