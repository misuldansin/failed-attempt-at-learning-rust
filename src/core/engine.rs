use crate::io::native_renderer::NativeRenderer;
use crate::io::renderer_interface::RendererInterface;
use crate::structs::{grid::Grid, particle::Particle};

pub struct Engine {
    pub game_width: usize,
    pub game_height: usize,
    pub current_grid: Grid,
}

impl Engine {
    pub fn new(game_width: usize, game_height: usize, renderer: &mut dyn RendererInterface) -> Engine {
        let mut new_engine = Engine {
            game_width,
            game_height,
            current_grid: Grid::new(game_width as u16, game_height as u16),
        };

        // Populate the grid with empty particles
        const EMPTY_PARTICLE_ID: u16 = 0;
        new_engine.current_grid.populate(EMPTY_PARTICLE_ID);

        // Queue grid to be rendered
        renderer.queue_particles(&new_engine.current_grid.data);

        return new_engine;
    }

    pub fn step_physics(&mut self) {
        // ..step physics
        // ..queue dirty particles
    }
}
