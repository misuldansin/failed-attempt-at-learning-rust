use pollster::block_on;
use std::sync::Arc;
use wgpu::core::instance;
use wgpu::core::present::ConfigureSurfaceError;
use wgpu::{
    Adapter, BindGroup, BindGroupLayout, CommandEncoder, Device, Extent3d, Instance, Queue, RenderPass,
    RenderPassDescriptor, RenderPipeline, RequestAdapterOptions, Sampler, Surface, SurfaceConfiguration,
    SurfaceTexture, Texture, TextureDescriptor, TextureView, naga::valid,
};
use winit::window::Window;

use crate::io::renderer_interface::RendererInterface;
use crate::structs::particle::Particle;

pub struct NativeRenderer {
    width: usize,
    height: usize,
    pixel_buffer: Vec<u8>,
    queued_particles: Vec<Particle>,
    surface: Surface<'static>,
    device: Device,
    queue: Queue,
    config: SurfaceConfiguration,

    texture_extent: wgpu::Extent3d,
    texture: wgpu::Texture,
    texture_view: wgpu::TextureView,
    bind_group: wgpu::BindGroup,
    render_pipeline: wgpu::RenderPipeline,
}

impl NativeRenderer {
    pub fn new(width: usize, height: usize, window: &Arc<Window>) -> NativeRenderer {
        let leaked_window: &Window = Box::leak(Box::new(window.clone()));

        // Initialise WGPU
        let instance: Instance = Instance::default();
        let surface: Surface<'static> =
            unsafe { instance.create_surface(leaked_window) }.expect("Failed to create surface");
        let adapter: Adapter = block_on(instance.request_adapter(&RequestAdapterOptions {
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
        let mut config = wgpu::SurfaceConfiguration {
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
            format: surface.get_capabilities(&adapter).formats[0],
            width: width as u32,
            height: height as u32,
            present_mode: wgpu::PresentMode::Fifo,
            alpha_mode: wgpu::CompositeAlphaMode::Auto,
            view_formats: vec![],
            desired_maximum_frame_latency: 2,
        };
        surface.configure(&device, &config);

        // Create and initilise texture and pipeline for WGPU
        let texture_extent = Extent3d {
            width: width as u32,
            height: height as u32,
            depth_or_array_layers: 1,
        };

        let (texture, texture_view) = Self::create_texture(&device, texture_extent);
        let (bind_group_layout, bind_group) = Self::create_bind_group(&device, &texture_view);
        let render_pipeline: RenderPipeline = Self::create_render_pipeline(&device, &config, &bind_group_layout);

        let mut renderer = NativeRenderer {
            width: width,
            height: height,
            pixel_buffer: vec![0; width * height * 4],
            queued_particles: Vec::new(),
            surface: surface,
            device: device,
            queue: queue,
            config: config,

            texture_extent: texture_extent,
            texture: texture,
            texture_view: texture_view,
            bind_group: bind_group,
            render_pipeline: render_pipeline,
        };

        renderer.render_frame();
        return renderer;
    }

    fn create_texture(device: &Device, texture_extent: Extent3d) -> (Texture, TextureView) {
        let texture = device.create_texture(&wgpu::TextureDescriptor {
            label: Some("Frame Texture"),
            size: texture_extent,
            mip_level_count: 1,
            sample_count: 1,
            dimension: wgpu::TextureDimension::D2,
            format: wgpu::TextureFormat::Bgra8UnormSrgb,
            usage: wgpu::TextureUsages::TEXTURE_BINDING | wgpu::TextureUsages::COPY_DST,
            view_formats: &[],
        });
        let texture_view = texture.create_view(&wgpu::TextureViewDescriptor::default());

        return (texture, texture_view);
    }

    fn create_bind_group(device: &Device, texture_view: &TextureView) -> (BindGroupLayout, BindGroup) {
        let sampler = device.create_sampler(&wgpu::SamplerDescriptor {
            address_mode_u: wgpu::AddressMode::ClampToEdge,
            address_mode_v: wgpu::AddressMode::ClampToEdge,
            address_mode_w: wgpu::AddressMode::ClampToEdge,
            mag_filter: wgpu::FilterMode::Nearest,
            min_filter: wgpu::FilterMode::Nearest,
            ..Default::default()
        });

        let bind_group_layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("Texture BindGroup Layout"),
            entries: &[
                wgpu::BindGroupLayoutEntry {
                    binding: 0,
                    visibility: wgpu::ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Texture {
                        multisampled: false,
                        view_dimension: wgpu::TextureViewDimension::D2,
                        sample_type: wgpu::TextureSampleType::Float { filterable: false },
                    },
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 1,
                    visibility: wgpu::ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Sampler(wgpu::SamplerBindingType::NonFiltering),
                    count: None,
                },
            ],
        });

        let bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: Some("Texture BindGroup"),
            layout: &bind_group_layout,
            entries: &[
                wgpu::BindGroupEntry {
                    binding: 0,
                    resource: wgpu::BindingResource::TextureView(texture_view),
                },
                wgpu::BindGroupEntry {
                    binding: 1,
                    resource: wgpu::BindingResource::Sampler(&sampler),
                },
            ],
        });

        return (bind_group_layout, bind_group);
    }

    fn create_render_pipeline(
        device: &Device,
        surface_config: &SurfaceConfiguration,
        bind_group_layout: &BindGroupLayout,
    ) -> RenderPipeline {
        let shader = device.create_shader_module(wgpu::include_wgsl!("../shaders/fullscreen.wgsl"));

        let pipeline_layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("Render Pipeline Layout"),
            bind_group_layouts: &[bind_group_layout],
            push_constant_ranges: &[],
        });

        let render_pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("Render Pipeline"),
            layout: Some(&pipeline_layout),
            vertex: wgpu::VertexState {
                module: &shader,
                entry_point: "vs_main",
                buffers: &[],
                compilation_options: wgpu::PipelineCompilationOptions::default(),
            },
            fragment: Some(wgpu::FragmentState {
                module: &shader,
                entry_point: "fs_main",
                targets: &[Some(wgpu::ColorTargetState {
                    format: surface_config.format,
                    blend: Some(wgpu::BlendState::REPLACE),
                    write_mask: wgpu::ColorWrites::ALL,
                })],
                compilation_options: wgpu::PipelineCompilationOptions::default(),
            }),
            primitive: wgpu::PrimitiveState::default(),
            depth_stencil: None,
            multisample: wgpu::MultisampleState::default(),
            multiview: None,
        });

        return render_pipeline;
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
    fn width(&self) -> usize {
        return self.width;
    }

    fn height(&self) -> usize {
        return self.height;
    }

    fn render_frame(&mut self) {
        // Process this frame queued particles
        self.process_queued_particles();

        // Upload pixel buffer to the texture
        self.queue.write_texture(
            wgpu::ImageCopyTexture {
                texture: &self.texture,
                mip_level: 0,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            &self.pixel_buffer,
            wgpu::ImageDataLayout {
                offset: 0,
                bytes_per_row: Some(4 * self.width as u32),
                rows_per_image: Some(self.height as u32),
            },
            self.texture_extent,
        );

        // Get a new surface frame
        let frame: SurfaceTexture = match self.surface.get_current_texture() {
            Ok(val) => val,
            Err(wgpu::SurfaceError::Lost | wgpu::SurfaceError::Outdated) => {
                // Reconfigure surface on lost..
                self.resize(self.config.width, self.config.height);
                return; // ..And skip this frame
            }
            Err(wgpu::SurfaceError::OutOfMemory) => {
                panic!("GPU ran out of memory!");
            }
            Err(e) => {
                eprintln!("Failed to acquire next swapchain texture: {:?}", e);
                return;
            }
        };

        let view: TextureView = frame.texture.create_view(&wgpu::TextureViewDescriptor::default());

        // Encode render pass
        let mut encoder: CommandEncoder = self.device.create_command_encoder(&wgpu::CommandEncoderDescriptor {
            label: Some("Render Encoder"),
        });

        {
            let mut render_pass: RenderPass<'_> = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                label: Some("Render Pass"),
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

            render_pass.set_pipeline(&self.render_pipeline);
            render_pass.set_bind_group(0, &self.bind_group, &[]);
            render_pass.draw(0..6, 0..1);
        }

        // Submit GPU commands and present frame
        self.queue.submit(Some(encoder.finish()));
        frame.present();
    }

    fn process_queued_particles(&mut self) {
        if self.queued_particles.len() == 0 {
            return;
        }

        for particle in &self.queued_particles {
            let index: usize = particle.position.y as usize * self.width + particle.position.x as usize;

            // Pass the pixel buffer in BGRA format
            self.pixel_buffer[index * 4 + 0] = particle.color.b;
            self.pixel_buffer[index * 4 + 1] = particle.color.g;
            self.pixel_buffer[index * 4 + 2] = particle.color.r;
            self.pixel_buffer[index * 4 + 3] = particle.color.a;
        }

        // Done processing, clear queue for next frame
        self.queued_particles.clear();
    }

    fn queue_particles(&mut self, particles_to_queue: &[Particle]) {
        if particles_to_queue.is_empty() {
            return;
        }

        // Reserve allocation space
        self.queued_particles.reserve(particles_to_queue.len());

        // Copy and append particles
        for particle in particles_to_queue {
            self.queued_particles.push(particle.clone());
        }
    }
}
