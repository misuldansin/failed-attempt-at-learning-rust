use crate::core::app_manager_interface::AppManagerInterface;
use crate::core::engine::Engine;
use crate::io::native_renderer::NativeRenderer;
use crate::io::renderer_interface::RendererInterface;
use crate::settings::Settings;

use std::sync::Arc;
use winit::application::ApplicationHandler;
use winit::dpi::LogicalSize;
use winit::event::WindowEvent;
use winit::event_loop::ActiveEventLoop;
use winit::event_loop::EventLoop;
use winit::window::{Window, WindowAttributes, WindowId};

pub struct NativeAppManager {
    pub settings: Settings,

    pub window: Option<Arc<Window>>,
    pub renderer: Option<NativeRenderer>,
    pub engine: Option<Engine>,
}

impl AppManagerInterface for NativeAppManager {
    fn new() -> NativeAppManager {
        return NativeAppManager {
            settings: Settings::default(),
            window: None,
            renderer: None,
            engine: None,
        };
    }

    fn start(&mut self) {
        let event_loop = EventLoop::new().expect("Failed to create event loop");
        event_loop.run_app(self).expect("Failed to run app");
    }
}

impl ApplicationHandler for NativeAppManager {
    fn resumed(&mut self, event_loop: &ActiveEventLoop) {
        let attrs: WindowAttributes = WindowAttributes::default()
            .with_title("Bog Engine")
            .with_inner_size(LogicalSize::new(800.0, 600.0));

        // Create window
        let window = Arc::new(event_loop.create_window(attrs).expect("Failed to create window"));
        self.window = Some(window.clone());

        // Create renderer and engine
        let renderer = NativeRenderer::new(self.settings.game_width, self.settings.game_height, &window);
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
                // Update physics
                if let Some(engine) = &mut self.engine {
                    engine.step_physics();
                }

                // Render this frame
                if let Some(renderer) = &mut self.renderer {
                    renderer.render_frame();
                }
            }
            WindowEvent::Resized(new_size) => {
                // Resize WGPU surface configuration
                if let Some(renderer) = &mut self.renderer {
                    renderer.resize(new_size.width, new_size.height);
                }
            }
            WindowEvent::CloseRequested => {
                event_loop.exit();
            }
            _ => {}
        }
    }
}
