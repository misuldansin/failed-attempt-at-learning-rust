use crate::loader::load_particle_data;
use crate::structs::math::Vector2D;
use crate::structs::particle::Particle;
use crate::structs::particle_data::ParticleData;
use std::collections::HashMap;
use std::collections::HashSet;

const MOORE_NEIGHBORS: [(i32, i32); 8] = [(-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)];
const VON_NEUMANN_NEIGHBORS: [(i32, i32); 4] = [(0, -1), (-1, 0), (1, 0), (0, 1)];

pub struct Grid {
    pub width: i32,
    pub height: i32,
    pub data: Vec<Particle>,
    particle_data_map: HashMap<u16, ParticleData>,
    pub dirty_particles: HashSet<u32>,
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
            particle_data_map: particle_data_map,
            dirty_particles: HashSet::<u32>::new(),
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

    pub fn mark_particle_dirty(&mut self, x: i32, y: i32, mark_neighbors_as_dirty: bool) {
        // Get particle's index
        let particle_index: u32 = (y * self.width + x) as u32;

        // Add the particle's index to mark it dirty
        self.dirty_particles.insert(particle_index);

        // Mark particle's neighbors dirty
        if mark_neighbors_as_dirty {
            // Get particle's neighbors
            let neighbor_indices: Vec<u32> = self.get_neighbor_indices_of(x, y, &MOORE_NEIGHBORS);

            // Mark them dirty
            for neighbor_index in neighbor_indices {
                self.dirty_particles.insert(neighbor_index);
            }
        }
    }

    // --------- Methods ---------

    pub fn create_particle_at(
        &mut self,
        x: i32,
        y: i32,
        particle_id: u16,
        mark_as_dirty: bool,
        mark_neighbors_as_dirty: bool,
    ) -> bool {
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
        if mark_as_dirty {
            self.mark_particle_dirty(x, y, mark_neighbors_as_dirty);
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
}
