use crate::structs::math::Vector2;

pub struct InputState {
    pub mouse_position: Vector2<f64>,
    pub mouse_left_down: bool,
    pub mouse_right_down: bool,
}
