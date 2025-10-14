#[derive(Debug, Clone)]
pub struct ParticleData {
    pub id: u16,
    pub name: String,
    pub category: u16,
    pub base_color: String,
    pub variant_color: String,
    pub is_movable: bool,
    pub density: f32,
}
