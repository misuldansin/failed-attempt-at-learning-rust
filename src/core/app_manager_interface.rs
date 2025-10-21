pub trait AppManagerInterface {
    fn new() -> Self
    where
        Self: Sized;
    fn start(&mut self);
}
