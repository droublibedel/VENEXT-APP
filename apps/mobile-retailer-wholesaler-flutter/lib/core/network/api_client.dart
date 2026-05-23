import 'package:dio/dio.dart';
import 'package:dio_smart_retry/dio_smart_retry.dart';

import '../offline/retry_queue.dart';

Dio buildResilientApiClient(RetryQueue queue) {
  final dio = Dio(
    BaseOptions(
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 45),
      baseUrl: const String.fromEnvironment(
        'VENEXT_API_BASE',
        defaultValue: 'https://api.venext.local/',
      ),
    ),
  );
  dio.interceptors.add(
    RetryInterceptor(
      dio: dio,
      logPrint: (_) {},
      retries: 4,
      retryDelays: const [
        Duration(seconds: 1),
        Duration(seconds: 3),
        Duration(seconds: 8),
        Duration(seconds: 20),
      ],
    ),
  );
  dio.interceptors.add(
    InterceptorsWrapper(
      onError: (e, handler) async {
        final req = e.requestOptions;
        if (req.extra['enqueue_on_fail'] == true) {
          await queue.enqueueHttp(
            method: req.method,
            url: req.uri.toString(),
            body: req.data is Map<String, dynamic>
                ? req.data as Map<String, dynamic>
                : null,
            headers: req.headers.map(
              (k, v) => MapEntry(k, v.join(',')),
            ),
          );
        }
        handler.next(e);
      },
    ),
  );
  return dio;
}
