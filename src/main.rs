mod loader;
mod structs;

use loader::load_particle_data;
use std::collections::HashMap;
use structs::color::Color;
use structs::particle_data::ParticleData;

fn main() {
    let particle_data: HashMap<u16, ParticleData> = load_particle_data("./src/data/particles.data");
    println!("{:#?}", particle_data);
}
