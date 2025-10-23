use crate::io::native_renderer::NativeRenderer;
use crate::io::renderer_interface::RendererInterface;
use crate::structs::color::Color;
use crate::structs::input_state::InputState;
use crate::structs::utils::{Offset2, Pixel, Vector2};
use crate::structs::{grid::Grid, particle::Particle};

use rand::seq::SliceRandom;
use rand::thread_rng;

pub struct Engine {
    pub game_width: usize,
    pub game_height: usize,
    pub current_grid: Grid,

    pub brush_radius: i32,
    pub selected_particle_id: u16,
}

impl Engine {
    pub fn new(game_width: usize, game_height: usize, renderer: &mut dyn RendererInterface) -> Engine {
        let mut new_engine = Engine {
            game_width,
            game_height,
            current_grid: Grid::new(game_width as u16, game_height as u16),

            brush_radius: 8,
            selected_particle_id: 300,
        };

        // Populate the grid with empty particles
        const EMPTY_PARTICLE_ID: u16 = 0;
        new_engine.current_grid.populate(EMPTY_PARTICLE_ID);

        // Queue grid to be rendered
        renderer.queue_particles(&new_engine.current_grid.data);

        return new_engine;
    }

    pub fn update(&mut self, renderer: &mut dyn RendererInterface, input_state: &InputState) {
        // Process input
        self.handle_input(input_state);

        let mut particles_to_render: Vec<Particle> = Vec::with_capacity(self.current_grid.dirty_particles.len());

        for &index in &self.current_grid.dirty_particles {
            if let Some(particle) = self.current_grid.data.get(index as usize) {
                particles_to_render.push(particle.clone());
            }
        }

        // Clear dirty particle set for the next frame
        self.current_grid.dirty_particles.clear();

        // Update particle physics
        self.step_physics(&mut particles_to_render);

        // Queue dirty particles
        renderer.queue_particles(&particles_to_render);
    }

    fn handle_input(&mut self, input_state: &InputState) {
        // Paint or erase particles
        if input_state.mouse_left_down || input_state.mouse_right_down {
            let pos: &Vector2<f64> = &input_state.mouse_position;

            let mut particle_id: u16 = self.selected_particle_id;
            if input_state.mouse_right_down {
                particle_id = 0; // We are erasing
            }

            if pos.x >= 0.0 && pos.x < self.game_width as f64 && pos.y >= 0.0 && pos.y < self.game_height as f64 {
                self.current_grid
                    .fill_circle_at(pos.x as i32, pos.y as i32, self.brush_radius, particle_id);
            }
        }
    }

    fn step_physics(&mut self, particles_to_update: &mut Vec<Particle>) {
        // Shuffle to randomize horizontal order
        let mut rng = thread_rng();
        particles_to_update.shuffle(&mut rng);

        // Sort from bottom to top (increasing y)
        particles_to_update.sort_by(|a: &Particle, b: &Particle| a.position.y.cmp(&b.position.y));

        for particle in particles_to_update {
            match particle.category {
                4 => self.handle_sands(particle.index as usize),
                _ => {}
            }
        }
    }

    fn handle_sands(&mut self, particle_index: usize) {
        let direction_groups: Vec<Vec<Offset2<i32>>> = vec![
            vec![Offset2::<i32> { dx: 0, dy: -1 }],
            vec![Offset2::<i32> { dx: 1, dy: -1 }, Offset2::<i32> { dx: -1, dy: -1 }],
        ];

        self.current_grid
            .try_move_particle(particle_index, &direction_groups, true, true, true);
    }
}
