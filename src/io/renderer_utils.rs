use crate::structs::color::Color;
use crate::structs::particle::Particle;

// ------ Structs ------
pub struct RenderLayer {
    pub texture: wgpu::Texture,
    pub view: wgpu::TextureView,
}
pub struct RenderGroup {
    pub label: &'static str,
    pub layers: Vec<RenderLayer>,
    pub sampler: wgpu::Sampler,
    pub texture_extent: wgpu::Extent3d,
    pub bind_group: wgpu::BindGroup,
    pub bind_group_layout: wgpu::BindGroupLayout,
    pub pipeline: wgpu::RenderPipeline,
}

// ------ Helper Functions ------

pub fn create_base_render_group(width: u32, height: u32, device: &wgpu::Device, surface_format: wgpu::TextureFormat) -> RenderGroup {
    // Load shader module for the base render group
    let shader: wgpu::ShaderModule = device.create_shader_module(wgpu::include_wgsl!("../shaders/base_composite.wgsl"));

    // Create a sampler
    let sampler: wgpu::Sampler = device.create_sampler(&wgpu::SamplerDescriptor {
        address_mode_u: wgpu::AddressMode::ClampToEdge,
        address_mode_v: wgpu::AddressMode::ClampToEdge,
        address_mode_w: wgpu::AddressMode::ClampToEdge,
        mag_filter: wgpu::FilterMode::Nearest,
        min_filter: wgpu::FilterMode::Nearest,
        ..Default::default()
    });

    // Create a texture extent for the base render group
    let texture_extent = wgpu::Extent3d {
        width: width,
        height: height,
        depth_or_array_layers: 1,
    };

    // Create texture and view for base, effects, and debug layers
    let texture_descriptor: wgpu::TextureDescriptor = wgpu::TextureDescriptor {
        label: Some("Base Render Group Texture"),
        size: texture_extent,
        mip_level_count: 1,
        sample_count: 1,
        dimension: wgpu::TextureDimension::D2,
        format: wgpu::TextureFormat::Bgra8UnormSrgb,
        usage: wgpu::TextureUsages::TEXTURE_BINDING | wgpu::TextureUsages::COPY_DST,
        view_formats: &[],
    };
    let base_texture: wgpu::Texture = device.create_texture(&texture_descriptor);
    let effects_texture: wgpu::Texture = device.create_texture(&texture_descriptor);
    let overlay_texture: wgpu::Texture = device.create_texture(&texture_descriptor);
    let base_texture_view: wgpu::TextureView = base_texture.create_view(&wgpu::TextureViewDescriptor::default());
    let effects_texture_view: wgpu::TextureView = effects_texture.create_view(&wgpu::TextureViewDescriptor::default());
    let overlay_texture_view: wgpu::TextureView = overlay_texture.create_view(&wgpu::TextureViewDescriptor::default());

    // And store them in layers vector
    let layers: Vec<RenderLayer> = vec![
        RenderLayer {
            texture: base_texture,
            view: base_texture_view,
        },
        RenderLayer {
            texture: effects_texture,
            view: effects_texture_view,
        },
        RenderLayer {
            texture: overlay_texture,
            view: overlay_texture_view,
        },
    ];

    // Create a bind group layout (3 texture layer + 1 sampler)
    let bind_group_layout: wgpu::BindGroupLayout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
        label: Some("Base Render Group Layout"),
        entries: &[
            // Base layer
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
            // Effects layer
            wgpu::BindGroupLayoutEntry {
                binding: 1,
                visibility: wgpu::ShaderStages::FRAGMENT,
                ty: wgpu::BindingType::Texture {
                    multisampled: false,
                    view_dimension: wgpu::TextureViewDimension::D2,
                    sample_type: wgpu::TextureSampleType::Float { filterable: false },
                },
                count: None,
            },
            // Overlay layer
            wgpu::BindGroupLayoutEntry {
                binding: 2,
                visibility: wgpu::ShaderStages::FRAGMENT,
                ty: wgpu::BindingType::Texture {
                    multisampled: false,
                    view_dimension: wgpu::TextureViewDimension::D2,
                    sample_type: wgpu::TextureSampleType::Float { filterable: false },
                },
                count: None,
            },
            // Sampler
            wgpu::BindGroupLayoutEntry {
                binding: 3,
                visibility: wgpu::ShaderStages::FRAGMENT,
                ty: wgpu::BindingType::Sampler(wgpu::SamplerBindingType::NonFiltering),
                count: None,
            },
        ],
    });

    // Create bind group (3 texture layer + 1 sampler)
    let bind_group: wgpu::BindGroup = device.create_bind_group(&wgpu::BindGroupDescriptor {
        label: Some("Base Render Group Bind Group"),
        layout: &bind_group_layout,
        entries: &[
            // Base layer
            wgpu::BindGroupEntry {
                binding: 0,
                resource: wgpu::BindingResource::TextureView(&layers[0].view),
            },
            // Effects layer
            wgpu::BindGroupEntry {
                binding: 1,
                resource: wgpu::BindingResource::TextureView(&layers[1].view),
            },
            // Overlay layer
            wgpu::BindGroupEntry {
                binding: 2,
                resource: wgpu::BindingResource::TextureView(&layers[2].view),
            },
            // Sampler
            wgpu::BindGroupEntry {
                binding: 3,
                resource: wgpu::BindingResource::Sampler(&sampler),
            },
        ],
    });

    // Create render pipeline using this layout
    let pipeline: wgpu::RenderPipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
        label: Some("Base Render Group Pipeline"),
        layout: Some(&device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("Base Render Group Pipeline Layout"),
            bind_group_layouts: &[&bind_group_layout],
            push_constant_ranges: &[],
        })),
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
                format: surface_format,
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

    return RenderGroup {
        label: "Base Render Group",
        layers: layers,
        sampler: sampler,
        texture_extent: texture_extent,
        bind_group: bind_group,
        bind_group_layout: bind_group_layout,
        pipeline: pipeline,
    };
}

// pub fn create_brush_render_group(device: &wgpu::Device, surface_format: wgpu::TextureFormat) -> RenderGroup {
//     let shader: wgpu::ShaderModule = device.create_shader_module(wgpu::include_wgsl!("../shaders/brush_indicator.wgsl"));

//     let initial_data = BrushUniform::new();
//     let brush_buffer: wgpu::Buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
//         label: Some("Brush Uniform Buffer"),
//         contents: bytemuck::cast_slice(&[initial_data]),
//         usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
//     });

//     let bind_group_layout: wgpu::BindGroupLayout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
//         label: Some("Brush Render Group Layout"),
//         entries: &[wgpu::BindGroupLayoutEntry {
//             binding: 0,
//             visibility: wgpu::ShaderStages::FRAGMENT,
//             ty: wgpu::BindingType::Buffer {
//                 ty: wgpu::BufferBindingType::Uniform,
//                 has_dynamic_offset: false,
//                 min_binding_size: None,
//             },
//             count: None,
//         }],
//     });

//     let bind_group: wgpu::BindGroup = device.create_bind_group(&wgpu::BindGroupDescriptor {
//         label: Some("Brush Render Group Bind Group"),
//         layout: &bind_group_layout,
//         entries: &[wgpu::BindGroupEntry {
//             binding: 0,
//             resource: brush_buffer.as_binding(),
//         }],
//     });

//     let pipeline_layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
//         label: Some("Brush Render Group Pipeline Layout"),
//         bind_group_layouts: &[&bind_group_layout],
//         push_constant_ranges: &[],
//     });

//     let pipeline: wgpu::RenderPipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
//         label: Some("Brush Render Group Pipeline"),
//         layout: Some(&pipeline_layout),
//         vertex: wgpu::VertexState {
//             module: &shader,
//             entry_point: "vs_main",
//             buffers: &[],
//             compilation_options: wgpu::PipelineCompilationOptions::default(),
//         },
//         fragment: Some(wgpu::FragmentState {
//             module: &shader,
//             entry_point: "fs_main",
//             targets: &[Some(wgpu::ColorTargetState {
//                 format: surface_format,
//                 blend: Some(wgpu::BlendState::ALPHA_BLENDING),
//                 write_mask: wgpu::ColorWrites::ALL,
//             })],
//             compilation_options: wgpu::PipelineCompilationOptions::default(),
//         }),
//         primitive: wgpu::PrimitiveState::default(),
//         depth_stencil: None,
//         multisample: wgpu::MultisampleState::default(),
//         multiview: None,
//     });

//     return RenderGroup {
//         label: "Brush Render Group",
//         layers: vec![],
//         sampler: device.create_sampler(&wgpu::SamplerDescriptor::default()),
//         texture_extent: wgpu::Extent3d::ZERO,
//         bind_group: bind_group,
//         bind_group_layout: bind_group_layout,
//         pipeline: pipeline,
//     };
// }

pub fn process_particles(particles: &[Particle], frame_buffer: &mut [u8], width: usize) {
    if particles.is_empty() {
        return;
    }

    for particle in particles {
        let x: usize = particle.position.x as usize;
        let y: usize = particle.position.y as usize;
        let index: usize = y * width + x;

        // ! Todo: make a function that computes final color or sum shader logic or sumn
        let final_color: Color = particle.color;

        // Write pixel to frame buffer in BGRA format
        let offset = index * 4;
        frame_buffer[offset + 0] = final_color.b;
        frame_buffer[offset + 1] = final_color.g;
        frame_buffer[offset + 2] = final_color.r;
        frame_buffer[offset + 3] = final_color.a;
    }
}
