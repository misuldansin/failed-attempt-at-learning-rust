use crate::core::app_manager_interface::AppManagerInterface;

pub struct WebAppManager {
    // ..
}

impl AppManagerInterface for WebAppManager {
    fn new() -> WebAppManager {
        return WebAppManager {};
    }

    fn start(&mut self) {
        //
    }
}
