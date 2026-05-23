import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';

/// Local-first SQLite — Drift can wrap the same schema in a later pass without changing call sites.
final localDatabaseProvider = FutureProvider<LocalDatabase>((ref) async {
  final dir = await getApplicationDocumentsDirectory();
  final path = p.join(dir.path, 'venext_cache.db');
  final db = await openDatabase(
    path,
    version: 1,
    onCreate: (db, version) async {
      await db.execute('''
        CREATE TABLE IF NOT EXISTS cache_entries (
          k TEXT PRIMARY KEY,
          payload TEXT NOT NULL,
          version INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      ''');
      await db.execute('''
        CREATE TABLE IF NOT EXISTS outbound_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          method TEXT NOT NULL,
          url TEXT NOT NULL,
          body TEXT,
          headers TEXT,
          attempts INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL
        )
      ''');
    },
  );
  return LocalDatabase(db, path);
});

class LocalDatabase {
  LocalDatabase(this._db, this.path);
  final Database _db;
  final String path;

  Database get raw => _db;
}
