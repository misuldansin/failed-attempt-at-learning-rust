use crate::structs::math;

#[derive(Debug, Clone)]
pub struct Color {
    r: u8,
    g: u8,
    b: u8,
    a: u8,
}

impl Color {
    pub fn new(hex: &str) -> Color {
        return Self::hex_to_rgba(hex);
    }
    pub fn hex_to_rgba(hex: &str) -> Color {
        // Return black if hex is not valid
        if hex.is_empty() {
            return Color { r: 0, g: 0, b: 0, a: 255 };
        }

        // Remove '#' to get the actual hex value
        let mut hex_value = hex.replace("#", "");

        // Expand shorthand hex to normal hex
        if hex_value.len() == 3 {
            let mut hex_expanded = String::new();
            for char in hex_value.chars() {
                hex_expanded.push(char);
                hex_expanded.push(char);
            }
            hex_value = hex_expanded;
        }

        // Expand normal hex to longhand hex
        if hex_value.len() == 6 {
            hex_value.push_str("FF");
        }

        // Parse the hex string into an integer
        let color_in_int = match u32::from_str_radix(&hex_value, 16) {
            Ok(val) => val,
            Err(_) => {
                return Color { r: 0, g: 0, b: 0, a: 255 };
            }
        };

        return Color {
            r: ((color_in_int >> 24) & 255) as u8,
            g: ((color_in_int >> 16) & 255) as u8,
            b: ((color_in_int >> 8) & 255) as u8,
            a: (color_in_int & 255) as u8,
        };
    }
    pub fn rgba_to_hex(&self) -> String {
        // Format each color channel into an uppercase hex string
        let r: String = format!("{:02X}", self.r);
        let g: String = format!("{:02X}", self.g);
        let b: String = format!("{:02X}", self.b);
        let a: String = format!("{:02X}", self.a);

        // Combine them into a single string starting with '#'
        let hex_string: String = format!("#{}{}{}{}", r, g, b, a);
        return hex_string;
    }
    pub fn color_between(start: &Color, end: &Color, t: f32) -> Color {
        // Convert to floating-point values
        let start_r = start.r as f32;
        let start_g = start.g as f32;
        let start_b = start.b as f32;
        let start_a = start.a as f32;

        let end_r = end.r as f32;
        let end_g = end.g as f32;
        let end_b = end.b as f32;
        let end_a = end.a as f32;

        // Interpolate and return a color between start and end color
        return Color {
            r: math::lerp_f32(start_r, end_r, t) as u8,
            g: math::lerp_f32(start_g, end_g, t) as u8,
            b: math::lerp_f32(start_b, end_b, t) as u8,
            a: math::lerp_f32(start_a, end_a, t) as u8,
        };
    }
}
