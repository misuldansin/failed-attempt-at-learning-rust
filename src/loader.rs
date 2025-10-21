use crate::structs::particle_data::ParticleData;
use std::collections::HashMap;
use std::fs;

#[derive(Debug, Clone)]
pub struct ParticleParseData {
    pub id: Option<u16>,
    pub name: Option<String>,
    pub category: Option<u16>,
    pub base_color: Option<String>,
    pub variant_color: Option<String>,
    pub is_movable: Option<bool>,
    pub density: Option<f32>,
}

pub fn load_particle_data(filepath: &str) -> HashMap<u16, ParticleData> {
    // Open the particle data file into string
    let file_text: String = fs::read_to_string(filepath).expect("Could not open particle data file!");
    let mut particle_data: HashMap<u16, ParticleParseData> = HashMap::new();

    // Retrieve data
    let mut current_id: Option<u16> = None;
    let mut current_data: Option<ParticleParseData> = None;
    let mut processed_ids: Vec<u16> = Vec::new();
    for lines in file_text.lines() {
        // Trim line of any whitespaces or tabs
        let this_line: String = lines.trim().to_string();

        // Ignore empty lines and lines starting with '#'
        if this_line.is_empty() || this_line.starts_with('#') {
            continue;
        }

        // We have encountered a new particle block
        if this_line.starts_with('[') && this_line.ends_with(']') {
            // Wrap up previous particle data
            if let Some(id) = current_id {
                if let Some(data) = current_data.take() {
                    particle_data.insert(id, data);
                }
            }

            // Retrieve id from this line
            let id_str: &str = &this_line[1..this_line.len() - 1];
            let id: u16 = id_str.parse::<u16>().unwrap_or(0);

            // Check if id already exists
            if processed_ids.contains(&id) {
                current_id = None;
                current_data = None;
                println!(
                    "Particle blocks with duplicate ID found, ignoring particle block with extra ID: {}",
                    id
                );
            } else {
                // Store a new current id and data if no duplicate ids were found
                processed_ids.push(id);
                current_id = Some(id);
                current_data = Some(ParticleParseData {
                    id: Some(id),
                    name: None,
                    category: None,
                    base_color: None,
                    variant_color: None,
                    is_movable: None,
                    density: None,
                });
            }
            continue;
        }

        // If current data exist, let's populate it's keys
        if let Some(data) = current_data.as_mut() {
            if let Some((key_str, val_str)) = this_line.split_once(':') {
                let value: &str = val_str.trim();

                match key_str {
                    "name" => data.name = Some(value.to_string()),
                    "category" => data.category = value.parse::<u16>().ok(),
                    "base_color" => data.base_color = Some(value.to_string()),
                    "variant_color" => data.variant_color = Some(value.to_string()),
                    "is_movable" => {
                        data.is_movable = match value {
                            "true" => Some(true),
                            "false" => Some(false),
                            _ => None,
                        }
                    }
                    "density" => data.density = value.parse::<f32>().ok(),
                    _ => (),
                }
            }
        }
    }

    // Save the last particle data
    if let Some(id) = current_id {
        if let Some(data) = current_data.take() {
            particle_data.insert(id, data);
        }
    }

    // Checksum and finalization
    let mut final_particle_data: HashMap<u16, ParticleData> = HashMap::new();
    for (id, data) in particle_data.into_iter() {
        if let (Some(name), Some(category), Some(base_color), Some(variant_color), Some(is_movable), Some(density)) = (
            data.name,
            data.category,
            data.base_color,
            data.variant_color,
            data.is_movable,
            data.density,
        ) {
            // Discard any particles with ID ranging from 0 to 9 as they are severed for technical particles
            if id < 10 {
                continue;
            }

            final_particle_data.insert(
                id,
                ParticleData {
                    id,
                    name,
                    category,
                    base_color,
                    variant_color,
                    is_movable,
                    density,
                },
            );
        } else {
            // ! Todo: warm user about corrupted particle block
            println!("Corrupted particle block found of ID: {}", id);
        }
    }

    // Add technical particles here (ID: 0-9)
    // Technical particles are hard codded and should not be messed with !
    final_particle_data.insert(
        0,
        ParticleData {
            id: 0,
            name: "Empty".to_string(),
            category: 0,
            base_color: "#0E0E11".to_string(),
            variant_color: "#0E0E11".to_string(),
            is_movable: true,
            density: 0.0,
        },
    );

    return final_particle_data;
}
