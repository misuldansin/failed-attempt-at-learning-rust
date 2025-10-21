pub mod core;
pub mod io;
pub mod loader;
pub mod settings;
pub mod structs;

use core::app_manager_interface::AppManagerInterface;
use core::native_app_manager::NativeAppManager;
use core::web_app_manager::WebAppManager;
use settings::Settings;

fn main() {
    #[cfg(target_arch = "wasm32")]
    let mut app_manager = WebAppManager::new();

    #[cfg(not(target_arch = "wasm32"))]
    let mut app_manager = NativeAppManager::new();

    // Initialise application
    app_manager.start();
}
