use crate::io::renderer_interface::RendererInterface;
use crate::io::renderer_utils::*;
use crate::structs::color::Color;
use crate::structs::particle::Particle;
use crate::structs::utils::Pixel;

use pollster::block_on;
use std::{collections::HashMap, sync::Arc};
use wgpu::{Device, Queue, Surface, SurfaceConfiguration};
use winit::window::Window;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct DirtyRect {
    pub min_x: u32,
    pub min_y: u32,
    pub max_x: u32,
    pub max_y: u32,
}

const COARSE_GRID_CELL_SIZE: u32 = 32;

pub struct NativeRenderer {
    // CPU side variables, and buffers
    width: usize,
    height: usize,
    frame_buffer: Vec<u8>,
    dirty_rects: Vec<DirtyRect>,

    // queued_particles: Vec<Particle>,
    debug_overlay_pixels: HashMap<usize, Pixel>,

    // WGPU variables
    device: Device,
    queue: Queue,
    surface: Surface<'static>,
    config: SurfaceConfiguration,

    // Render groups
    base_group: RenderGroup,
    // brush_group: RenderGroup,
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
        //let brush_group: RenderGroup = create_brush_render_group(&device, wgpu::TextureFormat::Bgra8UnormSrgb);

        return NativeRenderer {
            // CPU side variables, and buffers
            width: width,
            height: height,
            frame_buffer: vec![0; width * height * 4],
            dirty_rects: Vec::new(),
            // queued_particles: Vec::new(),
            debug_overlay_pixels: HashMap::new(),

            // WGPU variables
            device: device,
            queue: queue,
            surface: surface,
            config: config,

            // Render groups
            base_group: base_group,
            //brush_group: brush_group,
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

    pub fn merge_dirty_rects(dirty_rects: &mut Vec<DirtyRect>, width: u32, height: u32) -> Vec<DirtyRect> {
        if dirty_rects.is_empty() {
            return Vec::new();
        }

        let mut merged_rects: HashMap<(u32, u32), DirtyRect> = HashMap::new();

        for rect in dirty_rects.iter() {
            let start_cell_x = rect.min_x / COARSE_GRID_CELL_SIZE;
            let start_cell_y = rect.min_y / COARSE_GRID_CELL_SIZE;
            let end_cell_x = (rect.max_x.saturating_sub(1) / COARSE_GRID_CELL_SIZE) + 1;
            let end_cell_y = (rect.max_y.saturating_sub(1) / COARSE_GRID_CELL_SIZE) + 1;

            for cx in start_cell_x..end_cell_x {
                for cy in start_cell_y..end_cell_y {
                    let key = (cx, cy);

                    let cell_min_x = cx * COARSE_GRID_CELL_SIZE;
                    let cell_min_y = cy * COARSE_GRID_CELL_SIZE;
                    let cell_max_x = (cx + 1) * COARSE_GRID_CELL_SIZE;
                    let cell_max_y = (cy + 1) * COARSE_GRID_CELL_SIZE;

                    let merged_min_x = rect.min_x.max(cell_min_x);
                    let merged_min_y = rect.min_y.max(cell_min_y);
                    let merged_max_x = rect.max_x.min(cell_max_x).min(width);
                    let merged_max_y = rect.max_y.min(cell_max_y).min(height);

                    let current_merged_rect = DirtyRect {
                        min_x: merged_min_x,
                        min_y: merged_min_y,
                        max_x: merged_max_x,
                        max_y: merged_max_y,
                    };

                    merged_rects
                        .entry(key)
                        .and_modify(|existing_rect| {
                            existing_rect.min_x = existing_rect.min_x.min(current_merged_rect.min_x);
                            existing_rect.min_y = existing_rect.min_y.min(current_merged_rect.min_y);
                            existing_rect.max_x = existing_rect.max_x.max(current_merged_rect.max_x);
                            existing_rect.max_y = existing_rect.max_y.max(current_merged_rect.max_y);
                        })
                        .or_insert(current_merged_rect);
                }
            }
        }

        dirty_rects.clear();
        merged_rects.into_values().collect()
    }
}
impl RendererInterface for NativeRenderer {
    // Queues a batch of particles to be processed and rendered later
    fn queue_particles(&mut self, particles_to_queue: &[Particle]) {
        // There are no particles to queue, return
        if particles_to_queue.is_empty() {
            return;
        }

        let width = self.width as u32;

        for particle in particles_to_queue {
            let index: usize = particle.index as usize;

            // ! Todo: make a function that computes final color or sum shader logic or sumn
            let final_color: Color = particle.color;

            let offset = index * 4;
            self.frame_buffer[offset + 0] = final_color.b;
            self.frame_buffer[offset + 1] = final_color.g;
            self.frame_buffer[offset + 2] = final_color.r;
            self.frame_buffer[offset + 3] = final_color.a;

            let x = (index as u32) % width;
            let y = (index as u32) / width;
            self.dirty_rects.push(DirtyRect {
                min_x: x,
                min_y: y,
                max_x: x + 1,
                max_y: y + 1,
            });
        }
    }

    // Queue a set of debug overlay pixels for rendering in the next frame, takes ownership of the pixels
    fn queue_debug_overlay_pixels(&mut self, pixels_to_queue: Vec<Pixel>) {
        for pixel in pixels_to_queue {
            self.debug_overlay_pixels.insert(pixel.index, pixel);
        }
    }

    fn render_frame(&mut self) {
        let optimized_rects: Vec<DirtyRect> = Self::merge_dirty_rects(&mut self.dirty_rects, self.width as u32, self.height as u32);
        for rect in optimized_rects {
            let start_x = rect.min_x;
            let start_y = rect.min_y;
            let write_width = rect.max_x.saturating_sub(rect.min_x);
            let write_height = rect.max_y.saturating_sub(rect.min_y);

            if write_width == 0 || write_height == 0 {
                continue;
            }

            let mut dirty_data: Vec<u8> = Vec::with_capacity((write_width * write_height * 4) as usize);
            let grid_width = self.width as u32;

            for y in start_y..rect.max_y {
                let row_start_index = ((y * grid_width) + start_x) as usize * 4;
                let row_end_index = row_start_index + (write_width as usize * 4);

                if let Some(slice) = self.frame_buffer.get(row_start_index..row_end_index) {
                    dirty_data.extend_from_slice(slice);
                }
            }

            self.queue.write_texture(
                wgpu::ImageCopyTexture {
                    texture: &self.base_group.layers[0].texture,
                    mip_level: 0,
                    origin: wgpu::Origin3d {
                        x: start_x,
                        y: start_y,
                        z: 0,
                    },
                    aspect: wgpu::TextureAspect::All,
                },
                &dirty_data,
                wgpu::ImageDataLayout {
                    offset: 0,
                    bytes_per_row: Some(4 * write_width),
                    rows_per_image: Some(write_height),
                },
                wgpu::Extent3d {
                    width: write_width,
                    height: write_height,
                    depth_or_array_layers: 1,
                },
            );
        }

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
        // {
        //     let mut render_pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
        //         label: Some("Brush Overlay Render Pass"),
        //         color_attachments: &[Some(wgpu::RenderPassColorAttachment {
        //             view: &view,
        //             resolve_target: None,
        //             ops: wgpu::Operations {
        //                 load: wgpu::LoadOp::Load,
        //                 store: wgpu::StoreOp::Store,
        //             },
        //         })],
        //         depth_stencil_attachment: None,
        //         timestamp_writes: None,
        //         occlusion_query_set: None,
        //     });

        //     render_pass.set_pipeline(&self.brush_group.pipeline);
        //     render_pass.set_bind_group(0, &self.brush_group.bind_group, &[]);
        //     render_pass.draw(0..6, 0..1);
        // }

        // Submit and present
        self.queue.submit(Some(encoder.finish()));
        frame.present();
    }
}
