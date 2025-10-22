use crate::io::renderer_interface::RendererInterface;
use crate::io::renderer_utils::*;
use crate::structs::particle::Particle;
use crate::structs::utils::Pixel;

use pollster::block_on;
use std::{collections::HashMap, sync::Arc};
use wgpu::{Device, Queue, Surface, SurfaceConfiguration};
use winit::window::Window;

pub struct NativeRenderer {
    // CPU side variables, and buffers
    width: usize,
    height: usize,
    frame_buffer: Vec<u8>,
    queued_particles: Vec<Particle>,
    debug_overlay_pixels: HashMap<usize, Pixel>,

    // WGPU variables
    device: Device,
    queue: Queue,
    surface: Surface<'static>,
    config: SurfaceConfiguration,

    // Render groups
    base_group: RenderGroup,
    brush_group: RenderGroup,
}
impl NativeRenderer {
    // duh
    pub fn new(width: usize, height: usize, window: &Arc<Window>) -> NativeRenderer {
        let leaked_window: &Window = Box::leak(Box::new(window.clone()));

        // Initialise WGPU variables
        let instance: wgpu::Instance = wgpu::Instance::default();
        let surface: Surface<'static> = unsafe { instance.create_surface(leaked_window) }.expect("Failed to create surface");
        let adapter: wgpu::Adapter = block_on(instance.request_adapter(&wgpu::RequestAdapterOptions {
            compatible_surface: Some(&surface),
            power_preference: wgpu::PowerPreference::HighPerformance,
            force_fallback_adapter: false,
        }))
        .expect("Failed to find a suitable GPU adapter");
        let (device, queue) = block_on(adapter.request_device(
            &wgpu::DeviceDescriptor {
                label: Some("Main Device"),
                required_features: wgpu::Features::empty(),
                required_limits: wgpu::Limits::default(),
            },
            None,
        ))
        .expect("Failed to create device");

        let config = wgpu::SurfaceConfiguration {
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
            format: surface
                .get_capabilities(&adapter)
                .formats
                .first()
                .copied()
                .unwrap_or(wgpu::TextureFormat::Bgra8UnormSrgb),
            width: width as u32,
            height: height as u32,
            present_mode: wgpu::PresentMode::Fifo,
            alpha_mode: wgpu::CompositeAlphaMode::Auto,
            view_formats: vec![],
            desired_maximum_frame_latency: 2,
        };
        surface.configure(&device, &config);

        // Create base group with base, effects, and debug layers
        let base_group: RenderGroup = create_base_render_group(width as u32, height as u32, &device, wgpu::TextureFormat::Bgra8UnormSrgb);

        // Initialise effects, and debug overlay layers with transparent textures
        let transparent_buffer = vec![0u8; (width * height * 4) as usize];
        for layer_index in 1..=2 {
            queue.write_texture(
                wgpu::ImageCopyTexture {
                    texture: &base_group.layers[layer_index].texture,
                    mip_level: 0,
                    origin: wgpu::Origin3d::ZERO,
                    aspect: wgpu::TextureAspect::All,
                },
                &transparent_buffer,
                wgpu::ImageDataLayout {
                    offset: 0,
                    bytes_per_row: Some(4 * width as u32),
                    rows_per_image: Some(height as u32),
                },
                wgpu::Extent3d {
                    width: width as u32,
                    height: height as u32,
                    depth_or_array_layers: 1,
                },
            );
        }

        // Create brush indicator group (UI group)
        let brush_group: RenderGroup = create_brush_render_group(&device, wgpu::TextureFormat::Bgra8UnormSrgb);

        return NativeRenderer {
            // CPU side variables, and buffers
            width: width,
            height: height,
            frame_buffer: vec![0; width * height * 4],
            queued_particles: Vec::new(),
            debug_overlay_pixels: HashMap::new(),

            // WGPU variables
            device: device,
            queue: queue,
            surface: surface,
            config: config,

            // Render groups
            base_group: base_group,
            brush_group: brush_group,
        };
    }

    pub fn resize(&mut self, new_width: u32, new_height: u32) {
        // Skip minimised window
        if new_width == 0 || new_height == 0 {
            return;
        }
        self.config.width = new_width;
        self.config.height = new_height;
        self.surface.configure(&self.device, &self.config);
    }
}
impl RendererInterface for NativeRenderer {
    // Queues a batch of particles to be processed and rendered later
    fn queue_particles(&mut self, particles_to_queue: &[Particle]) {
        // There are no particles to queue, return
        if particles_to_queue.is_empty() {
            return;
        }

        // Reserve capacity early
        self.queued_particles.reserve(particles_to_queue.len());

        // Clone each particle and append to the pending queue
        for particle in particles_to_queue {
            self.queued_particles.push(particle.clone());
        }
    }

    // Queue a set of debug overlay pixels for rendering in the next frame, takes ownership of the pixels
    fn queue_debug_overlay_pixels(&mut self, pixels_to_queue: Vec<Pixel>) {
        for pixel in pixels_to_queue {
            self.debug_overlay_pixels.insert(pixel.index, pixel);
        }
    }

    // Render this frame
    fn render_frame(&mut self) {
        // Process this frame’s queued particles into the frame buffer
        process_particles(&self.queued_particles, &mut self.frame_buffer, self.width);
        self.queued_particles.clear(); // Done with these particles, clear them

        // Upload the frame buffer into the base group's texture
        self.queue.write_texture(
            wgpu::ImageCopyTexture {
                texture: &self.base_group.layers[0].texture,
                mip_level: 0,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            &self.frame_buffer,
            wgpu::ImageDataLayout {
                offset: 0,
                bytes_per_row: Some(4 * self.width as u32),
                rows_per_image: Some(self.height as u32),
            },
            self.base_group.texture_extent,
        );

        // Get a new swapchain frame
        let frame: wgpu::SurfaceTexture = match self.surface.get_current_texture() {
            Ok(val) => val,
            Err(wgpu::SurfaceError::Lost | wgpu::SurfaceError::Outdated) => {
                // Reconfigure surface and skip this frame
                self.resize(self.config.width, self.config.height);
                return;
            }
            Err(wgpu::SurfaceError::OutOfMemory) => {
                panic!("GPU ran out of memory!");
            }
            Err(e) => {
                eprintln!("Failed to acquire next swapchain texture: {:?}", e);
                return;
            }
        };

        let view: wgpu::TextureView = frame.texture.create_view(&wgpu::TextureViewDescriptor::default());

        // Encode GPU commands
        let mut encoder = self.device.create_command_encoder(&wgpu::CommandEncoderDescriptor {
            label: Some("Render Encoder"),
        });

        // Base Group Pass
        {
            let mut render_pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                label: Some("Main Render Pass"),
                color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                    view: &view,
                    resolve_target: None,
                    ops: wgpu::Operations {
                        load: wgpu::LoadOp::Clear(wgpu::Color::BLACK),
                        store: wgpu::StoreOp::Store,
                    },
                })],
                depth_stencil_attachment: None,
                timestamp_writes: None,
                occlusion_query_set: None,
            });

            // Draw the composited scene layers
            render_pass.set_pipeline(&self.base_group.pipeline);
            render_pass.set_bind_group(0, &self.base_group.bind_group, &[]);
            render_pass.draw(0..6, 0..1);
        }

        // Brush Outline Pass
        {
            let mut render_pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                label: Some("Brush Overlay Render Pass"),
                color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                    view: &view,
                    resolve_target: None,
                    ops: wgpu::Operations {
                        load: wgpu::LoadOp::Load,
                        store: wgpu::StoreOp::Store,
                    },
                })],
                depth_stencil_attachment: None,
                timestamp_writes: None,
                occlusion_query_set: None,
            });

            render_pass.set_pipeline(&self.brush_group.pipeline);
            render_pass.set_bind_group(0, &self.brush_group.bind_group, &[]);
            render_pass.draw(0..6, 0..1);
        }

        // Submit and present
        self.queue.submit(Some(encoder.finish()));
        frame.present();
    }
}
