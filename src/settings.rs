pub struct Settings {
    pub game_width: usize,
    pub game_height: usize,
    pub debug_enabled: bool,
    pub render_update_interval: u64,
    pub physics_update_interval: u64,
}

impl Default for Settings {
    fn default() -> Settings {
        return Settings {
            game_width: 200,
            game_height: 150,
            debug_enabled: true,
            render_update_interval: 15,
            physics_update_interval: 15,
        };
    }
}
