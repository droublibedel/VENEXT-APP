import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class CorrelationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<{ headers: Record<string, string> }>();
    const res = http.getResponse<{ setHeader: (k: string, v: string) => void }>();
    const cid = req.headers["x-correlation-id"] ?? randomUUID();
    req.headers["x-correlation-id"] = cid;
    res.setHeader("x-correlation-id", cid);
    const started = performance.now();
    return next.handle().pipe(
      tap(() => {
        const durationMs = performance.now() - started;
        res.setHeader("x-server-timing", `total;dur=${durationMs.toFixed(1)}`);
      }),
    );
  }
}
