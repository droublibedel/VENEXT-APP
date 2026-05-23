import 'dart:convert';

import '../../data/local/local_database.dart';

/// Persistent retry queue for unstable networks (2G/3G/EDGE).
class RetryQueue {
  RetryQueue(this._local);
  final LocalDatabase _local;

  Future<void> enqueueHttp({
    required String method,
    required String url,
    Map<String, dynamic>? body,
    Map<String, String>? headers,
  }) async {
    await _local.raw.insert('outbound_queue', {
      'method': method,
      'url': url,
      'body': body == null ? null : jsonEncode(body),
      'headers': headers == null ? null : jsonEncode(headers),
      'created_at': DateTime.now().millisecondsSinceEpoch,
    });
  }
}
