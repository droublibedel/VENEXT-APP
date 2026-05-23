import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../core/offline/retry_queue.dart';
import '../../core/sync/resilient_sync_engine.dart';
import '../../data/local/local_database.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String _status = 'initializing';

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final db = await ref.read(localDatabaseProvider.future);
    final queue = RetryQueue(db);
    final api = buildResilientApiClient(queue);
    final sync = ResilientSyncEngine(api: api, queue: queue);
    await sync.warmCacheHint();
    if (!mounted) return;
    setState(() => _status = 'ready (${db.path})');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('VENEXT'),
        actions: [
          TextButton(
            onPressed: () => context.push('/profile'),
            child: const Text('Profile'),
          ),
        ],
      ),
      body: Center(
        child: Text(
          'Mobile foundation\n$_status',
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
