#[derive(Debug, Clone, Copy)]
pub struct Color {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: u8,
}

impl Color {
    // --------- Constructor ---------
    pub fn from_hex(hex: &str) -> Color {
        return Self::hex_to_color(hex);
    }

    pub fn from_rgba(r: u8, g: u8, b: u8, a: u8) -> Color {
        return Color { r, g, b, a };
    }

    // --------- Instance Methods ---------
    pub fn to_hex(&self) -> String {
        return Self::color_to_hex(self);
    }

    // --------- Helper Functions ---------
    pub fn hex_to_color(hex: &str) -> Color {
        // Return black if hex is empty (bruv)
        if hex.is_empty() {
            return Self::from_rgba(0, 0, 0, 255);
        }

        // Remove '#' to get the actual hex value
        let hex: &str = hex.strip_prefix('#').unwrap_or(hex);

        // Pre-allocate 8 character length for a longhand hex
        let mut hex_value: String = String::with_capacity(8);

        // Format the hex correctly, diligently
        if hex.len() == 8 {
            // Already full length hex color
            hex_value.push_str(hex);
        } else if hex.len() == 3 {
            // Expand shorthand to normal hex and add the alpha channel
            for c in hex.chars() {
                hex_value.push(c);
                hex_value.push(c);
            }
            hex_value.push_str("FF");
        } else if hex.len() == 6 {
            // Expand normal hex to longhand by addiong the alpha channel
            hex_value.push_str(hex);
            hex_value.push_str("FF");
        } else {
            // Invalid length, return black
            return Self::from_rgba(0, 0, 0, 255);
        }

        // Parse the correctly formated hex to rgba 32-bit integer
        let color_u32_rgba: u32 = match u32::from_str_radix(&hex_value, 16) {
            Ok(val) => val,
            Err(_) => {
                // Parse failed, return black
                return Self::from_rgba(0, 0, 0, 255);
            }
        };

        // Unpack individual RGBA channels and return them
        return Self::raw_to_color(color_u32_rgba);
    }

    pub fn raw_to_color(rgba: u32) -> Color {
        let r: u8 = ((rgba >> 24) & 0xFF) as u8;
        let g: u8 = ((rgba >> 16) & 0xFF) as u8;
        let b: u8 = ((rgba >> 08) & 0xFF) as u8;
        let a: u8 = ((rgba >> 00) & 0xFF) as u8;
        return Self::from_rgba(r, g, b, a);
    }

    pub fn color_to_hex(color: &Color) -> String {
        // Format and return longhand hex
        return format!("#{:02X}{:02X}{:02X}{:02X}", color.r, color.g, color.b, color.a);
    }

    pub fn color_to_raw(color: &Color) -> u32 {
        // Pack and return RGBA channels into raw u32 format
        return ((color.r as u32) << 24)
            | ((color.g as u32) << 16)
            | ((color.b as u32) << 08)
            | ((color.a as u32) << 00);
    }

    pub fn lerp_color(color_a: &Color, color_b: &Color, t: f32) -> Color {
        // Linear interpolation: a + (b - a) * t
        let r = (color_a.r as f32 + (color_b.r as f32 - color_a.r as f32) * t).clamp(0.0, 255.0) as u8;
        let g = (color_a.g as f32 + (color_b.g as f32 - color_a.g as f32) * t).clamp(0.0, 255.0) as u8;
        let b = (color_a.b as f32 + (color_b.b as f32 - color_a.b as f32) * t).clamp(0.0, 255.0) as u8;
        let a = (color_a.a as f32 + (color_b.a as f32 - color_a.a as f32) * t).clamp(0.0, 255.0) as u8;
        return Self::from_rgba(r, g, b, a);
    }

    pub fn lerp_hex(hex_a: &str, hex_b: &str, t: f32) -> Color {
        // Convert hex string to RGBA color
        let color_a: Color = Self::hex_to_color(hex_a);
        let color_b: Color = Self::hex_to_color(hex_b);

        // Lerp and get final color
        return Self::lerp_color(&color_a, &color_b, t);
    }
}
