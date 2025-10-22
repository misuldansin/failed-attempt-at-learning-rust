use crate::core::app_manager_interface::AppManagerInterface;
use crate::core::engine::Engine;
use crate::io::native_renderer::NativeRenderer;
use crate::io::renderer_interface::RendererInterface;
use crate::settings::Settings;
use crate::structs::input_state;
use crate::structs::input_state::InputState;
use crate::structs::utils::Vector2;

use std::sync::Arc;
use std::time::{Duration, Instant};
use winit::application::ApplicationHandler;
use winit::dpi::{LogicalPosition, LogicalSize, PhysicalSize};
use winit::event::{ElementState, MouseButton, WindowEvent};
use winit::event_loop::EventLoop;
use winit::event_loop::{ActiveEventLoop, ControlFlow};
use winit::window::{Window, WindowAttributes, WindowId};

pub struct NativeAppManager {
    pub settings: Settings,

    pub window: Option<Arc<Window>>,
    pub renderer: Option<NativeRenderer>,
    pub engine: Option<Engine>,

    input_state: InputState,
    last_frame_time: Instant,
}

impl AppManagerInterface for NativeAppManager {
    fn new() -> NativeAppManager {
        let input_state: InputState = InputState {
            mouse_position: Vector2::<f64>::new(0.0, 0.0),
            mouse_left_down: false,
            mouse_right_down: false,
        };

        return NativeAppManager {
            settings: Settings::default(),
            window: None,
            renderer: None,
            engine: None,

            input_state: input_state,
            last_frame_time: Instant::now(),
        };
    }

    fn start(&mut self) {
        let event_loop = EventLoop::new().expect("Failed to create event loop");
        event_loop.run_app(self).expect("Failed to run app");
    }
}

impl ApplicationHandler for NativeAppManager {
    fn resumed(&mut self, event_loop: &ActiveEventLoop) {
        let window_width: f64 = self.settings.game_width as f64 * 4.0;
        let window_height: f64 = self.settings.game_height as f64 * 4.0;

        let attrs: WindowAttributes = WindowAttributes::default()
            .with_title("Bog Engine")
            .with_inner_size(LogicalSize::new(window_width, window_height))
            .with_resizable(true);

        // Create window
        let window: Arc<Window> = Arc::new(event_loop.create_window(attrs).expect("Failed to create window or sumn"));

        // Center window on startup
        if let Some(monitor) = window.current_monitor() {
            let monitor_size: PhysicalSize<u32> = monitor.size();
            let center_x: f64 = (monitor_size.width as f64 / 2.0) - (window_width / 2.0);
            let center_y: f64 = (monitor_size.height as f64 / 2.0) - (window_height / 2.0);

            window.set_outer_position(LogicalPosition::new(center_x, center_y));
        }

        self.window = Some(window.clone());

        // Create renderer and engine
        let renderer: NativeRenderer = NativeRenderer::new(self.settings.game_width, self.settings.game_height, &window);
        self.renderer = Some(renderer);

        let engine = Engine::new(
            self.settings.game_width,
            self.settings.game_height,
            self.renderer.as_mut().expect("Renderer not initialized"),
        );
        self.engine = Some(engine);

        // Request first draw
        window.request_redraw();
    }

    fn window_event(&mut self, event_loop: &ActiveEventLoop, window_id: WindowId, event: WindowEvent) {
        match event {
            WindowEvent::RedrawRequested => {
                if let (Some(engine), Some(renderer)) = (&mut self.engine, &mut self.renderer) {
                    // Update physics
                    engine.update(renderer, &self.input_state);

                    // Render this frame
                    renderer.render_frame();
                }
            }
            WindowEvent::Resized(new_size) => {
                if let Some(renderer) = &mut self.renderer {
                    // Resize WGPU surface configuration
                    renderer.resize(new_size.width, new_size.height);
                }
            }
            WindowEvent::CloseRequested => {
                event_loop.exit();
            }
            WindowEvent::CursorMoved { device_id, position } => {
                let window_size: winit::dpi::PhysicalSize<u32> = self.window.as_ref().unwrap().inner_size();
                let scale_x: f64 = self.settings.game_width as f64 / window_size.width as f64;
                let scale_y: f64 = self.settings.game_height as f64 / window_size.height as f64;

                let flipped_y: f64 = window_size.height as f64 - position.y;

                self.input_state.mouse_position.x = position.x * scale_x;
                self.input_state.mouse_position.y = flipped_y * scale_y;
            }
            WindowEvent::MouseInput { device_id, state, button } => {
                let is_down: bool = state == ElementState::Pressed;

                match button {
                    MouseButton::Left => self.input_state.mouse_left_down = is_down,
                    MouseButton::Right => self.input_state.mouse_right_down = is_down,
                    _ => {}
                }
            }
            _ => {}
        }
    }
    fn about_to_wait(&mut self, event_loop: &ActiveEventLoop) {
        let target_frame_time = Duration::from_secs_f64(1.0 / 60.0); // 60 FPS
        let now = Instant::now();
        let next_frame_time = self.last_frame_time + target_frame_time;

        if now >= next_frame_time {
            self.last_frame_time = now;
            if let Some(window) = &self.window {
                window.request_redraw(); // Request redraw
            }

            event_loop.set_control_flow(ControlFlow::Poll);
        } else {
            event_loop.set_control_flow(ControlFlow::WaitUntil(next_frame_time));
        }
    }
}
