#[cfg(desktop)]
mod desktop;

#[cfg(mobile)]
mod mobile;

#[cfg(desktop)]
pub use desktop::*;

#[cfg(mobile)]
pub use mobile::*;