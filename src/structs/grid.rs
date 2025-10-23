use crate::loader::load_particle_data;
use crate::structs::particle::Particle;
use crate::structs::particle_data::ParticleData;
use crate::structs::utils::{Offset2, Vector2};
use std::collections::HashMap;
use std::collections::HashSet;

use rand::{Rng, prelude::SliceRandom, prelude::ThreadRng, random};

const MOORE_NEIGHBORS: [(i32, i32); 8] = [(-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)];
const VON_NEUMANN_NEIGHBORS: [(i32, i32); 4] = [(0, -1), (-1, 0), (1, 0), (0, 1)];

pub struct Grid {
    pub width: i32,
    pub height: i32,
    pub data: Vec<Particle>,
    pub dirty_particles: HashSet<u32>,

    particle_data_map: HashMap<u16, ParticleData>,
}

impl Grid {
    pub fn new(width: u16, height: u16) -> Grid {
        // Load particle data for this grid
        let particle_data_map: HashMap<u16, ParticleData> = load_particle_data("./src/data/particles.data");

        // Create a new empty data for this grid
        let data: Vec<Particle> = Vec::with_capacity(width as usize * height as usize);

        return Grid {
            width: width as i32,
            height: height as i32,
            data: data,
            dirty_particles: HashSet::<u32>::new(),

            particle_data_map: particle_data_map,
        };
    }

    // --------- Helper Functions ---------
    pub fn is_in_bounds(&self, x: i32, y: i32) -> bool {
        return x >= 0 && x < self.width && y >= 0 && y < self.height;
    }

    pub fn populate(&mut self, particle_id: u16) {
        // Retrive particle from particle data map using the provided id
        let particle_data: &ParticleData = self.particle_data_map.get(&particle_id).unwrap();

        // Create grid data and populate it with the provided particles
        for y in 0..self.height {
            for x in 0..self.width {
                let index: u32 = (y * self.width + x) as u32;
                let handle: u32 = index;

                let mut particle: Particle = Particle::new(particle_data, x, y, handle);
                particle.index = index;
                self.data.push(particle);
            }
        }
    }

    pub fn mark_particle_dirty(&mut self, x: i32, y: i32, mark_neighbors_dirty: bool) {
        // Get particle's index
        let particle_index: u32 = (y * self.width + x) as u32;

        // Add the particle's index to mark it dirty
        self.dirty_particles.insert(particle_index);

        // Mark particle's neighbors dirty
        if mark_neighbors_dirty {
            // Get particle's neighbors
            let neighbor_indices: Vec<u32> = self.get_neighbor_indices_of(x, y, &MOORE_NEIGHBORS);

            // Mark them dirty
            for neighbor_index in neighbor_indices {
                self.dirty_particles.insert(neighbor_index);
            }
        }
    }

    // --------- Methods ---------

    pub fn create_particle_at(&mut self, x: i32, y: i32, particle_id: u16, mark_dirty: bool, mark_neighbors_dirty: bool) -> bool {
        // x and y axis are out of bounds, return
        if !(self.is_in_bounds(x, y)) {
            return false;
        }

        // Retrieve particle data
        let particle_data: &ParticleData = match self.particle_data_map.get(&particle_id) {
            Some(val) => val,
            None => return false, // Cannot create particle, invalid particle id, return
        };

        // Instanciate a new particle
        let mut new_particle: Particle = Particle::new(particle_data, x, y, 1);

        // Set the new particle's index
        let index: u32 = (y * self.width + x) as u32;
        new_particle.index = index;

        // Assigning the new particle to the data
        self.data[index as usize] = new_particle;

        // Handle dirty logic
        if mark_dirty {
            self.mark_particle_dirty(x, y, mark_neighbors_dirty);
        }

        return true;
    }

    pub fn get_particle_at<'a>(&'a self, x: i32, y: i32) -> Option<&'a Particle> {
        // Check if the position is out of bounds
        if !(self.is_in_bounds(x, y)) {
            return None;
        }

        let index = y * self.width + x;
        return self.data.get(index as usize);
    }

    pub fn get_neighbor_indices_of(&self, x: i32, y: i32, offsets: &[(i32, i32)]) -> Vec<u32> {
        let mut neighbors: Vec<u32> = Vec::with_capacity(offsets.len());

        for (x_offset, y_offset) in offsets {
            // Convert offset position to world position
            let x_pos: i32 = x + x_offset;
            let y_pos: i32 = y + y_offset;

            // Add neighbor to the list if it's in grid's bounds
            if self.is_in_bounds(x_pos, y_pos) {
                let neighbor_index: u32 = (y_pos * self.width + x_pos) as u32;
                neighbors.push(neighbor_index);
            }
        }

        return neighbors;
    }
    pub fn try_move_particle(
        &mut self,
        particle_index: usize,
        direction_groups: &[Vec<Offset2<i32>>],
        bump_them_nerds: bool,
        mark_dirty: bool,
        mark_neighbors_dirty: bool,
    ) -> bool {
        let current_position = self.data[particle_index].position;
        let current_density = self.data[particle_index].density;
        let width = self.width;

        for directions in direction_groups {
            for direction in directions {
                // Add random 'bumps' in the x axis
                let mut final_dx: i32 = direction.dx;
                if bump_them_nerds {
                    if rand::random::<f32>() > 0.5 {
                        final_dx = -direction.dx;
                    }
                }

                let tx: i32 = current_position.x + final_dx;
                let ty: i32 = current_position.y + direction.dy;

                if !self.is_in_bounds(tx, ty) {
                    continue;
                }

                let target_index: usize = (ty * width + tx) as usize;

                if particle_index == target_index {
                    continue;
                }

                let moved: bool = {
                    let (a, b) = if particle_index < target_index {
                        let (a, b) = self.data.split_at_mut(target_index);
                        (&mut a[particle_index], &mut b[0])
                    } else {
                        let (a, b) = self.data.split_at_mut(particle_index);
                        (&mut b[0], &mut a[target_index])
                    };

                    if b.is_movable && current_density > b.density {
                        std::mem::swap(a, b);
                        let temp_pos = a.position;
                        a.position = b.position;
                        b.position = temp_pos;

                        let temp_index = a.index;
                        a.index = b.index;
                        b.index = temp_index;

                        true
                    } else {
                        false
                    }
                };

                if moved {
                    if mark_dirty {
                        self.mark_particle_dirty(tx, ty, mark_neighbors_dirty);
                        self.mark_particle_dirty(current_position.x, current_position.y, mark_neighbors_dirty);
                    }
                    return true;
                }
            }
        }

        return false;
    }

    pub fn fill_circle_at(&mut self, x: i32, y: i32, radius: i32, particle_id: u16) {
        for i in -radius..radius {
            for j in -radius..radius {
                if i * i + j * j <= radius * radius {
                    let px: i32 = x + i;
                    let py: i32 = y + j;

                    // Particle to draw is out of grid's bounds, skip it
                    if !self.is_in_bounds(px, py) {
                        continue;
                    }

                    // Create particle
                    self.create_particle_at(px, py, particle_id, true, true);
                }
            }
        }
    }
}
