use std::path::PathBuf;

pub fn db_path() -> PathBuf {
    let mut p = dirs_next();
    p.push("venext_edge.sqlite");
    p
}

fn dirs_next() -> PathBuf {
    std::env::var("HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."))
        .join(".venext")
}

pub fn ensure_schema(path: &PathBuf) -> rusqlite::Result<rusqlite::Connection> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).ok();
    }
    let conn = rusqlite::Connection::open(path)?;
    conn.execute_batch(
        r"
        CREATE TABLE IF NOT EXISTS sync_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_kind TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            payload TEXT NOT NULL,
            vector_clock TEXT NOT NULL DEFAULT '{}',
            state TEXT NOT NULL DEFAULT 'pending'
        );
        CREATE TABLE IF NOT EXISTS upload_checkpoints (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            cursor TEXT
        );
    ",
    )?;
    Ok(conn)
}
