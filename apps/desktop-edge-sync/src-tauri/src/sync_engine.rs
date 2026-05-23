use crate::sqlite_store;

pub struct SyncEngine {
    path: std::path::PathBuf,
}

impl SyncEngine {
    pub fn new(path: std::path::PathBuf) -> Self {
        Self { path }
    }

    pub fn describe(&self) -> String {
        match sqlite_store::ensure_schema(&self.path) {
            Ok(_) => format!("edge-sync:ok db={}", self.path.display()),
            Err(e) => format!("edge-sync:error {e}"),
        }
    }
}
