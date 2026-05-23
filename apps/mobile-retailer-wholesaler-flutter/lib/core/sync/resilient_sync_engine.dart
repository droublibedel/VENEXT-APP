import 'package:dio/dio.dart';

import '../offline/retry_queue.dart';

/// Background sync coordinator — pulls deltas, drains queue, respects battery/data saver flags later.
class ResilientSyncEngine {
  ResilientSyncEngine({required this.api, required this.queue});
  final Dio api;
  final RetryQueue queue;

  Future<void> warmCacheHint() async {
    // Placeholder warm path — real sync consumes relationship-scoped deltas only.
    await Future<void>.delayed(Duration.zero);
  }
}
